from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..domain import confirmed_jobs_for_worker, recompute_worker_rating
from ..models import User, Worker, WorkerCertification
from ..schemas import (
    CertificationCreate,
    CertificationOut,
    PassportOut,
)

router = APIRouter(prefix="/passport", tags=["passport"])


def build_passport(db: Session, worker: Worker, include_private: bool = False) -> dict:
    verification = worker.verification
    history = []
    for r in confirmed_jobs_for_worker(db, worker.id):
        history.append(
            {
                "id": r.id,
                "description": r.description,
                "customer_name": r.customer.name,
                "confirmed_at": r.confirmed_at,
                "rating": r.rating,
            }
        )
    certifications = [
        {
            "id": c.id,
            "worker_id": c.worker_id,
            "name": c.name,
            "issuer": c.issuer or "",
            "issue_date": c.issue_date,
            "expiry_date": c.expiry_date,
            "reference": c.reference or "",
            "status": c.status,
            "created_at": c.created_at,
        }
        for c in worker.certifications
    ]
    return {
        "worker_id": worker.id,
        "name": worker.user.name,
        "skill": worker.skill.name if worker.skill else None,
        "description": worker.description or "",
        "experience_years": worker.experience_years,
        "rating": recompute_worker_rating(db, worker),
        "is_verified": bool(worker.is_verified),
        "identity_verified": bool(verification and verification.identity_verified),
        "certificate_verified": bool(verification and verification.certificate_verified),
        "compliance_verified": bool(verification and verification.compliance_verified),
        "certifications": certifications,
        "job_history": history,
        "total_confirmed_jobs": len(history),
        "phone": worker.user.phone if include_private else None,
    }


def _own_worker(db: Session, current_user: User) -> Worker:
    worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker profile not found")
    return worker


@router.get("/me", response_model=PassportOut)
def my_passport(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return build_passport(db, _own_worker(db, current_user), include_private=True)


@router.get("/workers/{worker_id}", response_model=PassportOut)
def worker_passport(
    worker_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    worker = db.get(Worker, worker_id)
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    return build_passport(db, worker)


@router.get("/certifications", response_model=list[CertificationOut])
def my_certifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    worker = _own_worker(db, current_user)
    return (
        db.query(WorkerCertification)
        .filter(WorkerCertification.worker_id == worker.id)
        .order_by(WorkerCertification.created_at.desc())
        .all()
    )


@router.post("/certifications", response_model=CertificationOut)
def add_certification(
    payload: CertificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    worker = _own_worker(db, current_user)
    cert = WorkerCertification(
        worker_id=worker.id,
        name=payload.name,
        issuer=payload.issuer,
        issue_date=payload.issue_date,
        expiry_date=payload.expiry_date,
        reference=payload.reference,
        status="PENDING",
    )
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return cert


@router.delete("/certifications/{cert_id}")
def delete_certification(
    cert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    worker = _own_worker(db, current_user)
    cert = db.get(WorkerCertification, cert_id)
    if not cert or cert.worker_id != worker.id:
        raise HTTPException(status_code=404, detail="Certification not found")
    if cert.status == "VERIFIED":
        raise HTTPException(status_code=400, detail="Verified credentials cannot be removed")
    db.delete(cert)
    db.commit()
    return {"ok": True}
