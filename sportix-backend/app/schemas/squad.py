from pydantic import BaseModel
from typing import Optional
from enum import Enum


class MemberRole(str, Enum):
    captain = "captain"
    vice_captain = "vice_captain"
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
