import pytest
import uuid
from app.services.auth_service import register_user
from app.services.pulse_service import add_pulse_points, get_or_create_pulse_score
from app.models.pulse import PulseHistory
from app.schemas.user import UserCreate
from sqlalchemy.future import select

def get_test_user_in(username="pulsetester", email="pulse_tester@sportix.com") -> UserCreate:
    return UserCreate(
        email=email,
        username=username,
        full_name="Pulse Tester",
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
async def test_pulse_calculation(db_session):
    # 1. Setup user
    user = await register_user(db_session, get_test_user_in())
    await db_session.commit()
    
    # 2. Get initial pulse
    pulse_score = await get_or_create_pulse_score(db_session, user.id)
    initial_total = pulse_score.total_pulse
    initial_consistency = pulse_score.consistency
    initial_activity = pulse_score.activity
    
    # 3. Add points
    result = await add_pulse_points(
        db_session,
        user.id,
        10.0,
        "login",
        "Test login award"
    )
    await db_session.commit()
    
    # Refetch pulse score
    await db_session.refresh(pulse_score)
    
    # Check total pulse increase
    assert pulse_score.total_pulse == initial_total + 10.0
    
    # "login" maps to consistency and activity, each getting delta * 0.5 = 5.0
    assert pulse_score.consistency == initial_consistency + 5.0
    assert pulse_score.activity == initial_activity + 5.0
    
    # Check PulseHistory table
    hist_result = await db_session.execute(
        select(PulseHistory).where(PulseHistory.user_id == user.id)
    )
    histories = hist_result.scalars().all()
    assert len(histories) == 1
    assert histories[0].delta == 10.0
    assert histories[0].source == "login"
    assert histories[0].reason == "Test login award"
