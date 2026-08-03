from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import Skill, User, Worker
from ..schemas import SkillOut, WorkerOut, WorkerUpdate
from ..serializers import worker_to_dict

router = APIRouter(prefix="/workers", tags=["workers"])


@router.get("", response_model=list[WorkerOut])
def list_workers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skill: str | None = Query(default=None),
):
    query = db.query(Worker).join(User)
    if skill:
        query = query.join(Skill).filter(Skill.name.ilike(f"%{skill}%"))
    workers = query.order_by(Worker.rating.desc()).all()
    return [worker_to_dict(w) for w in workers]


@router.get("/nearby", response_model=list[WorkerOut])
def nearby_workers(
    lat: float,
    lng: float,
    skill: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
        raise HTTPException(status_code=422, detail="lat must be in [-90, 90] and lng in [-180, 180]")
    query = db.query(Worker).join(User)
    if skill:
        query = query.join(Skill).filter(Skill.name.ilike(f"%{skill}%"))
    workers = query.all()
    result = [worker_to_dict(w, lat, lng) for w in workers]
    result.sort(
        key=lambda w: (w["availability"] is False, w["distance_km"] or 999999)
    )
    return result


@router.get("/me", response_model=WorkerOut)
def my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker profile not found")
    return worker_to_dict(worker)


@router.put("/me", response_model=WorkerOut)
def update_my_profile(
    payload: WorkerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker profile not found")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(worker, field, value)
    db.commit()
    db.refresh(worker)
    return worker_to_dict(worker)


@router.get("/skills", response_model=list[SkillOut])
def list_skills(db: Session = Depends(get_db)):
    return db.query(Skill).order_by(Skill.name).all()


@router.get("/{worker_id}", response_model=WorkerOut)
def get_worker(
    worker_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    worker = db.get(Worker, worker_id)
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    return worker_to_dict(worker)
