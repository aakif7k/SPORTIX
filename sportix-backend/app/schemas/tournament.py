from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

class TournamentBase(BaseModel):
    name: str
    sport: str
    description: str
    rules: Optional[str] = None
    max_teams: int
    prize_pool: Optional[str] = None
    start_date: datetime
    end_date: datetime

class TournamentCreate(TournamentBase):
    pass

class TournamentResponse(TournamentBase):
    id: uuid.UUID
    status: str  # registration | ongoing | completed | cancelled
    winner_squad_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
