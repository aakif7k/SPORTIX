from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
from app.schemas.user import UserResponse
from app.schemas.squad import SquadResponse

class MatchBase(BaseModel):
    event_id: Optional[uuid.UUID] = None
    squad_id: uuid.UUID
    opponent_squad_id: Optional[uuid.UUID] = None
    result: str = "pending"  # win | loss | draw | pending

class MatchCreate(MatchBase):
    pass

class PlayerStatSubmit(BaseModel):
    sport: str
    stats_data: Dict[str, Any]
    media_proof_url: Optional[str] = None

class StatValidationSubmit(BaseModel):
    vote: str  # confirm | partial | dispute
    reason: Optional[str] = None

class StatValidationResponse(BaseModel):
    id: uuid.UUID
    player_stat_id: uuid.UUID
    validator_id: uuid.UUID
    vote: str
    reason: Optional[str] = None
    created_at: datetime
    validator: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class PlayerStatResponse(BaseModel):
    id: uuid.UUID
    match_id: uuid.UUID
    user_id: uuid.UUID
    sport: str
    stats_data: Dict[str, Any]
    media_proof_url: Optional[str] = None
    validation_status: str
    submitted_at: datetime
    user: Optional[UserResponse] = None
    validations: List[StatValidationResponse] = []

    class Config:
        from_attributes = True

class RetentionVoteSubmit(BaseModel):
    vote: str  # definitely | maybe | no

class RetentionVoteResponse(BaseModel):
    id: uuid.UUID
    match_id: uuid.UUID
    voter_id: uuid.UUID
    squad_id: uuid.UUID
    vote: str
    created_at: datetime
    voter: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class MatchResponse(MatchBase):
    id: uuid.UUID
    chemistry_delta: float
    top_performer_id: Optional[uuid.UUID] = None
    played_at: datetime
    created_at: datetime
    squad: Optional[SquadResponse] = None
    opponent_squad: Optional[SquadResponse] = None
    top_performer: Optional[UserResponse] = None

    class Config:
        from_attributes = True
