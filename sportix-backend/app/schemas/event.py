"""
Event request bodies.

These were out of sync with the database on every interesting field, so creating
an event through the documented API could not succeed:

  event_type   required, but no such column exists. It duplicated `format`, and
               the service stopped writing it once the two were reconciled.
  format       accepted solo|duo|squad|team|open, while the column accepts
               solo|team|tournament|league. Three of the five values were
               un-storable and two storable ones were unreachable.
  skill_level  a free string defaulting to "casual", which is not one of the
               column's five levels.
  rules        Optional[str] against a string[] column.
  entry_fee    float against string(80).
  prize_pool   float against string(80).

The enums below mirror the vocabulary in scripts/schema.py, and
scripts/check_schema_alignment.py asserts they stay that way.
"""
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, field_validator


class EventFormat(str, Enum):
    """Must match the `format` enum on the events collection."""
    solo = "solo"
    team = "team"
    tournament = "tournament"
    league = "league"


class SkillLevel(str, Enum):
    """Must match the `skill_level` enum on the events collection."""
    beginner = "beginner"
    amateur = "amateur"
    semi_pro = "semi_pro"
    pro = "pro"
    elite = "elite"


class EventStatus(str, Enum):
    upcoming = "upcoming"
    live = "live"
    completed = "completed"
    cancelled = "cancelled"


class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    sport: str
    format: EventFormat = EventFormat.team
    skill_level: SkillLevel = SkillLevel.amateur
    venue: Optional[str] = None
    city: str
    event_date: str
    end_date: Optional[str] = None
    registration_deadline: Optional[str] = None
    max_participants: int = 100
    min_participants: Optional[int] = 2
    # Strings, not floats: these carry a currency or a label ("Free", "£20"),
    # which is why the column is text.
    entry_fee: Optional[str] = None
    prize_pool: Optional[str] = None
    rules: List[str] = []
    is_ai_managed: bool = False

    @field_validator("max_participants")
    @classmethod
    def capacity_sane(cls, v: int) -> int:
        if v < 2:
            raise ValueError("An event needs room for at least 2 participants")
        return v


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    venue: Optional[str] = None
    city: Optional[str] = None
    event_date: Optional[str] = None
    end_date: Optional[str] = None
    registration_deadline: Optional[str] = None
    max_participants: Optional[int] = None
    min_participants: Optional[int] = None
    entry_fee: Optional[str] = None
    prize_pool: Optional[str] = None
    rules: Optional[List[str]] = None
    status: Optional[EventStatus] = None


class EntryType(str, Enum):
    """Must match the `entry_type` enum on event_participants."""
    solo = "solo"
    squad = "squad"
    crew = "crew"


class EventJoin(BaseModel):
    """
    Joining an event.

    squad_id and entry_type were query parameters while every caller sent them in
    the body, so joining an event as a squad silently registered the caller as a
    solo entrant and the squad link was dropped.
    """
    squad_id: Optional[str] = None
    entry_type: EntryType = EntryType.solo


class ParticipantStatus(str, Enum):
    """Must match the `status` enum on event_participants."""
    registered = "registered"
    confirmed = "confirmed"
    withdrawn = "withdrawn"


class ParticipantStatusUpdate(BaseModel):
    status: ParticipantStatus


class EventAnnouncement(BaseModel):
    message: str

    @field_validator("message")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("An announcement needs a message")
        if len(v) > 500:
            raise ValueError("An announcement can be at most 500 characters")
        return v.strip()
