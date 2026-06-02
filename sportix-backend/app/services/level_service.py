import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.level import UserLevel, LevelHistory
from app.services.coins_service import add_coins
from app.services.badge_service import check_and_award_badge
from app.services.notification_service import create_notification
from app.websockets.manager import ws_manager

PRESTIGE_RANKS = [
    "none",
    "grandmaster_x",
    "hypernova",
    "phantom_overdrive",
    "immortal_zenith",
    "supreme_goat"
]

def get_threshold_for_level(level: int) -> float:
    if level < 10:
        return float(100 + level * 50)
    else:
        # threshold(n) = round(150 * 1.18^(n-1))
        return float(round(150 * (1.18 ** (level - 1))))

async def get_or_create_user_level(db: AsyncSession, user_id: uuid.UUID) -> UserLevel:
    result = await db.execute(select(UserLevel).where(UserLevel.user_id == user_id))
    user_level = result.scalar_one_or_none()
    if not user_level:
        user_level = UserLevel(
            id=uuid.uuid4(),
            user_id=user_id,
            current_level=1,
            current_pulse=100.0,
            pulse_for_next=get_threshold_for_level(1),
            prestige_rank="none",
            total_pulse_ever=100.0,
            level_ups_count=0
        )
        db.add(user_level)
        await db.flush()
    return user_level

async def add_xp_or_pulse_to_level(db: AsyncSession, user_id: uuid.UUID, pulse_amount: float) -> dict:
    user_level = await get_or_create_user_level(db, user_id)
    
    user_level.current_pulse += pulse_amount
    user_level.total_pulse_ever += pulse_amount
    
    leveled_up = False
    old_level = user_level.current_level
    old_prestige = user_level.prestige_rank
    
    # Process potential multiple level ups
    while user_level.current_pulse >= user_level.pulse_for_next:
        leveled_up = True
        threshold = user_level.pulse_for_next
        user_level.current_pulse -= threshold
        user_level.current_level += 1
        user_level.level_ups_count += 1
        
        # Check prestige transition
        prestige_unlocked = None
        if user_level.current_level > 100:
            current_prestige_idx = PRESTIGE_RANKS.index(user_level.prestige_rank)
            if current_prestige_idx < len(PRESTIGE_RANKS) - 1:
                user_level.prestige_rank = PRESTIGE_RANKS[current_prestige_idx + 1]
                prestige_unlocked = user_level.prestige_rank
            
            user_level.current_level = 1  # Reset level upon prestiging
            
        # Get next threshold
        user_level.pulse_for_next = get_threshold_for_level(user_level.current_level)
        
        # Award Level Up Rewards
        coin_reward = user_level.current_level * 50 if user_level.prestige_rank == "none" else 500
        if prestige_unlocked:
            coin_reward = 5000  # Massive coins for prestiging
            
        await add_coins(
            db, 
            user_id, 
            coin_reward, 
            "level_up_reward", 
            f"Earned from Level Up to {user_level.current_level}" if not prestige_unlocked else f"Earned from Prestiging to {prestige_unlocked}"
        )
        
        # Check badges for level_up
        await check_and_award_badge(db, user_id, "level_up", user_level.current_level)
        
        # If prestige unlocked, award prestige badge
        if prestige_unlocked:
            await check_and_award_badge(db, user_id, "prestige", PRESTIGE_RANKS.index(prestige_unlocked))
            
        # Record level history
        history = LevelHistory(
            id=uuid.uuid4(),
            user_id=user_id,
            old_level=old_level,
            new_level=user_level.current_level,
            pulse_at_levelup=threshold,
            rank_unlocked=f"Level {user_level.current_level}",
            prestige_unlocked=prestige_unlocked if prestige_unlocked else None,
            created_at=datetime.utcnow()
        )
        db.add(history)
        
        # Send Notification
        title = "Level Up!"
        body = f"Congratulations! You leveled up to Level {user_level.current_level}!"
        if prestige_unlocked:
            title = "Prestige Rank Achieved!"
            body = f"Incredible! You have ascended to Prestige Rank: {prestige_unlocked.replace('_', ' ').title()}!"
            
        await create_notification(
            db,
            user_id,
            "level_up",
            title,
            body,
            {
                "new_level": user_level.current_level,
                "prestige_rank": user_level.prestige_rank,
                "coin_reward": coin_reward
            }
        )
        
        # WS Broadcast
        await ws_manager.send_notification_to_user(
            user_id,
            {
                "event": "level_up",
                "data": {
                    "current_level": user_level.current_level,
                    "current_pulse": user_level.current_pulse,
                    "pulse_for_next": user_level.pulse_for_next,
                    "prestige_rank": user_level.prestige_rank,
                    "coin_reward": coin_reward,
                    "prestige_unlocked": prestige_unlocked
                }
            }
        )
        
    return {
        "leveled_up": leveled_up,
        "old_level": old_level,
        "new_level": user_level.current_level,
        "current_pulse": user_level.current_pulse,
        "pulse_for_next": user_level.pulse_for_next,
        "prestige_rank": user_level.prestige_rank
    }
