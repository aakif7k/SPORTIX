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


class MatchResultUpdate(BaseModel):
    """
    Body, not query parameters.

    `result: str` on the handler made FastAPI bind it from the query string, so
    the endpoint was PATCH /matches/{id}/result?result=win&score_home=3 . Same
    defect class as the two auth endpoints the audit listed; this one it missed.
    """
    result: MatchResult
    score_home: Optional[int] = None
    score_away: Optional[int] = None


class StatValidate(BaseModel):
    vote: ValidationVote
    reason: Optional[str] = None


class SquadRetentionVote(BaseModel):
    """A voter's verdict on one specific teammate."""
    target_id: str
    vote: RetentionVote


class MatchCreate(BaseModel):
    """
    Creating a match.

    These four were query parameters, so a client posting them as JSON -- which
    is what every caller does -- created a match with no sport and no squad. The
    squad link is what a squad's match history is queried on, so the history was
    permanently empty.
    """
    sport: str
    event_id: Optional[str] = None
    home_squad_id: Optional[str] = None
    away_squad_id: Optional[str] = None
    opponent_name: Optional[str] = None

    @field_validator("sport")
    @classmethod
    def sport_required(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("A match needs a sport")
        return v.strip()
