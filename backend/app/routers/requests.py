from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..domain import (
    confirm_job,
    crew_available_at,
    is_job_confirmed,
    refresh_area_stats,
    worker_busy_at,
)
from ..models import Crew, ServiceRequest, User, Worker
from ..schemas import RequestConfirm, RequestCreate, RequestOut, RequestStatusUpdate

router = APIRouter(prefix="/requests", tags=["requests"])

ALLOWED_STATUSES = {"REQUESTED", "ACCEPTED", "ON_THE_WAY", "COMPLETED", "DECLINED", "CANCELLED"}
WORKER_STATUSES = {"ACCEPTED", "ON_THE_WAY", "COMPLETED", "DECLINED"}
CUSTOMER_STATUSES = {"CANCELLED"}


def request_to_dict(req: ServiceRequest) -> dict:
    return {
        "id": req.id,
        "customer_id": req.customer_id,
        "customer_name": req.customer.name,
        "worker_id": req.worker_id,
        "worker_name": req.worker.user.name,
        "worker_skill": req.worker.skill.name if req.worker.skill else None,
        "worker_latitude": req.worker.latitude,
        "worker_longitude": req.worker.longitude,
        "description": req.description,
        "latitude": req.latitude,
        "longitude": req.longitude,
        "status": req.status,
        "crew_id": req.crew_id,
        "crew_name": req.crew.name if req.crew else None,
        "job_type": req.job_type or "booking",
        "scheduled_for": req.scheduled_for,
        "price": req.price,
        "rating": req.rating,
        "confirmed": is_job_confirmed(req),
        "customer_confirmed": bool(req.customer_confirmed),
        "confirmed_at": req.confirmed_at,
        "confirmations": [
            {
                "confirmer_name": c.confirmer.name,
                "role": c.role,
                "rating": c.rating,
                "note": c.note,
                "created_at": c.created_at,
            }
            for c in req.confirmations
        ],
        "created_at": req.created_at,
    }


@router.post("", response_model=RequestOut)
def create_request(
    payload: RequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "customer":
        raise HTTPException(status_code=403, detail="Only customers can create requests")

    worker = db.get(Worker, payload.worker_id)
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    crew = None
    if payload.crew_id:
        crew = db.get(Crew, payload.crew_id)
        if not crew:
            raise HTTPException(status_code=404, detail="Crew not found")
        if worker.id not in [m.worker_id for m in crew.members]:
            raise HTTPException(status_code=400, detail="Worker is not a member of this crew")
        if not crew_available_at(db, crew, payload.scheduled_for):
            raise HTTPException(
                status_code=400, detail="One or more crew members are unavailable at that time"
            )
    else:
        if not worker.availability:
            raise HTTPException(status_code=400, detail="Worker is currently offline")
        if worker_busy_at(db, worker.id, payload.scheduled_for):
            raise HTTPException(status_code=400, detail="Worker is already booked at that time")

    req = ServiceRequest(
        customer_id=current_user.id,
        worker_id=worker.id,
        crew_id=crew.id if crew else None,
        description=payload.description,
        latitude=payload.latitude or worker.latitude,
        longitude=payload.longitude or worker.longitude,
        status="REQUESTED",
        job_type=payload.job_type or "booking",
        scheduled_for=payload.scheduled_for,
        price=payload.price,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    refresh_area_stats(db)
    db.commit()
    return request_to_dict(req)


@router.get("/my", response_model=list[RequestOut])
def my_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reqs = (
        db.query(ServiceRequest)
        .filter(ServiceRequest.customer_id == current_user.id)
        .order_by(ServiceRequest.created_at.desc())
        .all()
    )
    return [request_to_dict(r) for r in reqs]


@router.get("/for-me", response_model=list[RequestOut])
def requests_for_worker(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
    if not worker:
        raise HTTPException(status_code=403, detail="Only workers can view this")
    reqs = (
        db.query(ServiceRequest)
        .filter(ServiceRequest.worker_id == worker.id)
        .order_by(ServiceRequest.created_at.desc())
        .all()
    )
    return [request_to_dict(r) for r in reqs]


@router.get("/{request_id}", response_model=RequestOut)
def get_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = db.get(ServiceRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    return request_to_dict(req)


@router.put("/{request_id}/status", response_model=RequestOut)
def update_status(
    request_id: int,
    payload: RequestStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = db.get(ServiceRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    status = payload.status.upper()
    if status not in ALLOWED_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status: {payload.status}")

    worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()

    if current_user.role == "worker" and worker and worker.id == req.worker_id:
        if status not in WORKER_STATUSES:
            raise HTTPException(status_code=400, detail="Workers cannot set this status")
    elif current_user.role == "customer" and current_user.id == req.customer_id:
        if status not in CUSTOMER_STATUSES:
            raise HTTPException(status_code=400, detail="Customers can only cancel requests")
    else:
        raise HTTPException(status_code=403, detail="Not authorized for this request")

    req.status = status
    db.commit()
    db.refresh(req)
    return request_to_dict(req)


@router.post("/{request_id}/confirm", response_model=RequestOut)
def confirm_request(
    request_id: int,
    payload: RequestConfirm,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Independent job confirmation. Customer rates; a co-worker witnesses.

    The assigned worker can never confirm their own job (no self-reporting).
    """
    req = db.get(ServiceRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()

    if current_user.role == "customer" and current_user.id == req.customer_id:
        role = "customer"
    elif current_user.role == "worker" and worker and worker.id != req.worker_id:
        role = "co_worker"
    else:
        raise HTTPException(
            status_code=403,
            detail="You cannot confirm this job (the assigned worker cannot self-confirm)",
        )

    try:
        confirm_job(
            db,
            req,
            current_user,
            role,
            rating=payload.rating if role == "customer" else None,
            note=payload.note or "",
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    db.commit()
    db.refresh(req)
    return request_to_dict(req)
