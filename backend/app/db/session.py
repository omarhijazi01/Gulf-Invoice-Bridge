from pathlib import Path
from threading import Lock

from fastapi import Request
from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    pass


def make_engine(url):
    if url.startswith("sqlite:///") and ":memory:" not in url:
        Path(url.removeprefix("sqlite:///")).parent.mkdir(parents=True, exist_ok=True)
    engine = create_engine(url, connect_args={"check_same_thread": False, "timeout": 15})

    @event.listens_for(engine, "connect")
    def sqlite_settings(connection, _):
        connection.execute("PRAGMA foreign_keys=ON")
        connection.execute("PRAGMA journal_mode=WAL")

    return engine


def ensure_owner_column():
    # Existing SQLite demo databases predate account ownership.
    if engine.dialect.name != "sqlite":
        return
    if "invoices" not in inspect(engine).get_table_names():
        return
    if "owner_id" in {column["name"] for column in inspect(engine).get_columns("invoices")}:
        return
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE invoices ADD COLUMN owner_id VARCHAR(36)"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS ix_invoices_owner_id ON invoices (owner_id)"))


engine = make_engine(settings.database_url)
SessionLocal = sessionmaker(engine, expire_on_commit=False)
_seed_lock = Lock()
_seeded_owners: set[str] = set()


def get_db(request: Request):
    with SessionLocal() as session:
        owner_id = getattr(request.state, "user_id", None)
        session.info["owner_id"] = owner_id
        if settings.auth_required and settings.auto_seed_demo and owner_id:
            with _seed_lock:
                if owner_id not in _seeded_owners:
                    from app.services.demo_seed import seed_portfolio_demo
                    seed_portfolio_demo(session, owner_id=owner_id)
                    _seeded_owners.add(owner_id)
        yield session
