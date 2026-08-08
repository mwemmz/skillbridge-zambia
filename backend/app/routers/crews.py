from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..domain import crew_available_at, crew_rating
from ..models import Crew, CrewMember, User, Worker
from ..schemas import CrewAvailabilityOut, CrewCreate, CrewMemberAdd, CrewOut

router = APIRouter(prefix="/crews", tags=["crews"])


def crew_to_dict(crew: Crew, with_members: bool = True) -> dict:
    members = []
    if with_members:
        for m in crew.members:
            members.append(
                {
                    "worker_id": m.worker_id,
                    "name": m.worker.user.name,
                    "skill": m.worker.skill.name if m.worker.skill else None,
                    "role": m.role,
                    "rating": m.worker.rating,
                    "availability": m.worker.availability,
                    "is_verified": bool(m.worker.is_verified),
                }
            )
    return {
        "id": crew.id,
        "name": crew.name,
        "description": crew.description or "",
        "skill": crew.skill.name if crew.skill else None,
        "rating": crew_rating(crew),
        "member_count": len(crew.members),
        "members": members,
        "created_at": crew.created_at,
    }


def _crew(db: Session, crew_id: int) -> Crew:
    crew = db.get(Crew, crew_id)
    if not crew:
        raise HTTPException(status_code=404, detail="Crew not found")
    return crew


def _can_manage(current_user: User, crew: Crew) -> bool:
    if current_user.role == "admin":
        return True
    lead_ids = [m.worker.user_id for m in crew.members if m.role == "lead"]
    return current_user.id in lead_ids


@router.get("", response_model=list[CrewOut])
def list_crews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    with_members: bool = Query(default=True),
):
    crews = db.query(Crew).order_by(Crew.created_at.desc()).all()
    return [crew_to_dict(c, with_members=with_members) for c in crews]


@router.post("", response_model=CrewOut)
def create_crew(
    payload: CrewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lead = db.query(Worker).filter(Worker.user_id == current_user.id).first()
    if not lead:
        raise HTTPException(status_code=403, detail="Only workers can create crews")

    member_ids = list(dict.fromkeys([lead.id, *payload.member_worker_ids]))
    workers = db.query(Worker).filter(Worker.id.in_(member_ids)).all()
    found = {w.id for w in workers}
    missing = [mid for mid in member_ids if mid not in found]
    if missing:
        raise HTTPException(status_code=400, detail=f"Unknown worker ids: {missing}")

    crew = Crew(
        name=payload.name,
        description=payload.description or "",
        skill_id=payload.skill_id,
        created_by=current_user.id,
    )
    db.add(crew)
    db.flush()
    for wid in member_ids:
        db.add(
            CrewMember(
                crew_id=crew.id,
                worker_id=wid,
                role="lead" if wid == lead.id else "member",
            )
        )
    db.commit()
    db.refresh(crew)
    return crew_to_dict(crew)


@router.get("/{crew_id}", response_model=CrewOut)
def get_crew(
    crew_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return crew_to_dict(_crew(db, crew_id))


@router.get("/{crew_id}/availability", response_model=CrewAvailabilityOut)
def crew_availability(
    crew_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    when: datetime | None = Query(default=None),
):
    crew = _crew(db, crew_id)
    when = when or datetime.utcnow()
    members = [
        {
            "worker_id": m.worker_id,
            "name": m.worker.user.name,
            "available": bool(m.worker.availability),
            "role": m.role,
        }
        for m in crew.members
    ]
    return {
        "crew_id": crew.id,
        "scheduled_for": when,
        "available": crew_available_at(db, crew, when),
        "members": members,
    }


@router.post("/{crew_id}/members", response_model=CrewOut)
def add_member(
    crew_id: int,
    payload: CrewMemberAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    crew = _crew(db, crew_id)
    if not _can_manage(current_user, crew):
        raise HTTPException(status_code=403, detail="Only the crew lead or admin can manage members")

    worker = db.get(Worker, payload.worker_id)
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    existing = (
        db.query(CrewMember)
        .filter(CrewMember.crew_id == crew.id, CrewMember.worker_id == worker.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Worker is already a member")

    db.add(CrewMember(crew_id=crew.id, worker_id=worker.id, role=payload.role or "member"))
    db.commit()
    db.refresh(crew)
    return crew_to_dict(crew)


@router.delete("/{crew_id}/members/{worker_id}", response_model=CrewOut)
def remove_member(
    crew_id: int,
    worker_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    crew = _crew(db, crew_id)
    if not _can_manage(current_user, crew):
        raise HTTPException(status_code=403, detail="Only the crew lead or admin can manage members")

    member = (
        db.query(CrewMember)
        .filter(CrewMember.crew_id == crew.id, CrewMember.worker_id == worker_id)
        .first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    if member.role == "lead" and len(crew.members) == 1:
        raise HTTPException(status_code=400, detail="A crew must keep at least its lead")

    db.delete(member)
    db.commit()
    db.refresh(crew)
    return crew_to_dict(crew)
