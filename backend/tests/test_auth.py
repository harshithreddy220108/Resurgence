"""
backend/tests/test_auth.py
Tests for register, login, and JWT validation.
"""
import pytest

# ── Register ──────────────────────────────────────────────────────────────────

def test_register_success(client):
    res = client.post("/api/auth/register", json={
        "name": "Alice Solar",
        "email": "alice@qtrade.test",
        "password": "securepass123",
        "panel_capacity_kw": 5.0
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["name"] == "Alice Solar"

def test_register_duplicate_email(client):
    payload = {"name": "Bob", "email": "bob@qtrade.test", "password": "password123"}
    client.post("/api/auth/register", json=payload)
    res = client.post("/api/auth/register", json=payload)
    assert res.status_code == 409

def test_register_short_password(client):
    res = client.post("/api/auth/register", json={
        "name": "Charlie", "email": "charlie@qtrade.test", "password": "short"
    })
    assert res.status_code == 422  # Pydantic validation error

def test_register_invalid_email(client):
    res = client.post("/api/auth/register", json={
        "name": "Dave", "email": "not-an-email", "password": "password123"
    })
    assert res.status_code == 422

# ── Login ──────────────────────────────────────────────────────────────────────

def test_login_success(client):
    client.post("/api/auth/register", json={
        "name": "Eve", "email": "eve@qtrade.test", "password": "mypassword99"
    })
    res = client.post("/api/auth/login", data={
        "username": "eve@qtrade.test", "password": "mypassword99"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_wrong_password(client):
    client.post("/api/auth/register", json={
        "name": "Frank", "email": "frank@qtrade.test", "password": "correctpass1"
    })
    res = client.post("/api/auth/login", data={
        "username": "frank@qtrade.test", "password": "wrongpassword"
    })
    assert res.status_code == 401

def test_login_unknown_email(client):
    res = client.post("/api/auth/login", data={
        "username": "nobody@qtrade.test", "password": "doesnotmatter"
    })
    assert res.status_code == 401

# ── /auth/me ───────────────────────────────────────────────────────────────────

def test_me_authenticated(client):
    reg = client.post("/api/auth/register", json={
        "name": "Grace", "email": "grace@qtrade.test", "password": "password123"
    })
    token = reg.json()["access_token"]
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "grace@qtrade.test"

def test_me_unauthenticated(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401
