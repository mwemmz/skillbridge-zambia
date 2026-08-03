from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=120)
    role: str = "customer"  # customer | worker | admin
    phone: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    phone: Optional[str] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Skills ----------
class SkillCreate(BaseModel):
    name: str = Field(min_length=2, max_length=60)


class SkillOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


# ---------- Workers ----------
class WorkerUpdate(BaseModel):
    skill_id: Optional[int] = None
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    availability: Optional[bool] = None
    experience_years: Optional[int] = None


class WorkerOut(BaseModel):
    id: int
    user_id: int
    name: str
    skill: Optional[str] = None
    skill_id: Optional[int] = None
    description: str = ""
    latitude: float
    longitude: float
    rating: float
    experience_years: int
    availability: bool
    phone: Optional[str] = None
    identity_verified: bool = False
    certificate_verified: bool = False
    compliance_verified: bool = False
    distance_km: Optional[float] = None


class VerificationUpdate(BaseModel):
    identity_verified: Optional[bool] = None
    certificate_verified: Optional[bool] = None
    compliance_verified: Optional[bool] = None


# ---------- Service Requests ----------
class RequestCreate(BaseModel):
    worker_id: int
    description: str = Field(min_length=3, max_length=1000)
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class RequestStatusUpdate(BaseModel):
    status: str


class RequestOut(BaseModel):
    id: int
    customer_id: int
    customer_name: str
    worker_id: int
    worker_name: str
    worker_skill: Optional[str] = None
    worker_latitude: Optional[float] = None
    worker_longitude: Optional[float] = None
    description: str
    latitude: float
    longitude: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Admin ----------
class AdminStats(BaseModel):
    customers: int
    workers: int
    requests: int
    pending_verification: int
    online_workers: int
