from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..domain import crew_available_at, supply_gaps, worker_busy_at
from ..models import Crew, Skill, User, Worker
from ..schemas import MatchFind, MatchingResult, SupplyGapOut, WorkerOut
from ..serializers import haversine_km, worker_to_dict
from .crews import crew_to_dict

router = APIRouter(prefix="/matching", tags=["matching"])


def _score(worker: Worker, distance_km: float, busy: bool) -> float:
    """Ranking heuristic: rating + verification premium + availability, minus distance."""
    score = worker.rating * 10
    if worker.is_verified:
        score += 15
    if worker.availability and not busy:
        score += 10
    score -= distance_km
    return round(score, 2)


@router.get("/workers", response_model=list[WorkerOut])
def match_workers(
    lat: float,
    lng: float,
    skill: str | None = None,
    radius_km: float = 25,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Worker).join(User)
    if skill:
        query = query.join(Skill).filter(Skill.name.ilike(f"%{skill}%"))
    result = []
    for w in query.all():
        distance = haversine_km(lat, lng, w.latitude, w.longitude)
        if distance > radius_km:
            continue
        busy = worker_busy_at(db, w.id, None)
        item = worker_to_dict(w, lat, lng)
        item["_score"] = _score(w, distance, busy)
        result.append(item)
    result.sort(key=lambda item: item["_score"], reverse=True)
    for item in result:
        item.pop("_score", None)
    return result


@router.post("/find", response_model=MatchingResult)
def find_matches(
    payload: MatchFind,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workers = []
    query = db.query(Worker).join(User)
    if payload.skill:
        query = query.join(Skill).filter(Skill.name.ilike(f"%{payload.skill}%"))
    for w in query.all():
        distance = haversine_km(payload.latitude, payload.longitude, w.latitude, w.longitude)
        if distance > payload.radius_km:
            continue
        busy = worker_busy_at(db, w.id, payload.scheduled_for)
        item = worker_to_dict(w, payload.latitude, payload.longitude)
        item["_score"] = _score(w, distance, busy)
        workers.append(item)
    workers.sort(key=lambda item: item["_score"], reverse=True)
    for item in workers:
        item.pop("_score", None)

    crews = []
    for crew in db.query(Crew).all():
        distance = haversine_km(
            payload.latitude, payload.longitude, crew.members[0].worker.latitude
            if crew.members
            else payload.latitude,
            crew.members[0].worker.longitude
            if crew.members
            else payload.longitude,
        )
        if distance > payload.radius_km:
            continue
        if not crew_available_at(db, crew, payload.scheduled_for):
            continue
        crews.append(crew_to_dict(crew))

    return {"workers": workers, "crews": crews}


@router.get("/opportunities", response_model=list[SupplyGapOut])
def opportunities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Unmet demand near the worker, derived from the area job stats."""
    worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
    if not worker:
        raise HTTPException(status_code=403, detail="Only workers can view opportunities")
    gaps = supply_gaps(db)
    gaps.sort(
        key=lambda g: haversine_km(worker.latitude, worker.longitude, g["latitude"], g["longitude"])
    )
    return gaps[:10]
