from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool

from .config import settings

# Accept both the raw Turso URL (libsql://) and the SQLAlchemy dialect URL
# (sqlite+libsql://) so pasting either into DATABASE_URL works.
database_url = settings.database_url
if database_url.startswith("libsql://"):
    database_url = "sqlite+" + database_url

if database_url.startswith("sqlite+libsql"):
    try:
        engine = create_engine(
            database_url,
            connect_args={"auth_token": settings.turso_auth_token},
            poolclass=NullPool,
            pool_pre_ping=True,
        )
    except Exception:
        raise RuntimeError(
            "A sqlite+libsql:// DATABASE_URL was used but the Turso dialect is not "
            "installed. On Windows this is expected — sqlalchemy-libsql only ships "
            "Linux/macOS wheels. Install it on Render via requirements-render.txt."
        )
elif database_url.startswith("sqlite"):
    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_engine(database_url)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
