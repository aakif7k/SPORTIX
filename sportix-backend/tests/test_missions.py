import pytest
from app.services.auth_service import register_user
from app.services.mission_service import get_or_generate_daily_missions, update_mission_progress, claim_mission_reward
from app.models.mission import UserMission, DailyMission
from app.schemas.user import UserCreate
from sqlalchemy.future import select

def get_test_user_in(username="missiontester", email="mission_tester@sportix.com") -> UserCreate:
    return UserCreate(
        email=email,
        username=username,
        full_name="Mission Tester",
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
async def test_missions_flow(db_session):
    # 1. Register user
    user = await register_user(db_session, get_test_user_in())
    await db_session.commit()
    
    # 2. Generate daily missions (picks 5 templates)
    missions = await get_or_generate_daily_missions(db_session, user.id)
    await db_session.commit()
    assert len(missions) == 5
    
    # Find a create_post or login mission type from the generated list
    target_um = None
    for um in missions:
        # Load mission details
        mission_detail = await db_session.get(DailyMission, um.mission_id)
        if mission_detail.mission_type == "create_post":
            target_um = um
            break
            
    if not target_um:
        target_um = missions[0]
        # Force it to be a post mission for testing
        m_detail = await db_session.get(DailyMission, target_um.mission_id)
        m_detail.mission_type = "create_post"
        m_detail.target_count = 1
        target_um.target_count = 1
        await db_session.commit()
        
    assert target_um.is_completed is False
    
    # 3. Simulate post creation trigger (increments progress)
    await update_mission_progress(db_session, user.id, "create_post")
    await db_session.commit()
    
    # Refetch
    await db_session.refresh(target_um)
    assert target_um.is_completed is True
    
    # 4. Claim reward
    claim_res = await claim_mission_reward(db_session, user.id, target_um.id)
    await db_session.commit()
    
    assert claim_res["success"] is True
    assert claim_res["coins_earned"] > 0
    assert claim_res["pulse_earned"] > 0
    
    await db_session.refresh(target_um)
    assert target_um.is_claimed is True
