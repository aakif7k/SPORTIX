import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class UserLevel(Base):
    __tablename__ = "user_levels"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    current_level: Mapped[int] = mapped_column(Integer, default=1)
    current_pulse: Mapped[float] = mapped_column(Float, default=100.0)
    pulse_for_next: Mapped[float] = mapped_column(Float, default=150.0)
    prestige_rank: Mapped[str] = mapped_column(String(50), default="none")  # none | grandmaster_x | hypernova | phantom_overdrive | immortal_zenith | supreme_goat
    total_pulse_ever: Mapped[float] = mapped_column(Float, default=100.0)
    level_ups_count: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="level")

class LevelHistory(Base):
    __tablename__ = "level_history"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    old_level: Mapped[int] = mapped_column(Integer, nullable=False)
    new_level: Mapped[int] = mapped_column(Integer, nullable=False)
    pulse_at_levelup: Mapped[float] = mapped_column(Float, nullable=False)
    rank_unlocked: Mapped[str] = mapped_column(String(50), nullable=True)
    prestige_unlocked: Mapped[str] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User")
