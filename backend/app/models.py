from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
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

    user = relationship("User", back_populates="worker")
    skill = relationship("Skill", back_populates="workers")
    verification = relationship(
        "Verification", back_populates="worker", uselist=False, cascade="all, delete-orphan"
    )
    requests = relationship("ServiceRequest", back_populates="worker")


class Verification(Base):
    __tablename__ = "verifications"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False, unique=True)
    identity_verified = Column(Boolean, default=False)
    certificate_verified = Column(Boolean, default=False)
    compliance_verified = Column(Boolean, default=False)

    worker = relationship("Worker", back_populates="verification")


class ServiceRequest(Base):
    __tablename__ = "service_requests"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    description = Column(Text, nullable=False)
    latitude = Column(Float, default=-15.3875)
    longitude = Column(Float, default=28.3228)
    status = Column(
        String(20), default="REQUESTED"
    )  # REQUESTED | ACCEPTED | ON_THE_WAY | COMPLETED | DECLINED | CANCELLED
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("User", back_populates="customer_requests")
    worker = relationship("Worker", back_populates="requests")
