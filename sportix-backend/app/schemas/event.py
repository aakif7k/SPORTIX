from pydantic import BaseModel
from typing import Optional
from enum import Enum


class EventType(str, Enum):
    tournament = "tournament"
    training = "training"
    practice = "practice"
    community = "community"
    friendly = "friendly"
    league = "league"


class EventFormat(str, Enum):
    solo = "solo"
    duo = "duo"
    squad = "squad"
    team = "team"
    open = "open"


class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    sport: str
    event_type: EventType
    format: EventFormat = EventFormat.open
    skill_level: str = "casual"
    venue: Optional[str] = None
    city: str
    event_date: str
    end_date: Optional[str] = None
    registration_deadline: Optional[str] = None
    max_participants: int = 100
    min_participants: int = 2
    entry_fee: float = 0.0
    prize_pool: float = 0.0
    rules: Optional[str] = None
    is_ai_managed: bool = False


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    venue: Optional[str] = None
    city: Optional[str] = None
    event_date: Optional[str] = None
    max_participants: Optional[int] = None
    entry_fee: Optional[float] = None
    prize_pool: Optional[float] = None
    rules: Optional[str] = None
    status: Optional[str] = None
