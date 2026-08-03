from pydantic import BaseModel
from typing import Optional, Literal
from enum import Enum


class MemberRole(str, Enum):
    captain = "captain"
    vice = "vice"
    strategist = "strategist"
    analyst = "analyst"
    recruiter = "recruiter"
    member = "member"


class SquadCreate(BaseModel):
    name: str
    sport: str
    formation: str = "4-3-3"
    tactical_notes: Optional[str] = None
    max_members: int = 15


class SquadUpdate(BaseModel):
    name: Optional[str] = None
    formation: Optional[str] = None
    tactical_notes: Optional[str] = None
    max_members: Optional[int] = None


class MemberAdd(BaseModel):
    user_id: str
    role: MemberRole = MemberRole.member
    position: Optional[str] = None


class RoleUpdate(BaseModel):
    """Body, not a query parameter."""
    role: MemberRole


class TacticsUpdate(BaseModel):
    """Body, not query parameters."""
    formation: str
    tactical_notes: Optional[str] = None


class LeadershipVote(BaseModel):
    """
    Body, not query parameters.

    A promotion vote arriving as a query string is forgeable with a link, which
    matters more here than elsewhere: enough of them hand over the captaincy.
    """
    candidate_id: str
    vote: Literal["approve", "reject"] = "approve"


# ─── Squad activity ───────────────────────────────────────────────────────────
class SquadEventType(str, Enum):
    """Must match the `type` enum on squad_events."""
    practice = "practice"
    match = "match"
    social = "social"


class AttendanceVote(str, Enum):
    """Must match the `vote` enum on squad_event_votes."""
    yes = "yes"
    maybe = "maybe"
    no = "no"


class SquadEventCreate(BaseModel):
    title: str
    starts_at: str
    type: SquadEventType = SquadEventType.practice
    venue: Optional[str] = None
    notes: Optional[str] = None


class SquadEventVote(BaseModel):
    vote: AttendanceVote


class SquadPostCreate(BaseModel):
    content: str
    media_url: Optional[str] = None
