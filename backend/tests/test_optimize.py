"""
backend/tests/test_optimize.py
Tests for the quantum pairing optimize endpoint.
"""

def _register_and_login(client, email, password="password123", panel_kw=5.0):
    client.post("/api/auth/register", json={
        "name": email.split("@")[0], "email": email,
        "password": password, "panel_capacity_kw": panel_kw
    })
    res = client.post("/api/auth/login", data={"username": email, "password": password})
    return res.json()["access_token"]

def test_optimize_no_orders(client):
    """With no open listings, optimize should return no_pairs_available."""
    res = client.post("/api/market/optimize")
    assert res.status_code == 200
    assert res.json()["status"] == "no_pairs_available"
    assert res.json()["matched_pairs"] == 0

def test_optimize_only_bids_no_asks(client):
    token = _register_and_login(client, "buyer@qtrade.test")
    client.post("/api/listings",
        json={"offer_type": "buy", "kwh_amount": 5.0, "price_per_kwh": 0.12},
        headers={"Authorization": f"Bearer {token}"}
    )
    res = client.post("/api/market/optimize")
    assert res.status_code == 200
    assert res.json()["status"] == "no_pairs_available"

def test_optimize_matching_pair(client):
    """One buyer + one seller with overlapping prices should produce a match."""
    buyer_token = _register_and_login(client, "buyer2@qtrade.test")
    seller_token = _register_and_login(client, "seller2@qtrade.test")

    client.post("/api/listings",
        json={"offer_type": "buy", "kwh_amount": 5.0, "price_per_kwh": 0.13},
        headers={"Authorization": f"Bearer {buyer_token}"}
    )
    client.post("/api/listings",
        json={"offer_type": "sell", "kwh_amount": 5.0, "price_per_kwh": 0.11},
        headers={"Authorization": f"Bearer {seller_token}"}
    )

    res = client.post("/api/market/optimize")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["matched_pairs"] >= 1
    assert len(data["transactions"]) >= 1

def test_optimize_creates_transactions(client):
    """After optimize, transactions endpoint should return matched records."""
    buyer_token = _register_and_login(client, "buyer3@qtrade.test")
    seller_token = _register_and_login(client, "seller3@qtrade.test")

    client.post("/api/listings",
        json={"offer_type": "buy", "kwh_amount": 3.0, "price_per_kwh": 0.14},
        headers={"Authorization": f"Bearer {buyer_token}"}
    )
    client.post("/api/listings",
        json={"offer_type": "sell", "kwh_amount": 3.0, "price_per_kwh": 0.10},
        headers={"Authorization": f"Bearer {seller_token}"}
    )
    client.post("/api/market/optimize")

    res = client.get("/api/transactions")
    assert res.status_code == 200
    txs = res.json()
    assert len(txs) >= 1
    assert txs[0]["status"] == "completed"
