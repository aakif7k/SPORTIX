import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notification import Notification
from app.websockets.manager import ws_manager

async def create_notification(
    db: AsyncSession,
    user_id: uuid.UUID,
    notif_type: str,  # event_invite | team_match | connection | like | comment | match_reminder | leadership | chemistry_update | validation_request | level_up | mission_complete | coins_earned | badge_unlocked | streak_milestone
    title: str,
    body: str,
    data: dict = None
) -> Notification:
    notif = Notification(
        id=uuid.uuid4(),
        user_id=user_id,
        type=notif_type,
        title=title,
        body=body,
        data=data,
        is_read=False,
        created_at=datetime.utcnow()
    )
    db.add(notif)
    await db.flush()
    
    # Push immediate WebSocket notification if user is online
    await ws_manager.send_notification_to_user(
        user_id,
        {
            "event": "notification",
            "data": {
                "id": str(notif.id),
                "type": notif_type,
                "title": title,
                "body": body,
                "data": data,
                "is_read": False,
                "created_at": notif.created_at.isoformat()
            }
        }
    )
    return notif
