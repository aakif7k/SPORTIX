import pytest
from fastapi.testclient import TestClient
from main import app
from app.services.sports_role_service import get_all_sports_roles, get_sport_role_by_id
from app.utils.seed_sports_roles import SPORTS_ROLE_DATASET

client = TestClient(app)

def test_database_and_dataset_count():
    """Verify table/dataset contains exactly 30 sports with unique IDs."""
    roles = get_all_sports_roles()
    assert len(roles) == 30
    
    sport_ids = [r["sport_id"] for r in roles]
    assert len(set(sport_ids)) == 30
    assert sport_ids[0] == "S001"
    assert sport_ids[-1] == "S030"

def test_every_sport_has_four_roles_and_counts():
    """Verify every sport has 4 roles, integer counts >= 0, and total_players."""
    roles = get_all_sports_roles()
    for r in roles:
        assert r["sport_id"] is not None
        assert r["sport"] is not None
        assert len(r["roles"]) == 4
        assert r["role_1"]
        assert r["role_2"]
        assert r["role_3"]
        assert r["role_4"]
        assert isinstance(r["role_1_count"], int) and r["role_1_count"] >= 0
        assert isinstance(r["role_2_count"], int) and r["role_2_count"] >= 0
        assert isinstance(r["role_3_count"], int) and r["role_3_count"] >= 0
        assert isinstance(r["role_4_count"], int) and r["role_4_count"] >= 0
        assert isinstance(r["total_players"], int) and r["total_players"] >= 0

def test_api_list_sports_roles():
    """Test GET /api/sports/roles endpoint returns role counts and total_players."""
    response = client.get("/api/sports/roles")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 30
    assert data[0]["sport_id"] == "S001"
    assert data[0]["sport"] == "Football"
    assert data[0]["roles"] == ["Goalkeeper", "Defender", "Midfielder", "Forward"]
    assert data[0]["role_1_count"] == 1
    assert data[0]["role_2_count"] == 4
    assert data[0]["role_3_count"] == 3
    assert data[0]["role_4_count"] == 3
    assert data[0]["total_players"] == 11

def test_api_get_spot_checks():
    """Spot checks for S001, S002, S003, S004, S015, S029, S030."""
    # S001 Football
    res = client.get("/api/sports/roles/S001")
    assert res.status_code == 200
    d = res.json()
    assert d["sport"] == "Football"
    assert d["role_1_count"] == 1
    assert d["role_2_count"] == 4
    assert d["role_3_count"] == 3
    assert d["role_4_count"] == 3
    assert d["total_players"] == 11

    # S002 Cricket
    res = client.get("/api/sports/roles/S002")
    assert res.status_code == 200
    d = res.json()
    assert d["sport"] == "Cricket"
    assert d["role_1_count"] == 4
    assert d["role_2_count"] == 4
    assert d["role_3_count"] == 2
    assert d["role_4_count"] == 1
    assert d["total_players"] == 11

    # S003 Basketball
    res = client.get("/api/sports/roles/S003")
    assert res.status_code == 200
    d = res.json()
    assert d["sport"] == "Basketball"
    assert d["role_1_count"] == 1
    assert d["role_2_count"] == 1
    assert d["role_3_count"] == 2
    assert d["role_4_count"] == 1
    assert d["total_players"] == 5

    # S004 Volleyball
    res = client.get("/api/sports/roles/S004")
    assert res.status_code == 200
    d = res.json()
    assert d["sport"] == "Volleyball"
    assert d["role_1_count"] == 1
    assert d["role_2_count"] == 2
    assert d["role_3_count"] == 2
    assert d["role_4_count"] == 1
    assert d["total_players"] == 6

    # S015 MMA (by name)
    res = client.get("/api/sports/roles/MMA")
    assert res.status_code == 200
    d = res.json()
    assert d["sport_id"] == "S015"
    assert d["sport"] == "MMA"
    assert d["roles"] == ["Striker", "Wrestler", "Grappler", "All-Rounder"]

    # S029 Futsal
    res = client.get("/api/sports/roles/S029")
    assert res.status_code == 200
    d = res.json()
    assert d["sport"] == "Futsal"
    assert d["role_1_count"] == 1
    assert d["role_2_count"] == 1
    assert d["role_3_count"] == 2
    assert d["role_4_count"] == 1
    assert d["total_players"] == 5

    # S030 Squash
    res = client.get("/api/sports/roles/S030")
    assert res.status_code == 200
    d = res.json()
    assert d["sport"] == "Squash"
    assert d["role_1_count"] == 1
    assert d["role_2_count"] == 1
    assert d["role_3_count"] == 1
    assert d["role_4_count"] == 1

def test_api_get_not_found():
    """Test 404 for invalid sport ID."""
    res = client.get("/api/sports/roles/S999")
    assert res.status_code == 404
