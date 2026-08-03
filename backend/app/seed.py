from time import perf_counter

from sqlalchemy.orm import Session

from .models import Skill, User, Verification, Worker
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

        db.add(
            Verification(
                worker_id=worker.id,
                identity_verified=w["identity"],
                certificate_verified=w["certificate"],
                compliance_verified=w["compliance"],
            )
        )

    db.commit()
    print(
        f"[skillbridge] Demo data seeded in {perf_counter() - start:.1f}s - "
        "accounts: customer@skillbridge.com, worker1@skillbridge.com, admin@skillbridge.com"
    )
