from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime
import uuid

class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    role: str = "athlete"  # athlete | recruiter | coach | organizer
    sport: Optional[str] = None
    sports: List[str] = []
    position: Optional[str] = None
    experience_level: str = "beginner"
    location: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    is_open_to_recruit: bool = False

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    sport: Optional[str] = None
    sports: Optional[List[str]] = None
    position: Optional[str] = None
    experience_level: Optional[str] = None
    location: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    is_open_to_recruit: Optional[bool] = None
    profile_theme: Optional[str] = None
    profile_banner: Optional[str] = None
    profile_border: Optional[str] = None
    profile_effect: Optional[str] = None

class UserResponse(UserBase):
    id: uuid.UUID
    is_active: bool
    last_login: Optional[datetime] = None
    login_streak: int
    longest_streak: int
    profile_theme: str
    profile_banner: Optional[str] = None
    profile_border: Optional[str] = None
    profile_effect: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
