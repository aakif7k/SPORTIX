"""Event crew request bodies."""
from typing import Optional

from pydantic import BaseModel, field_validator


def _named(v: str) -> str:
    if not v.strip():
        raise ValueError("A crew needs a name")
    if len(v) > 80:
        raise ValueError("A crew name can be at most 80 characters")
    return v.strip()


class CrewCreate(BaseModel):
    name: str

    _check = field_validator("name")(classmethod(lambda cls, v: _named(v)))


class CrewRename(BaseModel):
    name: str

    _check = field_validator("name")(classmethod(lambda cls, v: _named(v)))


class CrewMemberAdd(BaseModel):
    user_id: str
    position: Optional[str] = None

    @field_validator("user_id")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("A user id is required")
        return v.strip()
