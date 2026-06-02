import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Integer, Text, Boolean, Float, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Squad(Base):
    __tablename__ = "squads"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    sport: Mapped[str] = mapped_column(String(50), nullable=False)
    captain_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    vice_captain_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    formation: Mapped[str] = mapped_column(String(50), default="4-3-3")
    tactical_notes: Mapped[str] = mapped_column(Text, nullable=True)
    chemistry_score: Mapped[float] = mapped_column(Float, default=0.0)
    trust_index: Mapped[float] = mapped_column(Float, default=0.0)
    communication_score: Mapped[float] = mapped_column(Float, default=0.0)
    coordination_score: Mapped[float] = mapped_column(Float, default=0.0)
    win_count: Mapped[int] = mapped_column(Integer, default=0)
    draw_count: Mapped[int] = mapped_column(Integer, default=0)
    loss_count: Mapped[int] = mapped_column(Integer, default=0)
    is_ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    generation_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    captain = relationship("User", foreign_keys=[captain_id])
    vice_captain = relationship("User", foreign_keys=[vice_captain_id])
    members = relationship("SquadMember", back_populates="squad", cascade="all, delete-orphan")

class SquadMember(Base):
    __tablename__ = "squad_members"
    __table_args__ = (
        UniqueConstraint("squad_id", "user_id", name="uq_squad_user_member"),
    )
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    squad_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("squads.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="member")  # captain|vice_captain|strategist|analyst|recruiter|member
    position: Mapped[str] = mapped_column(String(50), nullable=True)
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    squad = relationship("Squad", back_populates="members")
    user = relationship("User")
