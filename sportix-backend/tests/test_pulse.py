"""
Pytest tests for SPORTiX Pulse endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from main import app

client = TestClient(app)

MOCK_PULSE = {
    "userId": "user123",
    "totalPulse": 350.0,
    "matchPerformance": 80.0,
    "consistency": 60.0,
    "teamChemistry": 50.0,
    "reliability": 70.0,
    "activity": 40.0,
    "leadership": 30.0,
    "level": 2,
    "level_progress_percent": 45.0,
    "prestige_rank": "Rising Star",
}


def _auth_headers():
    return {"Authorization": "Bearer mock_jwt_token"}


@patch("app.services.pulse_service.get_pulse", return_value=MOCK_PULSE)
def test_get_my_pulse(mock_pulse):
    r = client.get("/api/pulse/me", headers=_auth_headers())
    assert r.status_code == 200
    data = r.json()
    assert data["success"] is True
    assert data["data"]["totalPulse"] == 350.0
    assert data["data"]["prestige_rank"] == "Rising Star"


@patch("app.services.pulse_service.get_level", return_value={"level": 2, "xp": 350, "progressPercent": 45})
def test_get_my_level(mock_level):
    r = client.get("/api/pulse/me/level", headers=_auth_headers())
    assert r.status_code == 200
    assert r.json()["data"]["level"] == 2


@patch("app.services.pulse_service.get_history", return_value={"documents": [], "total": 0})
def test_pulse_history(mock_history):
    r = client.get("/api/pulse/me/history", headers=_auth_headers())
    assert r.status_code == 200


@patch("app.services.pulse_service.get_pulse", return_value=MOCK_PULSE)
def test_get_other_user_pulse(mock_pulse):
    r = client.get("/api/pulse/other_user_id", headers=_auth_headers())
    assert r.status_code == 200
    assert r.json()["success"] is True
