from datetime import date, datetime
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
    is_verified: bool = False
    phone: Optional[str] = None
    identity_verified: bool = False
    certificate_verified: bool = False
    compliance_verified: bool = False
    distance_km: Optional[float] = None


class VerificationUpdate(BaseModel):
    identity_verified: Optional[bool] = None
    certificate_verified: Optional[bool] = None
    compliance_verified: Optional[bool] = None


# ---------- Worker Passport ----------
class CertificationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    issuer: Optional[str] = None
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    reference: Optional[str] = None


class CertificationOut(BaseModel):
    id: int
    worker_id: int
    name: str
    issuer: str = ""
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    reference: str = ""
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class CertificationReview(BaseModel):
    status: str = Field(pattern="^(VERIFIED|REJECTED)$")


class JobHistoryEntry(BaseModel):
    id: int
    description: str
    customer_name: str
    confirmed_at: Optional[datetime] = None
    rating: Optional[int] = None


class PassportOut(BaseModel):
    worker_id: int
    name: str
    skill: Optional[str] = None
    description: str = ""
    experience_years: int
    rating: float
    is_verified: bool = False
    identity_verified: bool = False
    certificate_verified: bool = False
    compliance_verified: bool = False
    certifications: list[CertificationOut] = []
    job_history: list[JobHistoryEntry] = []
    total_confirmed_jobs: int = 0
    phone: Optional[str] = None


# ---------- Crews ----------
class CrewCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: Optional[str] = None
    skill_id: Optional[int] = None
    member_worker_ids: list[int] = []


class CrewMemberAdd(BaseModel):
    worker_id: int
    role: str = "member"


class CrewMemberOut(BaseModel):
    worker_id: int
    name: str
    skill: Optional[str] = None
    role: str = "member"
    rating: float
    availability: bool
    is_verified: bool = False


class CrewOut(BaseModel):
    id: int
    name: str
    description: str = ""
    skill: Optional[str] = None
    rating: float
    member_count: int
    members: list[CrewMemberOut] = []
    created_at: datetime


class CrewAvailabilityOut(BaseModel):
    crew_id: int
    scheduled_for: datetime
    available: bool
    members: list[dict] = []


# ---------- Matching ----------
class MatchFind(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    skill: Optional[str] = None
    job_type: Optional[str] = None
    scheduled_for: Optional[datetime] = None
    radius_km: float = Field(default=25, gt=0)


class MatchingResult(BaseModel):
    workers: list[WorkerOut] = []
    crews: list[CrewOut] = []


# ---------- Geographic ----------
class DensityPoint(BaseModel):
    latitude: float
    longitude: float
    job_count: int
    active_workers: int


class SupplyGapOut(BaseModel):
    area_name: str
    latitude: float
    longitude: float
    job_count: int
    active_workers: int
    gap: int


# ---------- Service Requests ----------
class RequestCreate(BaseModel):
    worker_id: int
    description: str = Field(min_length=3, max_length=1000)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    crew_id: Optional[int] = None
    scheduled_for: Optional[datetime] = None
    job_type: str = "booking"  # booking | maintenance | emergency
    price: Optional[float] = Field(default=None, gt=0)


class RequestStatusUpdate(BaseModel):
    status: str


class RequestConfirm(BaseModel):
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    note: Optional[str] = Field(default=None, max_length=300)


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
    crew_id: Optional[int] = None
    crew_name: Optional[str] = None
    job_type: str = "booking"
    scheduled_for: Optional[datetime] = None
    price: Optional[float] = None
    rating: Optional[int] = None
    confirmed: bool = False
    customer_confirmed: bool = False
    confirmed_at: Optional[datetime] = None
    confirmations: list[dict] = []
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
    crews: int = 0
    pending_certifications: int = 0
