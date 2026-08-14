import pytest
from app.services.universal_role_engine import (
    allocate_event_participants,
    validate_sport_config,
    extract_role_definitions,
)
from app.services.sports_role_service import get_sport_role_by_id


def test_football_11_players_single_team():
    config = get_sport_role_by_id("Football")
    assert config is not None
    # 1 Goalkeeper, 4 Defender, 3 Midfielder, 3 Forward = 11 players
    participants = (
        [{"user_id": f"gk_{i}", "role": "Goalkeeper"} for i in range(1)] +
        [{"user_id": f"def_{i}", "role": "Defender"} for i in range(4)] +
        [{"user_id": f"mid_{i}", "role": "Midfielder"} for i in range(3)] +
        [{"user_id": f"fwd_{i}", "role": "Forward"} for i in range(3)]
    )
    result = allocate_event_participants(config, participants, event_capacity=32)
    assert result.registered_count == 11
    assert result.completed_teams_count == 1
    assert result.partial_teams_count == 0
    assert result.waiting_players_count == 0
    assert result.teams[0].is_complete is True
    assert result.teams[0].status == "READY"
    assert result.overall_readiness_pct == 100.0


def test_football_22_players_two_teams():
    config = get_sport_role_by_id("Football")
    participants = (
        [{"user_id": f"gk_{i}", "role": "Goalkeeper"} for i in range(2)] +
        [{"user_id": f"def_{i}", "role": "Defender"} for i in range(8)] +
        [{"user_id": f"mid_{i}", "role": "Midfielder"} for i in range(6)] +
        [{"user_id": f"fwd_{i}", "role": "Forward"} for i in range(6)]
    )
    result = allocate_event_participants(config, participants, event_capacity=32)
    assert result.registered_count == 22
    assert result.completed_teams_count == 2
    assert result.partial_teams_count == 0
    assert result.waiting_players_count == 0
    assert result.teams[0].status == "READY"
    assert result.teams[1].status == "READY"


def test_football_32_players_two_complete_one_partial():
    config = get_sport_role_by_id("Football")
    # 2 full teams (22) + 10 players in Team 3 (1 GK, 4 DEF, 3 MID, 2 FWD -> missing 1 FWD)
    participants = (
        [{"user_id": f"gk_{i}", "role": "Goalkeeper"} for i in range(3)] +
        [{"user_id": f"def_{i}", "role": "Defender"} for i in range(12)] +
        [{"user_id": f"mid_{i}", "role": "Midfielder"} for i in range(9)] +
        [{"user_id": f"fwd_{i}", "role": "Forward"} for i in range(8)]
    )
    assert len(participants) == 32
    result = allocate_event_participants(config, participants, event_capacity=32)
    assert result.registered_count == 32
    assert result.completed_teams_count == 2
    assert result.partial_teams_count == 1
    assert result.waiting_players_count == 0
    assert len(result.teams) == 3
    assert result.teams[0].current_players == 11 and result.teams[0].status == "READY"
    assert result.teams[1].current_players == 11 and result.teams[1].status == "READY"
    assert result.teams[2].current_players == 10 and result.teams[2].status == "FORMING"
    # Forward remaining space in Team 3 should be 1
    fwd_slot = next(r for r in result.teams[2].roles if r.role_name == "Forward")
    assert fwd_slot.filled_count == 2
    assert fwd_slot.remaining_space == 1
    assert fwd_slot.status == "PARTIAL"


def test_cricket_11_and_22_players():
    config = get_sport_role_by_id("Cricket")
    assert config is not None
    # Batter: 4, Bowler: 4, All-Rounder: 2, Wicketkeeper: 1
    p11 = (
        [{"user_id": f"bat_{i}", "role": "Batter"} for i in range(4)] +
        [{"user_id": f"bowl_{i}", "role": "Bowler"} for i in range(4)] +
        [{"user_id": f"ar_{i}", "role": "All-Rounder"} for i in range(2)] +
        [{"user_id": f"wk_{i}", "role": "Wicketkeeper"} for i in range(1)]
    )
    res11 = allocate_event_participants(config, p11)
    assert res11.completed_teams_count == 1
    assert res11.partial_teams_count == 0
    assert res11.teams[0].status == "READY"

    p22 = (
        [{"user_id": f"bat_{i}", "role": "Batter"} for i in range(8)] +
        [{"user_id": f"bowl_{i}", "role": "Bowler"} for i in range(8)] +
        [{"user_id": f"ar_{i}", "role": "All-Rounder"} for i in range(4)] +
        [{"user_id": f"wk_{i}", "role": "Wicketkeeper"} for i in range(2)]
    )
    res22 = allocate_event_participants(config, p22)
    assert res22.completed_teams_count == 2
    assert res22.partial_teams_count == 0


def test_basketball_5_and_10_players():
    config = get_sport_role_by_id("Basketball")
    # Point Guard: 1, Shooting Guard: 1, Forward: 2, Center: 1 = 5
    p5 = (
        [{"user_id": "pg", "role": "Point Guard"},
         {"user_id": "sg", "role": "Shooting Guard"},
         {"user_id": "f1", "role": "Forward"},
         {"user_id": "f2", "role": "Forward"},
         {"user_id": "c1", "role": "Center"}]
    )
    res5 = allocate_event_participants(config, p5)
    assert res5.completed_teams_count == 1
    assert res5.teams[0].current_players == 5
    assert res5.teams[0].status == "READY"

    p10 = p5 + [
        {"user_id": "pg2", "role": "Point Guard"},
        {"user_id": "sg2", "role": "Shooting Guard"},
        {"user_id": "f3", "role": "Forward"},
        {"user_id": "f4", "role": "Forward"},
        {"user_id": "c2", "role": "Center"},
    ]
    res10 = allocate_event_participants(config, p10)
    assert res10.completed_teams_count == 2


def test_volleyball_6_and_12_players():
    config = get_sport_role_by_id("Volleyball")
    # Setter: 1, Outside Hitter: 2, Middle Blocker: 2, Libero: 1 = 6
    p6 = (
        [{"user_id": "s1", "role": "Setter"}] +
        [{"user_id": f"oh_{i}", "role": "Outside Hitter"} for i in range(2)] +
        [{"user_id": f"mb_{i}", "role": "Middle Blocker"} for i in range(2)] +
        [{"user_id": "lib1", "role": "Libero"}]
    )
    res6 = allocate_event_participants(config, p6)
    assert res6.completed_teams_count == 1
    assert res6.teams[0].current_players == 6

    p12 = p6 + (
        [{"user_id": "s2", "role": "Setter"}] +
        [{"user_id": f"oh2_{i}", "role": "Outside Hitter"} for i in range(2)] +
        [{"user_id": f"mb2_{i}", "role": "Middle Blocker"} for i in range(2)] +
        [{"user_id": "lib2", "role": "Libero"}]
    )
    res12 = allocate_event_participants(config, p12)
    assert res12.completed_teams_count == 2


def test_rugby_15_and_30_players():
    config = get_sport_role_by_id("Rugby")
    # Forward: 8, Scrum-Half: 1, Back: 5, Fullback: 1 = 15
    p15 = (
        [{"user_id": f"fwd_{i}", "role": "Forward"} for i in range(8)] +
        [{"user_id": "sh", "role": "Scrum-Half"}] +
        [{"user_id": f"bk_{i}", "role": "Back"} for i in range(5)] +
        [{"user_id": "fb", "role": "Fullback"}]
    )
    res15 = allocate_event_participants(config, p15)
    assert res15.completed_teams_count == 1
    assert res15.teams[0].current_players == 15

    p30 = p15 + (
        [{"user_id": f"fwd2_{i}", "role": "Forward"} for i in range(8)] +
        [{"user_id": "sh2", "role": "Scrum-Half"}] +
        [{"user_id": f"bk2_{i}", "role": "Back"} for i in range(5)] +
        [{"user_id": "fb2", "role": "Fullback"}]
    )
    res30 = allocate_event_participants(config, p30)
    assert res30.completed_teams_count == 2


def test_kabaddi_7_and_14_players():
    # Valid Kabaddi config with 7 players: Raider(2), Defender(2), All-Rounder(1), Corner(2) = 7
    config = {
        "sport_id": "S026",
        "sport": "Kabaddi",
        "role_1": "Raider",
        "role_1_count": 2,
        "role_2": "Defender",
        "role_2_count": 2,
        "role_3": "All-Rounder",
        "role_3_count": 1,
        "role_4": "Corner",
        "role_4_count": 2,
        "total_players": 7,
    }
    p7 = (
        [{"user_id": f"rd_{i}", "role": "Raider"} for i in range(2)] +
        [{"user_id": f"def_{i}", "role": "Defender"} for i in range(2)] +
        [{"user_id": "ar", "role": "All-Rounder"}] +
        [{"user_id": f"cr_{i}", "role": "Corner"} for i in range(2)]
    )
    res7 = allocate_event_participants(config, p7)
    assert res7.completed_teams_count == 1
    assert res7.teams[0].current_players == 7
    assert res7.teams[0].status == "READY"

    p14 = p7 + (
        [{"user_id": f"rd2_{i}", "role": "Raider"} for i in range(2)] +
        [{"user_id": f"def2_{i}", "role": "Defender"} for i in range(2)] +
        [{"user_id": "ar2", "role": "All-Rounder"}] +
        [{"user_id": f"cr2_{i}", "role": "Corner"} for i in range(2)]
    )
    res14 = allocate_event_participants(config, p14)
    assert res14.completed_teams_count == 2


def test_futsal_5_and_10_players():
    config = get_sport_role_by_id("Futsal")
    # Goalkeeper: 1, Defender: 1, Winger: 2, Pivot: 1 = 5
    p5 = (
        [{"user_id": "gk", "role": "Goalkeeper"},
         {"user_id": "def", "role": "Defender"},
         {"user_id": "w1", "role": "Winger"},
         {"user_id": "w2", "role": "Winger"},
         {"user_id": "piv", "role": "Pivot"}]
    )
    res5 = allocate_event_participants(config, p5)
    assert res5.completed_teams_count == 1
    assert res5.teams[0].current_players == 5

    p10 = p5 + [
        {"user_id": "gk2", "role": "Goalkeeper"},
        {"user_id": "def2", "role": "Defender"},
        {"user_id": "w3", "role": "Winger"},
        {"user_id": "w4", "role": "Winger"},
        {"user_id": "piv2", "role": "Pivot"},
    ]
    res10 = allocate_event_participants(config, p10)
    assert res10.completed_teams_count == 2


def test_role_specific_overflow_across_teams():
    """
    Test: 5 Goalkeepers register for Football.
    Each team requires 1 Goalkeeper.
    Expected: Team 1 (GK 1/1), Team 2 (GK 1/1), Team 3 (GK 1/1), Team 4 (GK 1/1), Team 5 (GK 1/1).
    """
    config = get_sport_role_by_id("Football")
    participants = [{"user_id": f"gk_{i}", "role": "Goalkeeper"} for i in range(5)]
    result = allocate_event_participants(config, participants, event_capacity=60)
    assert len(result.teams) == 5
    for idx, team in enumerate(result.teams):
        gk_slot = next(r for r in team.roles if r.role_name == "Goalkeeper")
        assert gk_slot.filled_count == 1
        assert gk_slot.remaining_space == 0
        assert gk_slot.status == "FULL"
        assert team.current_players == 1


def test_remaining_space_for_role_calculation():
    """
    Test: Football with 1 Goalkeeper, 2 Defenders registered.
    Remaining space in Team 1: Defender (2), Midfielder (3), Forward (3).
    """
    config = get_sport_role_by_id("Football")
    participants = [
        {"user_id": "gk1", "role": "Goalkeeper"},
        {"user_id": "def1", "role": "Defender"},
        {"user_id": "def2", "role": "Defender"},
    ]
    result = allocate_event_participants(config, participants, event_capacity=32)
    assert result.role_remaining_space["Defender"] == 2
    assert result.role_remaining_space["Midfielder"] == 3
    assert result.role_remaining_space["Forward"] == 3
    assert result.role_remaining_space["Goalkeeper"] == 0


def test_invalid_role_configuration_detection():
    """Test invalid role configuration flag when role counts sum != total_players."""
    invalid_config = {
        "sport_id": "S999",
        "sport": "Custom Sport",
        "role_1": "Striker",
        "role_1_count": 5,
        "role_2": "Keeper",
        "role_2_count": 5,
        "total_players": 12,  # 5 + 5 != 12
    }
    is_valid, error, calc, stored = validate_sport_config(invalid_config)
    assert is_valid is False
    assert "INVALID_ROLE_CONFIGURATION" in error

    result = allocate_event_participants(invalid_config, [{"user_id": "u1", "role": "Striker"}])
    assert result.config_status == "INVALID_ROLE_CONFIGURATION"
    assert len(result.waiting_players) == 1
    assert result.teams == []
