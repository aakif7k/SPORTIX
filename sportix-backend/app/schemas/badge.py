from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

class BadgeResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str
    badge_type: str
    tier: str
    level_required: Optional[int] = None
    icon_key: str
    glow_color: str
    is_animated: bool

    class Config:
        from_attributes = True

class UserBadgeResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    badge_id: uuid.UUID
    unlocked_at: datetime
    is_featured: bool
    badge: Optional[BadgeResponse] = None

    class Config:
        from_attributes = True
