"""
backend/tests/conftest.py

Key insight: SQLite :memory: databases are per-connection. Two engine objects with
the same URL are two different DBs. The fix is to reuse the SAME engine that
main.py / database.py uses (after patching the URL), and create_all on that one.
"""
import pytest
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# ── Patch settings BEFORE importing anything else from backend ────────────────
import backend.config as _cfg
_cfg.settings.database_url = "sqlite:///:memory:"
_cfg.settings.secret_key = "test-secret-key-32-bytes-long!!!!"
_cfg.settings.allowed_origins = "http://localhost:5173"

# ── Now import the database module — it reads settings at import time ─────────
import backend.database as _db

# Patch database.engine to use a shared SQLite connection so all sessions
# and create_all operate on the same in-memory database.
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool

shared_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,  # All connections share the same in-memory DB
)
_db.engine = shared_engine  # Replace engine BEFORE app creates tables

# Patch SessionLocal too so get_db() uses the shared engine
_db.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=shared_engine)

# ── Import app AFTER patching ─────────────────────────────────────────────────
from backend.database import Base, get_db
from backend.main import app

# Override dependency
def override_get_db():
    db = _db.SessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def reset_db():
    """Drop and recreate all tables on the shared engine before each test."""
    Base.metadata.drop_all(bind=shared_engine)
    Base.metadata.create_all(bind=shared_engine)
    yield
    Base.metadata.drop_all(bind=shared_engine)


@pytest.fixture
def client(reset_db):
    with TestClient(app) as c:
        yield c
