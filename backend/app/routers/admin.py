from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import require_role
from ..domain import sync_worker_verified
from ..models import Crew, ServiceRequest, Skill, User, Worker, WorkerCertification
from ..schemas import (
    AdminStats,
    CertificationOut,
    CertificationReview,
    RequestOut,
    SkillCreate,
    SkillOut,
    VerificationUpdate,
    WorkerOut,
)
from ..serializers import worker_to_dict
from ..services.identity import get_identity_verifier
from .requests import request_to_dict

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_role("admin"))])


@router.get("/stats", response_model=AdminStats)
def stats(db: Session = Depends(get_db)):
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
        crews=db.query(Crew).count(),
        pending_certifications=(
            db.query(WorkerCertification).filter(WorkerCertification.status == "PENDING").count()
        ),
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

    if updates.get("identity_verified"):
        result = get_identity_verifier().verify(worker)
        if not result["verified"]:
            raise HTTPException(status_code=400, detail=f"Identity check failed: {result['message']}")
        updates["identity_verified"] = True

    for field, value in updates.items():
        setattr(worker.verification, field, value)
    sync_worker_verified(worker)
    db.commit()
    db.refresh(worker)
    return worker_to_dict(worker)


@router.get("/requests", response_model=list[RequestOut])
def admin_requests(db: Session = Depends(get_db)):
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


@router.get("/certifications", response_model=list[CertificationOut])
def list_certifications(
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(WorkerCertification).order_by(WorkerCertification.created_at.desc())
    if status:
        query = query.filter(WorkerCertification.status == status.upper())
    return query.all()


@router.put("/certifications/{cert_id}/review", response_model=CertificationOut)
def review_certification(
    cert_id: int,
    payload: CertificationReview,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role("admin")),
):
    cert = db.get(WorkerCertification, cert_id)
    if not cert:
        raise HTTPException(status_code=404, detail="Certification not found")

    cert.status = payload.status.upper()
    cert.verified_by = admin_user.id

    if cert.status == "VERIFIED":
        if cert.worker.verification:
            cert.worker.verification.certificate_verified = True
            sync_worker_verified(cert.worker)

    db.commit()
    db.refresh(cert)
    return cert
