import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.badge import Badge, UserBadge
from app.services.notification_service import create_notification
from app.websockets.manager import ws_manager

async def check_and_award_badge(
    db: AsyncSession,
    user_id: uuid.UUID,
    condition_type: str,  # level_up | streak | wins | squad_joins | missions | prestige
    value: int
) -> list:
    # Find all badges matching condition_type where condition_value <= value
    result = await db.execute(
        select(Badge).where(
            Badge.condition_type == condition_type,
            Badge.condition_value <= value
        )
    )
    eligible_badges = result.scalars().all()
    
    # Check which ones the user already unlocked
    result = await db.execute(
        select(UserBadge.badge_id).where(UserBadge.user_id == user_id)
    )
    unlocked_badge_ids = set(result.scalars().all())
    
    newly_awarded = []
    for badge in eligible_badges:
        if badge.id not in unlocked_badge_ids:
            user_badge = UserBadge(
                id=uuid.uuid4(),
                user_id=user_id,
                badge_id=badge.id,
                unlocked_at=datetime.utcnow(),
                is_featured=False
            )
            db.add(user_badge)
            newly_awarded.append(badge)
            
            # Send Database Notification
            await create_notification(
                db,
                user_id,
                "badge_unlocked",
                "New Badge Unlocked!",
                f"You unlocked the '{badge.name}' badge.",
                {"badge_id": str(badge.id), "icon_key": badge.icon_key, "glow_color": badge.glow_color}
            )
            
            # Push live WebSockets alert
            await ws_manager.send_notification_to_user(
                user_id,
                {
                    "event": "badge_unlocked",
                    "data": {
                        "badge_id": str(badge.id),
                        "name": badge.name,
                        "description": badge.description,
                        "icon_key": badge.icon_key,
                        "glow_color": badge.glow_color,
                        "is_animated": badge.is_animated
                    }
                }
            )
    return newly_awarded
