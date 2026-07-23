"""
Pytest tests for Squads endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from main import app

client = TestClient(app)

MOCK_SQUAD = {
    "$id": "squad_xyz",
    "name": "Thunder FC",
    "sport": "football",
    "captainId": "user123",
    "formation": "4-3-3",
    "membersCount": 5,
    "chemistryScore": 78.5,
}

MOCK_MEMBERS = {"documents": [], "total": 0}


def _auth_headers():
    return {"Authorization": "Bearer mock_jwt_token"}


@patch("app.services.squad_service.get_user_squads", return_value={"owned": {"documents": [MOCK_SQUAD]}, "memberships": {"documents": []}})
def test_my_squads(mock_squads):
    r = client.get("/api/squads/me", headers=_auth_headers())
    assert r.status_code == 200
    assert r.json()["success"] is True


@patch("app.services.squad_service.create", return_value=MOCK_SQUAD)
def test_create_squad(mock_create):
    r = client.post("/api/squads/", json={
        "name": "Thunder FC",
        "sport": "football",
        "formation": "4-3-3",
    }, headers=_auth_headers())
    assert r.status_code == 201
    assert r.json()["success"] is True
    assert r.json()["data"]["name"] == "Thunder FC"


@patch("app.services.squad_service.get_by_id", return_value=MOCK_SQUAD)
def test_get_squad(mock_get):
    r = client.get("/api/squads/squad_xyz", headers=_auth_headers())
    assert r.status_code == 200


@patch("app.services.squad_service.get_members", return_value=MOCK_MEMBERS)
def test_get_members(mock_members):
    r = client.get("/api/squads/squad_xyz/members", headers=_auth_headers())
    assert r.status_code == 200


@patch("app.services.squad_service.get_chemistry", return_value={"chemistry_score": 78.5, "member_count": 5, "avg_pulse": 320})
def test_get_chemistry(mock_chem):
    r = client.get("/api/squads/squad_xyz/chemistry", headers=_auth_headers())
    assert r.status_code == 200
    assert r.json()["data"]["chemistry_score"] == 78.5
