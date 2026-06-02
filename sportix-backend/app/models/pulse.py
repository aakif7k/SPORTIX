import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class PulseScore(Base):
    __tablename__ = "pulse_scores"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    total_pulse: Mapped[float] = mapped_column(Float, default=100.0)
    match_performance: Mapped[float] = mapped_column(Float, default=0.0)
    consistency: Mapped[float] = mapped_column(Float, default=0.0)
    team_chemistry: Mapped[float] = mapped_column(Float, default=0.0)
    reliability: Mapped[float] = mapped_column(Float, default=0.0)
    activity: Mapped[float] = mapped_column(Float, default=0.0)
    leadership: Mapped[float] = mapped_column(Float, default=0.0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="pulse_score")

class PulseHistory(Base):
    __tablename__ = "pulse_history"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    source: Mapped[str] = mapped_column(String(50), default="match")  # match | login | post | event | mission | squad | reaction | highlight | challenge
    old_pulse: Mapped[float] = mapped_column(Float, nullable=False)
    new_pulse: Mapped[float] = mapped_column(Float, nullable=False)
    delta: Mapped[float] = mapped_column(Float, nullable=False)
    reason: Mapped[str] = mapped_column(String(255), nullable=False)
    match_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("matches.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User")
    match = relationship("Match")
