import pytest
from app.services.auth_service import register_user
from app.services.level_service import get_or_create_user_level, add_xp_or_pulse_to_level, get_threshold_for_level
from app.services.coins_service import get_or_create_user_coins
from app.models.level import LevelHistory
from app.schemas.user import UserCreate
from sqlalchemy.future import select

def get_test_user_in(username="leveltester", email="level_tester@sportix.com") -> UserCreate:
    return UserCreate(
        email=email,
        username=username,
        full_name="Level Tester",
        password="password123",
        role="athlete",
        sport="Football",
        sports=["Football"],
        position="MID",
        experience_level="beginner",
        location="London",
        city="London",
        latitude=51.5,
        longitude=-0.1,
        bio="Tester",
        avatar_url="http://test.com/avatar.png",
        is_open_to_recruit=False
    )

@pytest.mark.asyncio
async def test_level_up_mechanics(db_session):
    # 1. Register user
    user = await register_user(db_session, get_test_user_in())
    await db_session.commit()
    
    user_level = await get_or_create_user_level(db_session, user.id)
    assert user_level.current_level == 1
    assert user_level.current_pulse == 100.0  # Starting value
    assert user_level.pulse_for_next == 150.0  # Level 1 threshold
    
    # 2. Add pulse to level up (need 50 pulse to reach 150)
    result = await add_xp_or_pulse_to_level(db_session, user.id, 60.0)
    await db_session.commit()
    
    await db_session.refresh(user_level)
    assert user_level.current_level == 2
    assert user_level.current_pulse == 10.0  # 100 + 60 - 150 = 10 carry over
    assert user_level.pulse_for_next == 200.0  # Level 2 threshold
    assert result["leveled_up"] is True
    
    # Check that coins were added (Level 2 * 50 = 100 coins reward)
    coins_profile = await get_or_create_user_coins(db_session, user.id)
    # Registration gave 150 coins, Level Up to 2 gave 100 coins
    assert coins_profile.balance == 250

@pytest.mark.asyncio
async def test_prestige_transition(db_session):
    # 1. Register user
    user = await register_user(db_session, get_test_user_in("prestigetester", "prestige@sportix.com"))
    await db_session.commit()
    
    user_level = await get_or_create_user_level(db_session, user.id)
    
    # Hardcode levels to 100 to trigger prestige on next level up
    user_level.current_level = 100
    user_level.current_pulse = 0.0
    user_level.pulse_for_next = get_threshold_for_level(100)
    await db_session.commit()
    
    # Add pulse exceeding threshold
    await add_xp_or_pulse_to_level(db_session, user.id, user_level.pulse_for_next + 10.0)
    await db_session.commit()
    
    await db_session.refresh(user_level)
    # Exceeded 100, level resets to 1, prestige increases to grandmaster_x
    assert user_level.current_level == 1
    assert user_level.prestige_rank == "grandmaster_x"
    assert user_level.current_pulse == 10.0
