"""Squad invitation request bodies."""
from typing import Optional

from pydantic import BaseModel, field_validator


class SquadInviteCreate(BaseModel):
    user_id: str
    position: Optional[str] = None
    message: Optional[str] = None

    @field_validator("user_id")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("A user id is required")
        return v.strip()

    @field_validator("message")
    @classmethod
    def not_too_long(cls, v: Optional[str]) -> Optional[str]:
        # The column is string(300); rejecting here gives a usable message rather
        # than an Appwrite 400.
        if v and len(v) > 300:
            raise ValueError("A message can be at most 300 characters")
        return v


class SquadInviteResponse(BaseModel):
    """Accepting or declining. Explicit rather than two endpoints that differ by
    verb only, so the intent is in the body and cannot be inferred wrongly."""
    accept: bool
