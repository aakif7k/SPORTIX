import uuid
import random
from datetime import datetime, date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.mission import DailyMission, UserMission
from app.models.coins import CoinTransaction
from app.services.coins_service import add_coins
from app.services.pulse_service import add_pulse_points
from app.services.notification_service import create_notification
from app.websockets.manager import ws_manager

DEFAULT_TEMPLATES = [
    # Easy
    {"title": "Daily Entry", "description": "Log in to SPORTiX", "mission_type": "login", "target_count": 1, "pulse_reward": 5.0, "coins_reward": 10, "xp_reward": 10, "difficulty": "easy"},
    {"title": "Social Connection", "description": "Follow another athlete", "mission_type": "follow_athlete", "target_count": 1, "pulse_reward": 5.0, "coins_reward": 15, "xp_reward": 10, "difficulty": "easy"},
    {"title": "Liker", "description": "Like 3 posts in the feed", "mission_type": "react_posts", "target_count": 3, "pulse_reward": 5.0, "coins_reward": 15, "xp_reward": 10, "difficulty": "easy"},
    # Medium
    {"title": "Content Creator", "description": "Share a status update or thought", "mission_type": "create_post", "target_count": 1, "pulse_reward": 10.0, "coins_reward": 25, "xp_reward": 25, "difficulty": "medium"},
    {"title": "Conversationalist", "description": "Comment on 2 feed posts", "mission_type": "comment", "target_count": 2, "pulse_reward": 10.0, "coins_reward": 25, "xp_reward": 25, "difficulty": "medium"},
    {"title": "Chatter", "description": "Send 3 messages to squad members", "mission_type": "message_teammate", "target_count": 3, "pulse_reward": 10.0, "coins_reward": 30, "xp_reward": 25, "difficulty": "medium"},
    {"title": "Event Participant", "description": "Join a local sports event", "mission_type": "join_event", "target_count": 1, "pulse_reward": 12.0, "coins_reward": 30, "xp_reward": 30, "difficulty": "medium"},
    # Hard
    {"title": "Victor", "description": "Win a competitive match", "mission_type": "win_match", "target_count": 1, "pulse_reward": 20.0, "coins_reward": 50, "xp_reward": 50, "difficulty": "hard"},
    {"title": "Showcase", "description": "Post a media highlight on your profile", "mission_type": "upload_highlight", "target_count": 1, "pulse_reward": 20.0, "coins_reward": 50, "xp_reward": 50, "difficulty": "hard"},
    {"title": "Competitor", "description": "Complete 2 full matches", "mission_type": "complete_match", "target_count": 2, "pulse_reward": 20.0, "coins_reward": 45, "xp_reward": 50, "difficulty": "hard"},
]

async def seed_mission_templates_if_empty(db: AsyncSession):
    result = await db.execute(select(DailyMission))
    exists = result.scalars().first()
    if not exists:
        for t in DEFAULT_TEMPLATES:
            mission = DailyMission(
                id=uuid.uuid4(),
                title=t["title"],
                description=t["description"],
                mission_type=t["mission_type"],
                target_count=t["target_count"],
                pulse_reward=t["pulse_reward"],
                coins_reward=t["coins_reward"],
                xp_reward=t["xp_reward"],
                difficulty=t["difficulty"],
                is_active=True
            )
            db.add(mission)
        await db.flush()

async def get_or_generate_daily_missions(db: AsyncSession, user_id: uuid.UUID) -> list[UserMission]:
    await seed_mission_templates_if_empty(db)
    
    today = date.today()
    result = await db.execute(
        select(UserMission)
        .where(UserMission.user_id == user_id, UserMission.date == today)
    )
    user_missions = list(result.scalars().all())
    
    if user_missions:
        return user_missions
        
    # Generate 5 missions: 1 Easy, 2 Medium, 1 Hard, 1 Random
    result = await db.execute(select(DailyMission).where(DailyMission.is_active == True))
    templates = result.scalars().all()
    
    easies = [t for t in templates if t.difficulty == "easy"]
    mediums = [t for t in templates if t.difficulty == "medium"]
    hards = [t for t in templates if t.difficulty == "hard"]
    
    selected_templates = []
    
    if easies:
        selected_templates.append(random.choice(easies))
    if len(mediums) >= 2:
        selected_templates.extend(random.sample(mediums, 2))
    elif mediums:
        selected_templates.append(random.choice(mediums))
        
    if hards:
        selected_templates.append(random.choice(hards))
        
    # The 5th is random from remaining templates
    remaining = [t for t in templates if t not in selected_templates]
    if remaining:
        selected_templates.append(random.choice(remaining))
        
    user_missions = []
    for template in selected_templates:
        um = UserMission(
            id=uuid.uuid4(),
            user_id=user_id,
            mission_id=template.id,
            date=today,
            current_count=0,
            target_count=template.target_count,
            is_completed=False,
            is_claimed=False
        )
        db.add(um)
        user_missions.append(um)
        
    await db.flush()
    return user_missions

async def update_mission_progress(
    db: AsyncSession,
    user_id: uuid.UUID,
    mission_type: str,
    increment: int = 1
):
    today = date.today()
    result = await db.execute(
        select(UserMission)
        .join(DailyMission)
        .where(
            UserMission.user_id == user_id,
            UserMission.date == today,
            DailyMission.mission_type == mission_type,
            UserMission.is_completed == False
        )
    )
    ums = result.scalars().all()
    
    for um in ums:
        um.current_count = min(um.target_count, um.current_count + increment)
        if um.current_count >= um.target_count:
            um.is_completed = True
            um.completed_at = datetime.utcnow()
            
            # Fetch mission details
            mission = await db.get(DailyMission, um.mission_id)
            
            # Send notification
            await create_notification(
                db,
                user_id,
                "mission_complete",
                "Daily Mission Completed!",
                f"You completed '{mission.title}'. Go claim your rewards!",
                {"user_mission_id": str(um.id), "title": mission.title}
            )
            
            # WS Broadcast
            await ws_manager.send_notification_to_user(
                user_id,
                {
                    "event": "mission_completed",
                    "data": {
                        "user_mission_id": str(um.id),
                        "title": mission.title,
                        "description": mission.description
                    }
                }
            )
    await db.flush()

async def claim_mission_reward(
    db: AsyncSession,
    user_id: uuid.UUID,
    user_mission_id: uuid.UUID
) -> dict:
    um = await db.get(UserMission, user_mission_id)
    if not um or um.user_id != user_id:
        return {"success": False, "error": "Mission not found"}
        
    if not um.is_completed:
        return {"success": False, "error": "Mission is not completed yet"}
        
    if um.is_claimed:
        return {"success": False, "error": "Reward already claimed"}
        
    um.is_claimed = True
    um.claimed_at = datetime.utcnow()
    
    mission = await db.get(DailyMission, um.mission_id)
    
    # Award Coins
    await add_coins(
        db,
        user_id,
        mission.coins_reward,
        "daily_mission",
        f"Reward for completing: {mission.title}",
        reference_id=str(um.id)
    )
    
    # Award Pulse Points
    pulse_res = await add_pulse_points(
        db,
        user_id,
        mission.pulse_reward,
        "mission",
        f"Reward for completing: {mission.title}"
    )
    
    return {
        "success": True,
        "coins_earned": mission.coins_reward,
        "pulse_earned": mission.pulse_reward,
        "xp_earned": mission.xp_reward,
        "level_up_info": pulse_res["level_up_info"]
    }

async def get_weekly_mission_progress(db: AsyncSession, user_id: uuid.UUID) -> dict:
    # Get last 7 days of completed user missions
    today = date.today()
    start_date = today - timedelta(days=6)
    
    result = await db.execute(
        select(UserMission)
        .where(
            UserMission.user_id == user_id,
            UserMission.date >= start_date,
            UserMission.is_completed == True
        )
    )
    completed_missions = result.scalars().all()
    count = len(completed_missions)
    
    # Weekly bonus check
    # Check if a weekly bonus transaction exists for this week
    year, week_num, _ = today.isocalendar()
    weekly_ref = f"weekly_bonus_{year}_{week_num}"
    
    result = await db.execute(
        select(CoinTransaction)
        .where(
            CoinTransaction.user_id == user_id,
            CoinTransaction.reference_id == weekly_ref
        )
    )
    bonus_transaction = result.scalar_one_or_none()
    bonus_claimed = bonus_transaction is not None
    
    return {
        "completed_count": count,
        "target_count": 20,
        "bonus_claimed": bonus_claimed,
        "bonus_eligible": count >= 20 and not bonus_claimed
    }

async def claim_weekly_bonus(db: AsyncSession, user_id: uuid.UUID) -> dict:
    progress = await get_weekly_mission_progress(db, user_id)
    if not progress["bonus_eligible"]:
        return {"success": False, "error": "Not eligible for weekly bonus or already claimed"}
        
    today = date.today()
    year, week_num, _ = today.isocalendar()
    weekly_ref = f"weekly_bonus_{year}_{week_num}"
    
    bonus_amount = 500
    await add_coins(
        db,
        user_id,
        bonus_amount,
        "weekly_mission_bonus",
        f"Weekly 20+ Missions Bonus (Week {week_num})",
        reference_id=weekly_ref
    )
    
    # Award Pulse Points
    pulse_res = await add_pulse_points(
        db,
        user_id,
        50.0,
        "mission",
        f"Weekly 20+ Missions Bonus (Week {week_num})"
    )
    
    return {
        "success": True,
        "coins_earned": bonus_amount,
        "pulse_earned": 50.0,
        "level_up_info": pulse_res["level_up_info"]
    }
