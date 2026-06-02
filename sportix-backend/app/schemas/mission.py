from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date as date_type
import uuid

class DailyMissionResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    mission_type: str
    target_count: int
    pulse_reward: float
    coins_reward: int
    xp_reward: int
    badge_reward: Optional[str] = None
    difficulty: str

    class Config:
        from_attributes = True

class UserMissionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    mission_id: uuid.UUID
    date: date_type
    current_count: int
    target_count: int
    is_completed: bool
    is_claimed: bool
    completed_at: Optional[datetime] = None
    claimed_at: Optional[datetime] = None
    mission: Optional[DailyMissionResponse] = None

    class Config:
        from_attributes = True

class ClaimResponse(BaseModel):
    success: bool
    coins_earned: int
    pulse_earned: float
    xp_earned: int
    level_up_info: Optional[dict] = None
