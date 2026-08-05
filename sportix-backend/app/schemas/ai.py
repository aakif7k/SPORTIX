from pydantic import BaseModel, field_validator
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
    sport: str
    event_id: Optional[str] = None
    entry_type: EntryType = EntryType.solo
    skill_level: SkillLevel = SkillLevel.amateur
    partner_id: Optional[str] = None


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


class SquadSuggestRequest(BaseModel):
    """
    A request for the AI proxy to assign roles across real athletes.

    Note the skill levels here are this module's own enum (casual/professional),
    which predates the events schema's (beginner/semi_pro/pro). They are not the
    same vocabulary, and this reuses the one the AutoSquad request already speaks so
    a caller does not have to know which endpoint wants which.
    """
    sport: str
    skill_level: SkillLevel = SkillLevel.amateur
    size: int = 5
    event_id: Optional[str] = None

    @field_validator("sport")
    @classmethod
    def sport_required(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("A sport is required")
        return v.strip()

    @field_validator("size")
    @classmethod
    def sane_size(cls, v: int) -> int:
        # A squad of 30 would blow the prompt budget, and nobody plays 30-a-side.
        if not 1 <= v <= 12:
            raise ValueError("Squad size must be between 1 and 12")
        return v
