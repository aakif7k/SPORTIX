"""
Auth endpoint tests.
Run with: pytest tests/test_auth.py -v
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


def test_root():
    r = client.get("/")
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "SPORTiX API"


@patch("app.services.auth_service.register_user")
def test_register(mock_register):
    mock_register.return_value = {"user_id": "123", "email": "test@example.com", "username": "testuser"}
    r = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "securepass",
        "full_name": "Test User",
        "username": "testuser",
        "sport": "football",
    })
    assert r.status_code == 201
    assert r.json()["success"] is True


def test_register_short_username():
    r = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "securepass",
        "full_name": "Test User",
        "username": "ab",
    })
    assert r.status_code == 422  # Validation error


def test_register_short_password():
    r = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "short",
        "full_name": "Test User",
        "username": "validuser",
    })
    assert r.status_code == 422
