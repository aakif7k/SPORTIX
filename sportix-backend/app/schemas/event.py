from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid
from app.schemas.user import UserResponse

class EventBase(BaseModel):
    title: str
    description: str
    sport: str
    event_type: str = "community"  # tournament | training | practice | community
    format: str = "open"  # solo | duo | squad | open
    date: datetime
    venue: str
    city: str
    max_participants: int

class EventCreate(EventBase):
    pass

class EventParticipantResponse(BaseModel):
    id: uuid.UUID
    event_id: uuid.UUID
    user_id: uuid.UUID
    entry_type: str
    squad_id: Optional[uuid.UUID] = None
    status: str
    joined_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class EventResponse(EventBase):
    id: uuid.UUID
    organizer_id: uuid.UUID
    current_count: int
    status: str
    is_ai_managed: bool
    created_at: datetime
    organizer: Optional[UserResponse] = None
    participants: List[EventParticipantResponse] = []

    class Config:
        from_attributes = True
