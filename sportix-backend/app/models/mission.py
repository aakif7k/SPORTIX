import uuid
from datetime import datetime, date as date_type
from sqlalchemy import String, ForeignKey, DateTime, Integer, Boolean, Float, Date, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class DailyMission(Base):
    __tablename__ = "daily_missions"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    mission_type: Mapped[str] = mapped_column(String(50), nullable=False)  # upload_highlight | join_event | react_posts | complete_match | message_teammate | earn_pulse | join_autosquad | login | follow_athlete | create_post | win_match
    target_count: Mapped[int] = mapped_column(Integer, default=1)
    pulse_reward: Mapped[float] = mapped_column(Float, nullable=False)
    coins_reward: Mapped[int] = mapped_column(Integer, nullable=False)
    xp_reward: Mapped[int] = mapped_column(Integer, default=0)
    badge_reward: Mapped[str] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    difficulty: Mapped[str] = mapped_column(String(50), default="medium")  # easy | medium | hard
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class UserMission(Base):
    __tablename__ = "user_missions"
    __table_args__ = (
        UniqueConstraint("user_id", "mission_id", "date", name="uq_user_mission_date"),
    )
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    mission_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("daily_missions.id", ondelete="CASCADE"), nullable=False)
    date: Mapped[date_type] = mapped_column(Date, nullable=False)
    current_count: Mapped[int] = mapped_column(Integer, default=0)
    target_count: Mapped[int] = mapped_column(Integer, nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    is_claimed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    claimed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    # Relationships
    user = relationship("User")
    mission = relationship("DailyMission")
