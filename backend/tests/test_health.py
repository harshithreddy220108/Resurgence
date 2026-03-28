"""
backend/tests/test_health.py
Tests for health check and root endpoints.
"""

def test_root(client):
    res = client.get("/")
    assert res.status_code == 200
    assert "Q-Trade" in res.json()["message"]

def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["db"] == "connected"
    assert "uptime_s" in data
    assert "version" in data
