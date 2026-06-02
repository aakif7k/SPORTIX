import uuid
from datetime import datetime, date as date_type
from sqlalchemy import ForeignKey, DateTime, Integer, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class UserStreak(Base):
    __tablename__ = "user_streaks"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_active_date: Mapped[date_type] = mapped_column(Date, nullable=True)
    streak_broken_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="streak")
