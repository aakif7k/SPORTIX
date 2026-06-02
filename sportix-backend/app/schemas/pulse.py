from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

class PulseScoreResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    total_pulse: float
    match_performance: float
    consistency: float
    team_chemistry: float
    reliability: float
    activity: float
    leadership: float
    updated_at: datetime

    class Config:
        from_attributes = True

class PulseHistoryResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    source: str
    old_pulse: float
    new_pulse: float
    delta: float
    reason: str
    match_id: Optional[uuid.UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True
