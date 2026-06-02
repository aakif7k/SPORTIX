from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

class UserLevelResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    current_level: int
    current_pulse: float
    pulse_for_next: float
    prestige_rank: str
    total_pulse_ever: float
    level_ups_count: int
    updated_at: datetime

    class Config:
        from_attributes = True

class LevelHistoryResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    old_level: int
    new_level: int
    pulse_at_levelup: float
    rank_unlocked: Optional[str] = None
    prestige_unlocked: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
