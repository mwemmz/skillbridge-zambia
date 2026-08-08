"""Domain helpers for the new data layer: job confirmation, derived ratings,
crew availability and geographic job-density tracking."""

from collections import defaultdict
from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from .models import (
    AreaJobStat,
    Crew,
    JobConfirmation,
    ServiceRequest,
    Worker,
)

ACTIVE_STATUSES = ("REQUESTED", "ACCEPTED", "ON_THE_WAY")
JOB_WINDOW_HOURS = 4  # a job occupies a 4h window around its scheduled time
CELL_DEG = 0.01  # ~1.1km heatmap cell


def sync_worker_verified(worker: Worker) -> None:
    """A worker is 'verified' only when identity, certificate and compliance pass."""
    v = worker.verification
    worker.is_verified = bool(
        v and v.identity_verified and v.certificate_verified and v.compliance_verified
    )


# ---------- Worker passport / derived rating ----------


def confirmed_jobs_for_worker(db: Session, worker_id: int):
    """Jobs that actually happened: customer-confirmed only (no self-reporting)."""
    return (
        db.query(ServiceRequest)
        .filter(ServiceRequest.worker_id == worker_id)
        .filter(ServiceRequest.customer_confirmed.is_(True))
        .order_by(ServiceRequest.confirmed_at.desc())
        .all()
    )


def derived_rating(db: Session, worker: Worker) -> float:
    """Rating computed exclusively from customer-confirmed jobs."""
    ratings = [r.rating for r in confirmed_jobs_for_worker(db, worker.id) if r.rating]
    if not ratings:
        return worker.rating or 5.0
    return round(sum(ratings) / len(ratings), 2)


def recompute_worker_rating(db: Session, worker: Worker) -> float:
    worker.rating = derived_rating(db, worker)
    return worker.rating


# ---------- Availability ----------


def worker_busy_at(db: Session, worker_id: int, when: datetime | None) -> bool:
    """True if the worker has an active job scheduled inside the window around `when`."""
    if when is None:
        return False
    lo, hi = when - timedelta(hours=JOB_WINDOW_HOURS), when + timedelta(hours=JOB_WINDOW_HOURS)
    count = (
        db.query(func.count(ServiceRequest.id))
        .filter(ServiceRequest.worker_id == worker_id)
        .filter(ServiceRequest.status.in_(ACTIVE_STATUSES))
        .filter(ServiceRequest.scheduled_for.isnot(None))
        .filter(ServiceRequest.scheduled_for >= lo, ServiceRequest.scheduled_for <= hi)
        .scalar()
    )
    return bool(count)


def crew_available_at(db: Session, crew: Crew, when: datetime | None) -> bool:
    """A crew is bookable only if EVERY member is free at the requested time."""
    if not crew.members:
        return False
    for member in crew.members:
        if not member.worker.availability:
            return False
        if worker_busy_at(db, member.worker_id, when):
            return False
    return True


# ---------- Job confirmation ----------


def is_job_confirmed(request: ServiceRequest) -> bool:
    co_workers = [c for c in request.confirmations if c.role == "co_worker"]
    return bool(request.customer_confirmed and co_workers)


def confirm_job(
    db: Session,
    request: ServiceRequest,
    confirmer,
    role: str,
    rating: int | None = None,
    note: str = "",
) -> JobConfirmation:
    """Record an independent confirmation.

    - customer: marks the job as happening and contributes the rating.
    - co_worker: peer witness. The assigned worker can never confirm their own job.
    A job is fully confirmed once the customer AND a co-worker confirm it.
    """
    if request.status != "COMPLETED":
        raise ValueError("Only completed jobs can be confirmed")

    existing = (
        db.query(JobConfirmation)
        .filter(
            JobConfirmation.request_id == request.id,
            JobConfirmation.confirmer_id == confirmer.id,
        )
        .first()
    )
    if existing:
        raise ValueError("You have already confirmed this job")

    conf = JobConfirmation(
        request_id=request.id,
        confirmer_id=confirmer.id,
        role=role,
        rating=rating,
        note=note or "",
    )
    db.add(conf)

    if role == "customer":
        request.customer_confirmed = True
        if rating is not None:
            request.rating = rating

    db.flush()
    if is_job_confirmed(request) and request.confirmed_at is None:
        request.confirmed_at = datetime.utcnow()

    db.flush()
    recompute_worker_rating(db, request.worker)
    return conf


def crew_rating(crew: Crew) -> float:
    ratings = [m.worker.rating for m in crew.members if m.worker]
    if not ratings:
        return 0.0
    return round(sum(ratings) / len(ratings), 2)


# ---------- Geographic job density ----------


def _cell(coord: float) -> float:
    return round(coord / CELL_DEG) * CELL_DEG


def job_density_rows(db: Session, lat: float, lng: float, radius_km: float = 15):
    """Live heatmap: active jobs and online workers bucketed into ~1km cells."""
    import math

    dlat = radius_km / 111.0
    dlng = radius_km / (111.0 * max(math.cos(math.radians(lat)), 0.01))

    reqs = (
        db.query(ServiceRequest.latitude, ServiceRequest.longitude)
        .filter(ServiceRequest.latitude.between(lat - dlat, lat + dlat))
        .filter(ServiceRequest.longitude.between(lng - dlng, lng + dlng))
        .filter(ServiceRequest.status.in_(ACTIVE_STATUSES))
        .all()
    )
    online = (
        db.query(Worker.latitude, Worker.longitude)
        .filter(Worker.latitude.between(lat - dlat, lat + dlat))
        .filter(Worker.longitude.between(lng - dlng, lng + dlng))
        .filter(Worker.availability.is_(True))
        .all()
    )

    job_cells: dict[tuple[float, float], int] = defaultdict(int)
    for rlat, rlng in reqs:
        job_cells[(_cell(rlat), _cell(rlng))] += 1
    worker_cells: dict[tuple[float, float], int] = defaultdict(int)
    for wlat, wlng in online:
        worker_cells[(_cell(wlat), _cell(wlng))] += 1

    rows = []
    for cell in set(job_cells) | set(worker_cells):
        rows.append(
            {
                "latitude": cell[0],
                "longitude": cell[1],
                "job_count": job_cells.get(cell, 0),
                "active_workers": worker_cells.get(cell, 0),
            }
        )
    return rows


def refresh_area_stats(db: Session) -> None:
    """Recompute the persisted AreaJobStat rollups from live tables."""
    job_cells: dict[tuple[float, float], int] = defaultdict(int)
    worker_cells: dict[tuple[float, float], int] = defaultdict(int)

    for rlat, rlng in db.query(ServiceRequest.latitude, ServiceRequest.longitude).all():
        if rlat is not None and rlng is not None:
            job_cells[(_cell(rlat), _cell(rlng))] += 1
    for wlat, wlng in (
        db.query(Worker.latitude, Worker.longitude).filter(Worker.availability.is_(True)).all()
    ):
        if wlat is not None and wlng is not None:
            worker_cells[(_cell(wlat), _cell(wlng))] += 1

    existing = {s.area_name: s for s in db.query(AreaJobStat).all()}
    for cell in set(job_cells) | set(worker_cells):
        name = f"{cell[0]:.2f},{cell[1]:.2f}"
        stat = existing.get(name)
        if stat is None:
            stat = AreaJobStat(area_name=name, latitude=cell[0], longitude=cell[1])
            db.add(stat)
        stat.job_count = job_cells.get(cell, 0)
        stat.active_workers = worker_cells.get(cell, 0)
        stat.updated_at = datetime.utcnow()
    db.flush()


def supply_gaps(db: Session, min_jobs: int = 3):
    """Areas where demand (jobs) clearly outstrips supply (online workers)."""
    stats = (
        db.query(AreaJobStat)
        .filter(AreaJobStat.job_count >= min_jobs)
        .order_by(AreaJobStat.job_count.desc())
        .all()
    )
    gaps = []
    for s in stats:
        if s.active_workers < s.job_count:
            gaps.append(
                {
                    "area_name": s.area_name,
                    "latitude": s.latitude,
                    "longitude": s.longitude,
                    "job_count": s.job_count,
                    "active_workers": s.active_workers,
                    "gap": s.job_count - s.active_workers,
                }
            )
    return gaps
