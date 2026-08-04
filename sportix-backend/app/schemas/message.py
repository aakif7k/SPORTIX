"""Conversation and message request bodies."""
from enum import Enum
from typing import Optional

from pydantic import BaseModel, field_validator


class MessageMediaType(str, Enum):
    """Must match the `media_type` enum on the messages collection."""
    image = "image"
    video = "video"
    file = "file"


class SquadMessageType(str, Enum):
    """Must match the `type` enum on squad_messages."""
    text = "text"
    announcement = "announcement"
    poll = "poll"
    tactical = "tactical"
    achievement = "achievement"


class ConversationCreate(BaseModel):
    """The person to open a thread with."""
    user_id: str


class MessageCreate(BaseModel):
    content: str = ""
    media_url: Optional[str] = None
    media_type: Optional[MessageMediaType] = None

    @field_validator("content")
    @classmethod
    def not_too_long(cls, v: str) -> str:
        # The column is string(2000); rejecting here gives a usable message
        # instead of an Appwrite 400.
        if len(v) > 2000:
            raise ValueError("A message can be at most 2000 characters")
        return v


class SquadMessageCreate(BaseModel):
    content: str
    type: SquadMessageType = SquadMessageType.text
    attachment_url: Optional[str] = None
    poll_data: Optional[dict] = None
    tactical_data: Optional[dict] = None
    announcement_data: Optional[dict] = None

    @field_validator("content")
    @classmethod
    def not_too_long(cls, v: str) -> str:
        if len(v) > 2000:
            raise ValueError("A message can be at most 2000 characters")
        return v
