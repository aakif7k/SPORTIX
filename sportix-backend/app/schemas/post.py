from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid
from app.schemas.user import UserResponse

class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    pass

class CommentResponse(CommentBase):
    id: uuid.UUID
    post_id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class PostBase(BaseModel):
    content: str
    media_url: Optional[str] = None
    media_type: Optional[str] = None  # image | video | highlight
    is_highlight: bool = False

class PostCreate(PostBase):
    pass

class PostResponse(PostBase):
    id: uuid.UUID
    user_id: uuid.UUID
    likes_count: int
    comments_count: int
    created_at: datetime
    updated_at: datetime
    user: Optional[UserResponse] = None
    comments: List[CommentResponse] = []
    is_liked: bool = False

    class Config:
        from_attributes = True
