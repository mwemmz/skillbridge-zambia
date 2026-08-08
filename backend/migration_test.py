"""Verify run_migrations against a copy of the existing dev DB (old schema)."""

import os
import shutil

os.environ["DATABASE_URL"] = "sqlite:///./_migration_test.db"

from sqlalchemy import inspect, text  # noqa: E402

if os.path.exists("_migration_test.db"):
    os.remove("_migration_test.db")
shutil.copy("skillbridge.db", "_migration_test.db")

import app.models  # noqa: E402,F401  # register models on Base.metadata
from app.database import Base, engine  # noqa: E402
from app.migrations import run_migrations  # noqa: E402

Base.metadata.create_all(bind=engine)
run_migrations(engine)

inspector = inspect(engine)
cols = {c["name"] for c in inspector.get_columns("service_requests")}
need = {"crew_id", "job_type", "scheduled_for", "price", "rating", "confirmed_at", "customer_confirmed"}
assert need <= cols, f"missing: {need - cols}"
wcols = {c["name"] for c in inspector.get_columns("workers")}
assert "is_verified" in wcols

tables = set(inspector.get_table_names())
for t in ["worker_certifications", "crews", "crew_members", "job_confirmations", "area_job_stats"]:
    assert t in tables, f"missing table {t}"

# Backfill check
with engine.connect() as conn:
    n = conn.execute(text("SELECT COUNT(*) FROM workers WHERE is_verified = 1")).scalar()
print("migration ok; verified workers backfilled:", n)
engine.dispose()
os.remove("_migration_test.db")
