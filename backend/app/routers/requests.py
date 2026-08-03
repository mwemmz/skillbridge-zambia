from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import ServiceRequest, User, Worker
from ..schemas import RequestCreate, RequestOut, RequestStatusUpdate
from ..serializers import haversine_km

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
    if not worker.availability:
        raise HTTPException(status_code=400, detail="Worker is currently offline")

    req = ServiceRequest(
        customer_id=current_user.id,
        worker_id=worker.id,
        description=payload.description,
        latitude=payload.latitude or worker.latitude,
        longitude=payload.longitude or worker.longitude,
        status="REQUESTED",
    )
    db.add(req)
    db.commit()
    db.refresh(req)
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
