from pydantic import BaseModel
from typing import Optional
from enum import Enum


class EntryType(str, Enum):
    solo = "solo"
    duo = "duo"
    squad = "squad"


class SkillLevel(str, Enum):
    casual = "casual"
    amateur = "amateur"
    semi_pro = "semi_pro"
    professional = "professional"


class AutoSquadRequest(BaseModel):
    event_id: Optional[str] = None
    sport: Optional[str] = None
    role: Optional[str] = None
    entry_type: EntryType = EntryType.solo
    skill_level: Optional[SkillLevel] = SkillLevel.amateur
    partner_id: Optional[str] = None
    radius_km: Optional[float] = 10.0
    location: Optional[str] = None


class PulseAward(BaseModel):
    user_id: str
    source: str
    amount: float
    reason: Optional[str] = None
    reference_id: Optional[str] = None


class PulseResponse(BaseModel):
    total_pulse: float = 100.0
    match_performance: float = 0.0
    consistency: float = 0.0
    team_chemistry: float = 0.0
    reliability: float = 0.0
    activity: float = 0.0
    leadership: float = 0.0
    level: int = 1
    level_progress_percent: float = 0.0
    prestige_rank: Optional[str] = None


class NotificationCreate(BaseModel):
    user_id: str
    type: str
    title: str
    body: str
    reference_id: Optional[str] = None
    reference_type: Optional[str] = None
