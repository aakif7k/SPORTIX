from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import uuid
from app.schemas.user import UserResponse

class MessageBase(BaseModel):
    squad_id: Optional[uuid.UUID] = None
    receiver_id: Optional[uuid.UUID] = None
    content: str
    message_type: str = "text"  # text | announcement | poll | tactical | achievement
    attachment_url: Optional[str] = None
    poll_data: Optional[Dict[str, Any]] = None

class MessageCreate(MessageBase):
    pass

class MessageResponse(MessageBase):
    id: uuid.UUID
    sender_id: uuid.UUID
    is_read: bool
    created_at: datetime
    sender: Optional[UserResponse] = None

    class Config:
        from_attributes = True
