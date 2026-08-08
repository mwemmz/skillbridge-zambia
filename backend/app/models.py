from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="customer")  # customer | worker | admin
    phone = Column(String(30), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    worker = relationship("Worker", back_populates="user", uselist=False)
    customer_requests = relationship(
        "ServiceRequest", foreign_keys="ServiceRequest.customer_id", back_populates="customer"
    )
    confirmations_given = relationship("JobConfirmation", back_populates="confirmer")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(60), unique=True, index=True, nullable=False)

    workers = relationship("Worker", back_populates="skill")


class Worker(Base):
    __tablename__ = "workers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=True)
    description = Column(Text, default="")
    latitude = Column(Float, default=-15.3875)
    longitude = Column(Float, default=28.3228)
    rating = Column(Float, default=5.0)
    experience_years = Column(Integer, default=1)
    availability = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)

    user = relationship("User", back_populates="worker")
    skill = relationship("Skill", back_populates="workers")
    verification = relationship(
        "Verification", back_populates="worker", uselist=False, cascade="all, delete-orphan"
    )
    requests = relationship("ServiceRequest", back_populates="worker")
    certifications = relationship(
        "WorkerCertification", back_populates="worker", cascade="all, delete-orphan"
    )
    crew_memberships = relationship("CrewMember", back_populates="worker")


class Verification(Base):
    __tablename__ = "verifications"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False, unique=True)
    identity_verified = Column(Boolean, default=False)
    certificate_verified = Column(Boolean, default=False)
    compliance_verified = Column(Boolean, default=False)

    worker = relationship("Worker", back_populates="verification")


class WorkerCertification(Base):
    """A credential attached to a worker's passport (proof of skill)."""

    __tablename__ = "worker_certifications"
    __table_args__ = (
        UniqueConstraint("worker_id", "name", "issue_date", name="uq_cert_worker_name_issue"),
    )

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False, index=True)
    name = Column(String(120), nullable=False)
    issuer = Column(String(120), default="")
    issue_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=True)
    reference = Column(String(120), default="")
    status = Column(String(20), default="PENDING")  # PENDING | VERIFIED | REJECTED
    verified_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    worker = relationship("Worker", back_populates="certifications")


class Crew(Base):
    """A team of workers (e.g. electricians + plumbers for a renovation)."""

    __tablename__ = "crews"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=True)
    description = Column(Text, default="")
    rating = Column(Float, default=5.0)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    members = relationship("CrewMember", back_populates="crew", cascade="all, delete-orphan")
    skill = relationship("Skill")


class CrewMember(Base):
    __tablename__ = "crew_members"
    __table_args__ = (UniqueConstraint("crew_id", "worker_id", name="uq_crew_worker"),)

    id = Column(Integer, primary_key=True, index=True)
    crew_id = Column(Integer, ForeignKey("crews.id"), nullable=False, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False, index=True)
    role = Column(String(60), default="member")  # lead | member
    joined_at = Column(DateTime, default=datetime.utcnow)

    crew = relationship("Crew", back_populates="members")
    worker = relationship("Worker", back_populates="crew_memberships")


class JobConfirmation(Base):
    """Independent confirmation that a job actually happened.

    A job is counted only when the customer *and* a co-worker (not the worker
    themselves) confirm it. Prevents self-reported work history.
    """

    __tablename__ = "job_confirmations"
    __table_args__ = (
        UniqueConstraint("request_id", "confirmer_id", name="uq_confirm_request_confirmer"),
    )

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("service_requests.id"), nullable=False, index=True)
    confirmer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # customer | co_worker
    rating = Column(Integer, nullable=True)  # 1-5 (customer only)
    note = Column(String(300), default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    request = relationship("ServiceRequest", back_populates="confirmations")
    confirmer = relationship("User", back_populates="confirmations_given")


class AreaJobStat(Base):
    """Rolling job-density statistics per neighbourhood, for supply/demand heatmaps."""

    __tablename__ = "area_job_stats"

    id = Column(Integer, primary_key=True, index=True)
    area_name = Column(String(120), nullable=False, index=True)
    latitude = Column(Float, default=-15.3875)
    longitude = Column(Float, default=28.3228)
    job_count = Column(Integer, default=0)
    active_workers = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ServiceRequest(Base):
    __tablename__ = "service_requests"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    crew_id = Column(Integer, ForeignKey("crews.id"), nullable=True)
    description = Column(Text, nullable=False)
    latitude = Column(Float, default=-15.3875)
    longitude = Column(Float, default=28.3228)
    status = Column(
        String(20), default="REQUESTED"
    )  # REQUESTED | ACCEPTED | ON_THE_WAY | COMPLETED | DECLINED | CANCELLED
    job_type = Column(String(40), default="booking")  # booking | maintenance | emergency
    scheduled_for = Column(DateTime, nullable=True)
    price = Column(Float, nullable=True)
    rating = Column(Integer, nullable=True)  # 1-5, final aggregate once confirmed
    confirmed_at = Column(DateTime, nullable=True)
    customer_confirmed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("User", back_populates="customer_requests")
    worker = relationship("Worker", back_populates="requests")
    crew = relationship("Crew")
    confirmations = relationship(
        "JobConfirmation", back_populates="request", cascade="all, delete-orphan"
    )
