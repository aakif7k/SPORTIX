from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid
from app.schemas.user import UserResponse

class SquadBase(BaseModel):
    name: str
    sport: str
    formation: str = "4-3-3"
    tactical_notes: Optional[str] = None

class SquadCreate(SquadBase):
    pass

class SquadMemberResponse(BaseModel):
    id: uuid.UUID
    squad_id: uuid.UUID
    user_id: uuid.UUID
    role: str
    position: Optional[str] = None
    joined_at: datetime
    is_active: bool
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class SquadResponse(SquadBase):
    id: uuid.UUID
    captain_id: Optional[uuid.UUID] = None
    vice_captain_id: Optional[uuid.UUID] = None
    chemistry_score: float
    trust_index: float
    communication_score: float
    coordination_score: float
    win_count: int
    draw_count: int
    loss_count: int
    is_ai_generated: bool
    created_at: datetime
    updated_at: datetime
    captain: Optional[UserResponse] = None
    vice_captain: Optional[UserResponse] = None
    members: List[SquadMemberResponse] = []

    class Config:
        from_attributes = True
