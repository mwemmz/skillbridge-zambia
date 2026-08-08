from math import asin, atan2, cos, radians, sin, sqrt

from .models import Worker


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371.0
    p1, p2 = radians(lat1), radians(lat2)
    dp = radians(lat2 - lat1)
    dl = radians(lng2 - lng1)
    a = sin(dp / 2) ** 2 + cos(p1) * cos(p2) * sin(dl / 2) ** 2
    return round(R * 2 * atan2(sqrt(a), sqrt(1 - a)), 2)


def worker_to_dict(
    worker: Worker,
    lat: float | None = None,
    lng: float | None = None,
    include_phone: bool = True,
) -> dict:
    verification = worker.verification
    skill_name = worker.skill.name if worker.skill else None
    data = {
        "id": worker.id,
        "user_id": worker.user_id,
        "name": worker.user.name,
        "email": worker.user.email,
        "skill": skill_name,
        "skill_id": worker.skill_id,
        "description": worker.description or "",
        "latitude": worker.latitude,
        "longitude": worker.longitude,
        "rating": worker.rating,
        "experience_years": worker.experience_years,
        "availability": worker.availability,
        "is_verified": bool(worker.is_verified),
        "phone": worker.user.phone if include_phone else None,
        "identity_verified": bool(verification and verification.identity_verified),
        "certificate_verified": bool(verification and verification.certificate_verified),
        "compliance_verified": bool(verification and verification.compliance_verified),
        "distance_km": None,
    }
    if lat is not None and lng is not None:
        data["distance_km"] = haversine_km(lat, lng, worker.latitude, worker.longitude)
    return data
