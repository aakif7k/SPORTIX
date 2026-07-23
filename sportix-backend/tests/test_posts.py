"""
Pytest tests for Posts endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from main import app

client = TestClient(app)

MOCK_POST = {
    "$id": "post_abc",
    "authorId": "user123",
    "content": "Just finished a great training session! ⚽",
    "mediaUrls": "[]",
    "mediaType": "none",
    "postType": "training",
    "likesCount": 5,
    "commentsCount": 2,
}

MOCK_FEED = {"documents": [MOCK_POST], "total": 1}


def _auth_headers():
    return {"Authorization": "Bearer mock_jwt_token"}


@patch("app.services.post_service.get_feed", return_value=MOCK_FEED)
def test_get_feed(mock_feed):
    r = client.get("/api/posts/feed", headers=_auth_headers())
    assert r.status_code == 200
    assert r.json()["success"] is True


@patch("app.services.post_service.create", return_value=MOCK_POST)
def test_create_post(mock_create):
    r = client.post("/api/posts/", json={
        "content": "Just finished a great training session!",
        "post_type": "training",
    }, headers=_auth_headers())
    assert r.status_code == 201
    assert r.json()["success"] is True


@patch("app.services.post_service.toggle_like", return_value={"liked": True})
def test_like_post(mock_like):
    r = client.post("/api/posts/post_abc/like", headers=_auth_headers())
    assert r.status_code == 200
    assert r.json()["data"]["liked"] is True


@patch("app.services.post_service.get_comments", return_value={"documents": [], "total": 0})
def test_get_comments(mock_comments):
    r = client.get("/api/posts/post_abc/comments", headers=_auth_headers())
    assert r.status_code == 200
