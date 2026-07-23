"""
Pytest tests for user endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from main import app

client = TestClient(app)

MOCK_PROFILE = {
    "$id": "user123",
    "username": "testplayer",
    "fullName": "Test Player",
    "sport": "football",
    "role": "athlete",
    "experienceLevel": "amateur",
    "followersCount": 42,
    "followingCount": 18,
    "postsCount": 7,
}


def _auth_headers():
    return {"Authorization": "Bearer mock_jwt_token"}


@patch("app.services.user_service.get_full_profile", return_value=MOCK_PROFILE)
def test_get_my_profile(mock_profile):
    r = client.get("/api/users/me", headers=_auth_headers())
    assert r.status_code == 200
    assert r.json()["success"] is True


@patch("app.services.user_service.search_users")
def test_search_users(mock_search):
    mock_search.return_value = {"documents": [], "total": 0}
    r = client.get("/api/users/search?q=test&sport=football", headers=_auth_headers())
    assert r.status_code == 200


@patch("app.services.user_service.follow")
def test_follow_user(mock_follow):
    mock_follow.return_value = None
    r = client.post("/api/users/other_user_id/follow", headers=_auth_headers())
    assert r.status_code == 200
    assert r.json()["success"] is True
