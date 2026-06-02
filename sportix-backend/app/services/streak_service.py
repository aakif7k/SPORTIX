import uuid
from datetime import datetime, date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.streak import UserStreak
from app.models.user import User
from app.services.coins_service import add_coins
from app.services.badge_service import check_and_award_badge
from app.services.notification_service import create_notification
from app.websockets.manager import ws_manager

async def get_or_create_user_streak(db: AsyncSession, user_id: uuid.UUID) -> UserStreak:
    result = await db.execute(select(UserStreak).where(UserStreak.user_id == user_id))
    user_streak = result.scalar_one_or_none()
    if not user_streak:
        user_streak = UserStreak(
            id=uuid.uuid4(),
            user_id=user_id,
            current_streak=0,
            longest_streak=0,
            last_active_date=None
        )
        db.add(user_streak)
        await db.flush()
    return user_streak

async def update_user_streak(db: AsyncSession, user_id: uuid.UUID) -> dict:
    user_streak = await get_or_create_user_streak(db, user_id)
    user = await db.get(User, user_id)
    
    today = date.today()
    old_streak = user_streak.current_streak
    streak_increased = False
    milestone_reached = None
    reward_coins = 0
    
    if user_streak.last_active_date is None:
        user_streak.current_streak = 1
        user_streak.longest_streak = max(user_streak.longest_streak, 1)
        user_streak.last_active_date = today
        streak_increased = True
    elif user_streak.last_active_date == today:
        # Already checked in today, do nothing
        pass
    elif user_streak.last_active_date == today - timedelta(days=1):
        user_streak.current_streak += 1
        user_streak.longest_streak = max(user_streak.longest_streak, user_streak.current_streak)
        user_streak.last_active_date = today
        streak_increased = True
    else:
        # Streak broken
        user_streak.streak_broken_at = datetime.utcnow()
        user_streak.current_streak = 1
        user_streak.last_active_date = today
        streak_increased = True

    if streak_increased:
        # Sync User Model Streak fields
        if user:
            user.login_streak = user_streak.current_streak
            user.longest_streak = max(user.longest_streak, user_streak.longest_streak)
            
        current = user_streak.current_streak
        
        # Streak milestones (3, 7, 14, 30 days)
        milestones = {
            3: (50, "3-Day Streak Reward!"),
            7: (150, "7-Day Weekly Streak Reward!"),
            14: (400, "14-Day Streak Reward!"),
            30: (1000, "30-Day Monthly Streak Reward!")
        }
        
        if current in milestones:
            reward_coins, reason = milestones[current]
            milestone_reached = current
            await add_coins(db, user_id, reward_coins, "streak_milestone", reason)
            
            # Send Notification for Streak Milestone
            await create_notification(
                db,
                user_id,
                "streak_milestone",
                f"{current}-Day Active Streak!",
                f"Outstanding consistency! You've maintained a {current}-day active streak and earned {reward_coins} Coins.",
                {"streak": current, "coins_reward": reward_coins}
            )
            
        # Check badges
        await check_and_award_badge(db, user_id, "streak", current)
        
        # WS Broadcast
        await ws_manager.send_notification_to_user(
            user_id,
            {
                "event": "streak_updated",
                "data": {
                    "current_streak": user_streak.current_streak,
                    "longest_streak": user_streak.longest_streak,
                    "milestone_reached": milestone_reached,
                    "reward_coins": reward_coins
                }
            }
        )
        
    return {
        "current_streak": user_streak.current_streak,
        "longest_streak": user_streak.longest_streak,
        "streak_increased": streak_increased,
        "milestone_reached": milestone_reached,
        "reward_coins": reward_coins
    }
