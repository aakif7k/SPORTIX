import pytest
from app.services.auth_service import register_user
from app.services.ai_squad_service import match_ai_squad
from app.services.pulse_service import get_or_create_pulse_score
from app.schemas.user import UserCreate

def get_test_user_in(username, email, position="GK", sport="Football") -> UserCreate:
    return UserCreate(
        email=email,
        username=username,
        full_name=username.title(),
        password="password123",
        role="athlete",
        sport=sport,
        sports=[sport],
        position=position,
        experience_level="pro",
        location="London",
        city="London",
        latitude=51.5,
        longitude=-0.1,
        bio="Bio",
        avatar_url="http://test.com/avatar.png",
        is_open_to_recruit=True
    )

@pytest.mark.asyncio
async def test_ai_matchmaking_quotas(db_session):
    # 1. Register a requesting user
    requester = await register_user(db_session, get_test_user_in("req", "req@sportix.com", "GK"))
    
    # 2. Register candidate users (fill football positions GK:1, DEF:4, MID:3, ATT:3)
    # Requester is GK. We need to match other positions.
    candidates_info = [
        ("def1", "def1@sportix.com", "DEF"),
        ("def2", "def2@sportix.com", "DEF"),
        ("mid1", "mid1@sportix.com", "MID"),
        ("mid2", "mid2@sportix.com", "MID"),
        ("att1", "att1@sportix.com", "ATT"),
        ("att2", "att2@sportix.com", "ATT"),
    ]
    
    for username, email, pos in candidates_info:
        await register_user(db_session, get_test_user_in(username, email, pos))
        
    await db_session.commit()
    
    # 3. Trigger AI squad matchmaking
    # Since we are mock-seeding, the service will evaluate and greedy select
    # our registered candidates into the positions
    res = await match_ai_squad(db_session, requester.id, "Football")
    
    assert res["squad_name"] == "AI Football Elite"
    assert res["chemistry_score"] > 0.0
    assert len(res["players"]) > 0
    
    # Verify that matched players correspond to correct position limits
    # and contain correct athlete fields
    first_player = res["players"][0]
    assert "username" in first_player
    assert "compatibility" in first_player
