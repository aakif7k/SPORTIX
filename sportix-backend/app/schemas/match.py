from pydantic import BaseModel, field_validator
from typing import Optional, Dict, Any
from enum import Enum


class MatchResult(str, Enum):
    win = "win"
    loss = "loss"
    draw = "draw"
    pending = "pending"


class ValidationVote(str, Enum):
    confirm = "confirm"
    partial = "partial"
    dispute = "dispute"


class RetentionVote(str, Enum):
    definitely = "definitely"
    maybe = "maybe"
    no = "no"


class StatsSubmission(BaseModel):
    match_id: str
    sport: str
    stats_data: Dict[str, Any]
    match_rating: float
    is_mvp: bool = False
    media_proof_url: Optional[str] = None

    @field_validator("match_rating")
    @classmethod
    def rating_valid(cls, v: float) -> float:
        if not 1 <= v <= 10:
            raise ValueError("Match rating must be between 1 and 10")
        return v


class StatValidate(BaseModel):
    vote: ValidationVote
    reason: Optional[str] = None


class SquadRetentionVote(BaseModel):
    """A voter's verdict on one specific teammate."""
    target_id: str
    vote: RetentionVote
