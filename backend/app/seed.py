from datetime import date, datetime, timedelta
from time import perf_counter

from sqlalchemy.orm import Session

from .domain import recompute_worker_rating, refresh_area_stats, sync_worker_verified
from .models import (
    Crew,
    CrewMember,
    JobConfirmation,
    ServiceRequest,
    Skill,
    User,
    Verification,
    Worker,
    WorkerCertification,
)
from .security import hash_password

WORKER_PASSWORD = "demo123"
CUSTOMER_PASSWORD = "demo123"
ADMIN_PASSWORD = "admin123"

SKILLS = [
    "Electrician",
    "Plumber",
    "Welder",
    "Mechanic",
    "Carpenter",
    "Solar Installer",
]

DEMO_WORKERS = [
    {
        "name": "Moses Banda",
        "email": "worker1@skillbridge.com",
        "skill": "Electrician",
        "description": "Certified electrician with 8 years experience in residential and commercial wiring, fault finding and appliance installation across Lusaka.",
        "lat": -15.3981,
        "lng": 28.3206,
        "rating": 4.8,
        "experience": 8,
        "identity": True,
        "certificate": True,
        "compliance": True,
    },
    {
        "name": "Peter Mwansa",
        "email": "worker2@skillbridge.com",
        "skill": "Plumber",
        "description": "Licensed plumber specialising in leak repairs, drainage, geyser installation and bathroom fitting.",
        "lat": -15.4115,
        "lng": 28.3312,
        "rating": 4.6,
        "experience": 6,
        "identity": True,
        "certificate": True,
        "compliance": False,
    },
    {
        "name": "Chanda Phiri",
        "email": "worker3@skillbridge.com",
        "skill": "Welder",
        "description": "Experienced welder for gates, burglar bars, steel structures and metal fabrication.",
        "lat": -15.3720,
        "lng": 28.2980,
        "rating": 4.7,
        "experience": 10,
        "identity": True,
        "certificate": True,
        "compliance": True,
    },
    {
        "name": "Grace Tembo",
        "email": "worker4@skillbridge.com",
        "skill": "Mechanic",
        "description": "Auto mechanic handling diagnostics, engine repair, brakes and routine servicing.",
        "lat": -15.4210,
        "lng": 28.2870,
        "rating": 4.9,
        "experience": 12,
        "identity": True,
        "certificate": True,
        "compliance": True,
    },
    {
        "name": "Joseph Zulu",
        "email": "worker5@skillbridge.com",
        "skill": "Carpenter",
        "description": "Skilled carpenter for custom furniture, kitchen fittings, roofing and general woodwork.",
        "lat": -15.3550,
        "lng": 28.3520,
        "rating": 4.5,
        "experience": 5,
        "identity": True,
        "certificate": False,
        "compliance": False,
    },
    {
        "name": "Natasha Mwale",
        "email": "worker6@skillbridge.com",
        "skill": "Solar Installer",
        "description": "Solar energy specialist installing home solar kits, inverters and battery systems.",
        "lat": -15.4010,
        "lng": 28.2600,
        "rating": 4.8,
        "experience": 4,
        "identity": True,
        "certificate": True,
        "compliance": True,
    },
    {
        "name": "Brian Sakala",
        "email": "worker7@skillbridge.com",
        "skill": "Electrician",
        "description": "Electrical maintenance technician serving households and small businesses in Lusaka.",
        "lat": -15.3850,
        "lng": 28.3450,
        "rating": 4.4,
        "experience": 3,
        "identity": True,
        "certificate": False,
        "compliance": True,
    },
]

# (worker_index, customer_rating, description, days_ago)
DEMO_JOB_HISTORY = [
    (0, 5, "Replaced faulty wiring and sockets in a flat in Kabulonga", 12),
    (0, 4, "Installed a distribution board in a shop in Cairo Road", 35),
    (1, 5, "Repaired a burst pipe and replaced bathroom fittings", 9),
    (1, 4, "Unblocked drainage at a guest house in Riverside", 40),
    (2, 5, "Fabricated a steel gate and burglar bars in Woodlands", 15),
    (3, 5, "Fixed brakes and did a service on a delivery van", 7),
]

DEMO_CERTIFICATIONS = [
    (0, "Zambia Electrical Contractors Licence", "ERB Zambia", date(2019, 3, 1), "VERIFIED"),
    (0, "Advanced Solar PV Installation", "REA Zambia", date(2022, 6, 15), "VERIFIED"),
    (0, "TEVETA Trade Test Grade 1 - Electrical", "TEVETA", date(2018, 9, 1), "VERIFIED"),
    (1, "Plumbing & Drainage Certificate", "TEVETA", date(2017, 5, 1), "VERIFIED"),
    (5, "Solar PV Technician Certification", "REA Zambia", None, "PENDING"),
]


def seed_demo_data(db: Session):
    if db.query(User).filter(User.email == "admin@skillbridge.com").first():
        print("[skillbridge] Demo data already present — skipping seed.")
        return

    start = perf_counter()

    skill_objs = {}
    for name in SKILLS:
        skill = db.query(Skill).filter(Skill.name == name).first()
        if not skill:
            skill = Skill(name=name)
            db.add(skill)
            db.flush()
        skill_objs[name] = skill

    admin = User(
        name="SkillBridge Admin",
        email="admin@skillbridge.com",
        password_hash=hash_password(ADMIN_PASSWORD),
        role="admin",
        phone="+260 97 000 0000",
    )
    db.add(admin)

    customer = User(
        name="Demo Customer",
        email="customer@skillbridge.com",
        password_hash=hash_password(CUSTOMER_PASSWORD),
        role="customer",
        phone="+260 96 111 1111",
    )
    db.add(customer)

    worker_objs = []
    for idx, w in enumerate(DEMO_WORKERS, start=1):
        user = User(
            name=w["name"],
            email=w["email"],
            password_hash=hash_password(WORKER_PASSWORD),
            role="worker",
            phone=f"+260 97 000 000{idx}",
        )
        db.add(user)
        db.flush()

        worker = Worker(
            user_id=user.id,
            skill_id=skill_objs[w["skill"]].id,
            description=w["description"],
            latitude=w["lat"],
            longitude=w["lng"],
            rating=w["rating"],
            experience_years=w["experience"],
            availability=True,
        )
        db.add(worker)
        db.flush()
        worker_objs.append(worker)

        verification = Verification(
            worker_id=worker.id,
            identity_verified=w["identity"],
            certificate_verified=w["certificate"],
            compliance_verified=w["compliance"],
        )
        db.add(verification)
        worker.verification = verification
        sync_worker_verified(worker)

    # Certifications for the worker passports.
    for idx, name, issuer, issue_date, status in DEMO_CERTIFICATIONS:
        db.add(
            WorkerCertification(
                worker_id=worker_objs[idx].id,
                name=name,
                issuer=issuer,
                issue_date=issue_date,
                status=status,
            )
        )

    # Confirmed work history (customer + co-worker confirmed) for derived ratings.
    for w_idx, rating, description, days_ago in DEMO_JOB_HISTORY:
        worker = worker_objs[w_idx]
        req = ServiceRequest(
            customer_id=customer.id,
            worker_id=worker.id,
            description=description,
            latitude=worker.latitude,
            longitude=worker.longitude,
            status="COMPLETED",
            job_type="maintenance",
            scheduled_for=datetime.utcnow() - timedelta(days=days_ago + 7),
            price=250.0,
            rating=rating,
            customer_confirmed=True,
            confirmed_at=datetime.utcnow() - timedelta(days=days_ago),
        )
        db.add(req)
        db.flush()
        db.add(
            JobConfirmation(
                request_id=req.id,
                confirmer_id=customer.id,
                role="customer",
                rating=rating,
                note="Job completed to satisfaction",
            )
        )
        peer = worker_objs[(w_idx + 1) % len(worker_objs)]
        db.add(
            JobConfirmation(
                request_id=req.id,
                confirmer_id=peer.user_id,
                role="co_worker",
                note="Peer confirmed work done on site",
            )
        )
        recompute_worker_rating(db, worker)

    # Demo crews.
    crew1 = Crew(
        name="Tembo Electrical & Solar",
        skill_id=skill_objs["Electrician"].id,
        description="Full home electrical and solar installation team.",
        created_by=worker_objs[0].user_id,
    )
    db.add(crew1)
    db.flush()
    for wid, role in [(0, "lead"), (5, "member"), (6, "member")]:
        db.add(CrewMember(crew_id=crew1.id, worker_id=worker_objs[wid].id, role=role))

    crew2 = Crew(
        name="Phiri Metal & Build",
        skill_id=skill_objs["Welder"].id,
        description="Welding and carpentry team for gates, roofs and fittings.",
        created_by=worker_objs[2].user_id,
    )
    db.add(crew2)
    db.flush()
    for wid, role in [(2, "lead"), (4, "member")]:
        db.add(CrewMember(crew_id=crew2.id, worker_id=worker_objs[wid].id, role=role))

    refresh_area_stats(db)
    db.commit()
    print(
        f"[skillbridge] Demo data seeded in {perf_counter() - start:.1f}s - "
        "accounts: customer@skillbridge.com, worker1@skillbridge.com, admin@skillbridge.com"
    )
