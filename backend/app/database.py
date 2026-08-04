from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool
from urllib.parse import urlparse, urlunparse

from .config import settings


def build_turso_url(db_url: str) -> str:
    """
    Accepts libsql:// URLs and converts them to the proper SQLAlchemy format.

    Expected formats:
      Input:  libsql://skillbridge-mwemmz.aws-ap-northeast-1.turso.io
      Output: sqlite+libsql://skillbridge-mwemmz.aws-ap-northeast-1.turso.io?secure=true

    The auth token is passed via connect_args={"auth_token": ...} (see get_engine),
    matching the documented sqlalchemy-libsql usage. The URL keeps ?secure=true so
    the driver uses HTTPS (without it the server answers with a 301/308 redirect).
    """
    parsed = urlparse(db_url)
    db_name = parsed.netloc

    if not db_name:
        raise ValueError(f"Invalid libsql URL (missing hostname): {db_url}")

    return f"sqlite+libsql://{db_name}?secure=true"


def get_engine(database_url: str):
    """
    Returns a SQLAlchemy engine configured for the given DATABASE_URL.
    Supports:
      - sqlite:///./skillbridge.db
      - libsql://... (will be normalized to sqlite+libsql://...)
      - sqlite+libsql://... (already in correct format)
    """
    if database_url.startswith("sqlite"):
        engine = create_engine(
            database_url,
            connect_args={"check_same_thread": False},
        )
    else:
        if not database_url.startswith("libsql://"):
            raise ValueError(
                f"Invalid database URL format: {database_url}. "
                "Expected sqlite://... or libsql://..."
            )

        database_url = build_turso_url(database_url)

        auth_token = settings.turso_auth_token
        if not auth_token:
            raise RuntimeError(
                "DATABASE_URL starts with 'libsql://' but TURSO_AUTH_TOKEN is not set. "
                "Provide the token in Render (or via .env locally) so the app can connect."
            )

        engine = create_engine(
            database_url,
            connect_args={"auth_token": auth_token},
            poolclass=NullPool,
            pool_pre_ping=True,
        )
    return engine


engine = get_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
