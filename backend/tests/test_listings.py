"""
backend/tests/test_listings.py
Tests for energy listing creation and validation.
"""

def _register_and_login(client, email="user@qtrade.test", password="password123"):
    client.post("/api/auth/register", json={"name": "Trader", "email": email, "password": password})
    res = client.post("/api/auth/login", data={"username": email, "password": password})
    return res.json()["access_token"]

# ── GET listings ───────────────────────────────────────────────────────────────

def test_get_listings_empty(client):
    res = client.get("/api/listings")
    assert res.status_code == 200
    assert res.json() == []

# ── POST listing ───────────────────────────────────────────────────────────────

def test_create_listing_authenticated(client):
    token = _register_and_login(client)
    res = client.post("/api/listings",
        json={"offer_type": "sell", "kwh_amount": 5.0, "price_per_kwh": 0.12},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 201
    assert res.json()["status"] == "success"

def test_create_listing_unauthenticated(client):
    """Unauthenticated listing should work (backward compat) if any user exists."""
    # Register a user first so there's a fallback user
    client.post("/api/auth/register", json={"name": "Seed", "email": "seed@qtrade.test", "password": "password123"})
    res = client.post("/api/listings",
        json={"offer_type": "buy", "kwh_amount": 2.0, "price_per_kwh": 0.11}
    )
    assert res.status_code == 201

def test_create_listing_invalid_offer_type(client):
    token = _register_and_login(client)
    res = client.post("/api/listings",
        json={"offer_type": "lease", "kwh_amount": 5.0, "price_per_kwh": 0.12},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 422

def test_create_listing_negative_kwh(client):
    token = _register_and_login(client)
    res = client.post("/api/listings",
        json={"offer_type": "sell", "kwh_amount": -1.0, "price_per_kwh": 0.12},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 422

def test_create_listing_price_too_high(client):
    token = _register_and_login(client)
    res = client.post("/api/listings",
        json={"offer_type": "sell", "kwh_amount": 5.0, "price_per_kwh": 999.0},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 422

def test_listings_appear_in_get(client):
    token = _register_and_login(client)
    client.post("/api/listings",
        json={"offer_type": "sell", "kwh_amount": 3.5, "price_per_kwh": 0.115},
        headers={"Authorization": f"Bearer {token}"}
    )
    res = client.get("/api/listings?status=open")
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["kwh"] == 3.5
