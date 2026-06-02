import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, Integer, Float, JSON, ForeignKey, UniqueConstraint, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="athlete")  # athlete | recruiter | coach | organizer
    sport: Mapped[str] = mapped_column(String(50), nullable=True)
    sports: Mapped[list] = mapped_column(JSON, default=list)
    position: Mapped[str] = mapped_column(String(50), nullable=True)
    experience_level: Mapped[str] = mapped_column(String(50), default="beginner")  # beginner | amateur | semi_pro | pro | elite
    location: Mapped[str] = mapped_column(String(255), nullable=True)
    city: Mapped[str] = mapped_column(String(100), nullable=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=True)
    longitude: Mapped[float] = mapped_column(Float, nullable=True)
    bio: Mapped[str] = mapped_column(String(500), nullable=True)
    avatar_url: Mapped[str] = mapped_column(String(255), nullable=True)
    is_open_to_recruit: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_login: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    login_streak: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Cosmetics (unlockable via coins shop)
    profile_theme: Mapped[str] = mapped_column(String(50), default="default")
    profile_banner: Mapped[str] = mapped_column(String(100), nullable=True)
    profile_border: Mapped[str] = mapped_column(String(100), nullable=True)
    profile_effect: Mapped[str] = mapped_column(String(100), nullable=True)

    # Relationships
    pulse_score = relationship("PulseScore", back_populates="user", uselist=False, cascade="all, delete-orphan")
    level = relationship("UserLevel", back_populates="user", uselist=False, cascade="all, delete-orphan")
    coins = relationship("UserCoins", back_populates="user", uselist=False, cascade="all, delete-orphan")
    streak = relationship("UserStreak", back_populates="user", uselist=False, cascade="all, delete-orphan")
    
class Follower(Base):
    __tablename__ = "followers"
    __table_args__ = (
        UniqueConstraint("follower_id", "following_id", name="uq_follower_following"),
    )
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    follower_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    following_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
