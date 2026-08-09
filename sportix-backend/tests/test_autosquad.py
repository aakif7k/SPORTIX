import pytest
from unittest.mock import MagicMock, patch
from app.services.ai_squad_service import (
    compute_player_ssr,
    compute_pair_chemistry,
    calculate_haversine_distance,
    MATCH_WEIGHTS,
)
from app.schemas.ai import AutoSquadRequest, SkillLevel, EntryType

def test_haversine_distance():
    # Distance between Chennai (13.0827, 80.2707) and Bengaluru (12.9716, 77.5946) ~ 290 km
    dist = calculate_haversine_distance(13.0827, 80.2707, 12.9716, 77.5946)
    assert 280.0 <= dist <= 310.0

def test_provisional_ssr_for_new_player():
    profile = {"$id": "new_user_1", "experience_level": "amateur"}
    matches = []
    ssr, status = compute_player_ssr(profile, matches)
    assert ssr == 68.0
    assert status == "provisional"

def test_established_ssr_with_match_history():
    profile = {"$id": "pro_user_1", "experience_level": "pro"}
    matches = [
        {"home_squad_id": "pro_user_1", "result": "W"},
        {"home_squad_id": "pro_user_1", "result": "W"},
        {"away_squad_id": "pro_user_1", "result": "L"},
        {"home_squad_id": "pro_user_1", "result": "W"},
    ]
    ssr, status = compute_player_ssr(profile, matches)
    assert status == "established"
    assert ssr > 80.0

def test_pair_chemistry_no_history():
    chem, confidence, evidence = compute_pair_chemistry("user_1", "user_2", [], [])
    assert chem is None
    assert confidence == "LOW"
    assert evidence == "Insufficient match history"

def test_pair_chemistry_with_history():
    matches = [{"home_squad_id": "user_1", "away_squad_id": "user_2", "result": "W"}]
    crew_members = [{"crew_id": "crew_99", "user_id": "user_1"}, {"crew_id": "crew_99", "user_id": "user_2"}]
    chem, confidence, evidence = compute_pair_chemistry("user_1", "user_2", matches, crew_members)
    assert chem is not None
    assert chem >= 75.0
    assert confidence in ["MEDIUM", "HIGH"]
    assert "matches together" in evidence or "crew" in evidence

def test_match_weights_total_hundred():
    total_weight = sum(MATCH_WEIGHTS.values())
    assert abs(total_weight - 1.0) < 0.001
