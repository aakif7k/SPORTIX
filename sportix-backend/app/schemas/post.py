from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class PostType(str, Enum):
    """
    Must match the `post_type` enum on the posts collection.

    highlight/achievement were singular here and plural in the column, so a post
    of either type was rejected at write time. `events` was unreachable entirely.
    """
    general = "general"
    training = "training"
    highlights = "highlights"
    achievements = "achievements"
    events = "events"


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
    # No `title`: the reels collection stores a caption, and the required title
    # was discarded by the service, so the API rejected valid requests for a
    # field it had no column for.
    video_url: str
    thumbnail_url: Optional[str] = None
    caption: Optional[str] = None
    sport_tag: Optional[str] = None
    duration_seconds: int = 0


class StoryMediaType(str, Enum):
    """Must match the `media_type` enum on the stories collection."""
    image = "image"
    video = "video"


class StoryCreate(BaseModel):
    media_url: str
    # An enum, not a free string: the column accepts only image or video, so an
    # unvalidated string reached Appwrite and 400d there instead of being
    # rejected here with a useful message.
    media_type: StoryMediaType = StoryMediaType.image
    caption: Optional[str] = None
    sport_tag: Optional[str] = None
