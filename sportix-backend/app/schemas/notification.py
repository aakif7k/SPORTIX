from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import uuid

class NotificationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    type: str
    title: str
    body: str
    data: Optional[Dict[str, Any]] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
