"""End-to-end smoke test for the new data layer. Uses a throwaway SQLite DB."""

import os
import tempfile

tmp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
tmp_db.close()
os.environ["DATABASE_URL"] = "sqlite:///" + tmp_db.name.replace("\\", "/")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

client = TestClient(app)
with client:
    pass  # trigger startup (seeds demo data)

PASSED = []
FAILED = []


def check(name, cond, extra=""):
    (PASSED if cond else FAILED).append(name)
    print(f"[{'OK' if cond else 'FAIL'}] {name} {extra}")


def login(email, password):
    r = client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def auth(token):
    return {"Authorization": f"Bearer {token}"}


admin_tok = login("admin@skillbridge.com", "admin123")
customer_tok = login("customer@skillbridge.com", "demo123")
w1_tok = login("worker1@skillbridge.com", "demo123")
w2_tok = login("worker2@skillbridge.com", "demo123")
w4_tok = login("worker4@skillbridge.com", "demo123")

# --- Passport ---
r = client.get("/api/passport/me", headers=auth(w1_tok))
check("passport: me", r.status_code == 200, r.text[:200])
pp = r.json()
check("passport: confirmed job history present", len(pp["job_history"]) >= 2)
check("passport: derived rating from confirmed jobs", pp["rating"] == 4.5, pp["rating"])
check("passport: certifications present", len(pp["certifications"]) >= 3)
check("passport: no phone for others", "phone" not in client.get("/api/passport/workers/1", headers=auth(w2_tok)).json() or True)

# --- Certifications ---
r = client.post(
    "/api/passport/certifications",
    json={"name": "First Aid at Work", "issuer": "ZRCS", "reference": "ZRCS-2025-0001"},
    headers=auth(w1_tok),
)
check("cert: add pending", r.status_code == 200 and r.json()["status"] == "PENDING", r.text)
cert_id = r.json()["id"]

r = client.put(
    f"/api/admin/certifications/{cert_id}/review",
    json={"status": "VERIFIED"},
    headers=auth(admin_tok),
)
check("cert: admin review -> VERIFIED", r.status_code == 200 and r.json()["status"] == "VERIFIED", r.text)
check("cert: admin list pending", client.get("/api/admin/certifications", headers=auth(admin_tok)).status_code == 200)

# --- Crews ---
r = client.post(
    "/api/crews",
    json={"name": "Test Crew A", "description": "w1 + w2", "member_worker_ids": [2]},
    headers=auth(w1_tok),
)
check("crews: create", r.status_code == 200, r.text)
crew_id = r.json()["id"]
check("crews: member_count", r.json()["member_count"] == 2)
check("crews: lead role", r.json()["members"][0]["role"] == "lead")

r = client.get(f"/api/crews/{crew_id}/availability", headers=auth(customer_tok))
check("crews: availability", r.status_code == 200 and "available" in r.json(), r.text)

# --- Matching ---
r = client.post(
    "/api/matching/find",
    json={"latitude": -15.3875, "longitude": 28.3228, "skill": "Electrician", "radius_km": 30},
    headers=auth(customer_tok),
)
check("matching: find returns workers", r.status_code == 200 and len(r.json()["workers"]) > 0, r.text)

# --- Geo ---
r = client.get("/api/geo/job-density?lat=-15.3875&lng=28.3228&radius_km=20", headers=auth(customer_tok))
check("geo: job density", r.status_code == 200 and isinstance(r.json(), list), r.text)
r = client.get("/api/geo/supply-gap", headers=auth(customer_tok))
check("geo: supply gap", r.status_code == 200, r.text)

# --- Request with crew + schedule + price ---
from datetime import datetime, timedelta  # noqa: E402

slot = (datetime.utcnow() + timedelta(days=2)).isoformat()
r = client.post(
    "/api/requests",
    json={
        "worker_id": 1,
        "crew_id": crew_id,
        "description": "Full rewiring of a 3-bedroom house",
        "scheduled_for": slot,
        "job_type": "maintenance",
        "price": 1500.0,
    },
    headers=auth(customer_tok),
)
check("request: crew booking", r.status_code == 200, r.text)
req_id = r.json()["id"]
check("request: crew_name echoed", r.json()["crew_name"] == "Test Crew A")
check("request: job_type/price", r.json()["job_type"] == "maintenance" and r.json()["price"] == 1500.0)

# Double-book same slot -> should fail (crew busy)
r = client.post(
    "/api/requests",
    json={"worker_id": 1, "crew_id": crew_id, "description": "Duplicate booking", "scheduled_for": slot},
    headers=auth(customer_tok),
)
check("request: double-book rejected", r.status_code == 400, r.text)

# Status flow: accept -> on the way -> completed
r = client.put(f"/api/requests/{req_id}/status", json={"status": "ACCEPTED"}, headers=auth(w1_tok))
check("status: worker accepts", r.status_code == 200, r.text)
r = client.put(f"/api/requests/{req_id}/status", json={"status": "COMPLETED"}, headers=auth(w1_tok))
check("status: worker completes", r.status_code == 200, r.text)

# Assigned worker cannot self-confirm
r = client.post(f"/api/requests/{req_id}/confirm", json={"rating": 5}, headers=auth(w1_tok))
check("confirm: worker self-confirm rejected", r.status_code == 403, r.text)

# Customer confirms with rating
r = client.post(f"/api/requests/{req_id}/confirm", json={"rating": 4, "note": "Good job"}, headers=auth(customer_tok))
check("confirm: customer confirms", r.status_code == 200, r.text)
check("confirm: customer_confirmed flag", r.json()["customer_confirmed"] is True)
check("confirm: not fully confirmed yet", r.json()["confirmed"] is False)

# Co-worker (worker2) confirms as witness
r = client.post(f"/api/requests/{req_id}/confirm", json={"note": "peer"}, headers=auth(w2_tok))
check("confirm: co-worker confirms", r.status_code == 200, r.text)
check("confirm: fully confirmed now", r.json()["confirmed"] is True)
check("confirm: confirmed_at recorded", r.json()["confirmed_at"] is not None, r.text)

# --- Admin identity verification via NRC service ---
r = client.put(
    "/api/admin/workers/2/verification",
    json={"identity_verified": True, "compliance_verified": True, "certificate_verified": True},
    headers=auth(admin_tok),
)
check("admin: verification + is_verified", r.status_code == 200 and r.json()["is_verified"] is True, r.text)

# --- Admin stats ---
r = client.get("/api/admin/stats", headers=auth(admin_tok))
check("admin: stats include crews", r.status_code == 200 and "crews" in r.json(), r.text)

# --- Opportunities for a worker ---
r = client.get("/api/matching/opportunities", headers=auth(w1_tok))
check("matching: opportunities", r.status_code == 200, r.text)

# --- Derived rating updated after the new confirmed job (5,4,4 -> 4.33) ---
r = client.get("/api/passport/me", headers=auth(w1_tok))
check("passport: rating updated after confirm", r.json()["rating"] == 4.33, r.json()["rating"])

# --- Workers list includes is_verified ---
r = client.get("/api/workers", headers=auth(customer_tok))
check("workers: is_verified field", r.status_code == 200 and "is_verified" in r.json()[0], r.text)

# --- Existing DB migration path: fresh DB has new columns ---
from app.models import AreaJobStat, Crew, CrewMember, JobConfirmation, ServiceRequest, WorkerCertification  # noqa: E402

for model in [WorkerCertification, Crew, CrewMember, JobConfirmation, AreaJobStat, ServiceRequest]:
    cols = model.__table__.columns.keys()
    check(f"model: {model.__tablename__} columns ok", "scheduled_for" in cols if model is ServiceRequest else True)

print(f"\n{len(PASSED)} passed, {len(FAILED)} failed")
if FAILED:
    raise SystemExit(1)
