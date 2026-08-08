from sqlalchemy import inspect, text

# CREATE TABLE is handled by Base.metadata.create_all (new tables appear
# automatically). Existing databases only need new columns, which SQLAlchemy
# will NOT add on its own, so we add them here with plain ALTER TABLE.
# One row per missing column: (table, column, ddl)
COLUMN_MIGRATIONS = [
    ("workers", "is_verified", "ALTER TABLE workers ADD COLUMN is_verified BOOLEAN DEFAULT 0"),
    ("service_requests", "crew_id", "ALTER TABLE service_requests ADD COLUMN crew_id INTEGER"),
    (
        "service_requests",
        "job_type",
        "ALTER TABLE service_requests ADD COLUMN job_type VARCHAR(40) DEFAULT 'booking'",
    ),
    (
        "service_requests",
        "scheduled_for",
        "ALTER TABLE service_requests ADD COLUMN scheduled_for DATETIME",
    ),
    ("service_requests", "price", "ALTER TABLE service_requests ADD COLUMN price FLOAT"),
    ("service_requests", "rating", "ALTER TABLE service_requests ADD COLUMN rating INTEGER"),
    (
        "service_requests",
        "confirmed_at",
        "ALTER TABLE service_requests ADD COLUMN confirmed_at DATETIME",
    ),
    (
        "service_requests",
        "customer_confirmed",
        "ALTER TABLE service_requests ADD COLUMN customer_confirmed BOOLEAN DEFAULT 0",
    ),
]


def run_migrations(engine) -> None:
    """Add missing columns to pre-existing tables and backfill derived state."""
    try:
        inspector = inspect(engine)
        tables = set(inspector.get_table_names())
    except Exception:
        # Unsupported inspector (some libsql setups) - fall back to create_all only.
        return

    with engine.begin() as conn:
        for table, column, ddl in COLUMN_MIGRATIONS:
            if table not in tables:
                continue
            columns = {c["name"] for c in inspector.get_columns(table)}
            if column in columns:
                continue
            conn.execute(text(ddl))

    # Backfill is_verified from the three verification flags.
    if "workers" in tables and "verifications" in tables:
        with engine.begin() as conn:
            conn.execute(
                text(
                    """
                    UPDATE workers SET is_verified = 1 WHERE is_verified = 0 AND EXISTS (
                        SELECT 1 FROM verifications v
                        WHERE v.worker_id = workers.id
                          AND v.identity_verified = 1
                          AND v.certificate_verified = 1
                          AND v.compliance_verified = 1
                    )
                    """
                )
            )
