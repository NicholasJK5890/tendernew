import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool

IS_VERCEL = bool(os.environ.get("VERCEL"))


def _resolve_database_url() -> str:
    # Accept DATABASE_URL, or the variables Vercel's Postgres / Neon integration injects.
    url = (
        os.getenv("DATABASE_URL")
        or os.getenv("POSTGRES_URL")
        or os.getenv("POSTGRES_URL_NON_POOLING")
        or ""
    ).strip()

    if not url:
        return "sqlite:///./tenderlens.db"

    # Normalise Heroku / Vercel / Neon style URLs to the psycopg2 driver explicitly.
    # (Newer SQLAlchemy versions default a bare "postgresql://" to psycopg v3,
    #  which is not what requirements.txt installs.)
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            url = "postgresql+psycopg2://" + url[len(prefix):]
            break
    return url


DATABASE_URL = _resolve_database_url()

# Vercel's project directory is read-only; only /tmp is writable.
# SQLite on Vercel is therefore an ephemeral demo fallback (re-seeded on cold start).
# For real persistence set DATABASE_URL to a hosted Postgres.
if DATABASE_URL.startswith("sqlite") and IS_VERCEL:
    DATABASE_URL = "sqlite:////tmp/tenderlens.db"

_is_sqlite = DATABASE_URL.startswith("sqlite")

_engine_kwargs = {"pool_pre_ping": True}
if _is_sqlite:
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
elif IS_VERCEL:
    # Serverless: don't hold pooled connections between invocations.
    _engine_kwargs["poolclass"] = NullPool
    _engine_kwargs.pop("pool_pre_ping")

engine = create_engine(DATABASE_URL, **_engine_kwargs)

# Enable foreign keys for SQLite
if _is_sqlite:
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
