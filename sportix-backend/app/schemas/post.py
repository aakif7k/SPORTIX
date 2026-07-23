from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class PostType(str, Enum):
    general = "general"
    highlight = "highlight"
    achievement = "achievement"
    training = "training"


class MediaType(str, Enum):
    none = "none"
    image = "image"
    video = "video"
    multi_image = "multi_image"


class PostCreate(BaseModel):
    content: str
    media_urls: List[str] = []
    media_type: MediaType = MediaType.none
    post_type: PostType = PostType.general
    sport_tag: Optional[str] = None
    location_tag: Optional[str] = None
    is_scheduled: bool = False
    scheduled_at: Optional[str] = None


class PostUpdate(BaseModel):
    content: Optional[str] = None
    sport_tag: Optional[str] = None
    location_tag: Optional[str] = None


class CommentCreate(BaseModel):
    content: str


class ReelCreate(BaseModel):
    title: str
    video_url: str
    thumbnail_url: Optional[str] = None
    caption: Optional[str] = None
    sport_tag: Optional[str] = None
    duration_seconds: int = 0


class StoryCreate(BaseModel):
    media_url: str
    media_type: str = "image"
    caption: Optional[str] = None
    sport_tag: Optional[str] = None
