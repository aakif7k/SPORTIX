from pydantic import BaseModel, field_validator
from typing import Optional, List
from enum import Enum


class UserRole(str, Enum):
    athlete = "athlete"
    recruiter = "recruiter"
    coach = "coach"
    organizer = "organizer"
    admin = "admin"


class ExperienceLevel(str, Enum):
    beginner = "beginner"
    amateur = "amateur"
    semi_pro = "semi_pro"
    pro = "pro"
    elite = "elite"


class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    username: str
    role: UserRole = UserRole.athlete
    sport: str = ""
    sports: List[str] = []
    experience_level: ExperienceLevel = ExperienceLevel.beginner
    location: str = ""
    city: str = ""

    @field_validator("username")
    @classmethod
    def username_valid(cls, v: str) -> str:
        v = v.lower().strip()
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters")
        if not v.replace("_", "").isalnum():
            raise ValueError("Username: letters, numbers and _ only")
        return v

    @field_validator("password")
    @classmethod
    def password_strong(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password minimum 8 characters")
        return v


class UserLogin(BaseModel):
    email: str
    password: str


class ForgotPasswordRequest(BaseModel):
    """
    Body, not a query parameter.

    The endpoint previously declared `email: str`, which FastAPI binds as a query
    parameter -- putting the address in the URL, the access log and any proxy log
    along the way.
    """
    email: str


class ChangePasswordRequest(BaseModel):
    """
    Body, not query parameters.

    Both passwords were previously bare scalars on the handler, so FastAPI bound
    them as query parameters: PUT /api/auth/change-password?old_password=...
    &new_password=... . That writes plaintext credentials into server logs,
    browser history and any intermediary.
    """
    old_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def strong_enough(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password minimum 8 characters")
        return v


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    bio: Optional[str] = None
    sport: Optional[str] = None
    sports: Optional[List[str]] = None
    position: Optional[str] = None
    experience_level: Optional[ExperienceLevel] = None
    location: Optional[str] = None
    city: Optional[str] = None
    is_open_to_recruit: Optional[bool] = None
    highlight_video_url: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_url: Optional[str] = None


class UserPublic(BaseModel):
    id: str
    username: str
    full_name: str
    avatar_url: Optional[str] = None
    role: str
    sport: str
    experience_level: str
    city: Optional[str] = None
    is_verified: bool = False
    is_open_to_recruit: bool = False
    pulse_score: float = 100.0
    level: int = 1
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0
