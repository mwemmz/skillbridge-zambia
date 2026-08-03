from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import require_role
from ..models import Skill, User, Worker
from ..schemas import (
    AdminStats,
    RequestOut,
    SkillCreate,
    SkillOut,
    VerificationUpdate,
    WorkerOut,
)
from ..serializers import worker_to_dict
from .requests import request_to_dict

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_role("admin"))])


@router.get("/stats", response_model=AdminStats)
def stats(db: Session = Depends(get_db)):
    from ..models import ServiceRequest

    customers = db.query(User).filter(User.role == "customer").count()
    workers = db.query(Worker).count()
    requests = db.query(ServiceRequest).count()
    pending = (
        db.query(Worker)
        .join(Worker.verification, isouter=True)
        .filter(
            (Worker.verification.has(identity_verified=False))
            | (Worker.verification.has(certificate_verified=False))
            | (Worker.verification.has(compliance_verified=False))
        )
        .count()
    )
    online = db.query(Worker).filter(Worker.availability.is_(True)).count()
    return AdminStats(
        customers=customers,
        workers=workers,
        requests=requests,
        pending_verification=pending,
        online_workers=online,
    )


@router.get("/workers", response_model=list[WorkerOut])
def admin_workers(db: Session = Depends(get_db)):
    workers = db.query(Worker).order_by(Worker.id).all()
    return [worker_to_dict(w) for w in workers]


@router.put("/workers/{worker_id}/verification", response_model=WorkerOut)
def update_verification(
    worker_id: int,
    payload: VerificationUpdate,
    db: Session = Depends(get_db),
):
    worker = db.get(Worker, worker_id)
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    if not worker.verification:
        raise HTTPException(status_code=404, detail="Worker has no verification record")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(worker.verification, field, value)
    db.commit()
    db.refresh(worker)
    return worker_to_dict(worker)


@router.get("/requests", response_model=list[RequestOut])
def admin_requests(db: Session = Depends(get_db)):
    from ..models import ServiceRequest

    reqs = db.query(ServiceRequest).order_by(ServiceRequest.created_at.desc()).all()
    return [request_to_dict(r) for r in reqs]


@router.get("/skills", response_model=list[SkillOut])
def admin_skills(db: Session = Depends(get_db)):
    return db.query(Skill).order_by(Skill.name).all()


@router.post("/skills", response_model=SkillOut)
def create_skill(payload: SkillCreate, db: Session = Depends(get_db)):
    existing = db.query(Skill).filter(Skill.name.ilike(payload.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Skill already exists")
    skill = Skill(name=payload.name)
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill
