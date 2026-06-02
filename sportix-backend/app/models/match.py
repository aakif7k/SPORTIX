import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Integer, Text, Boolean, Float, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Match(Base):
    __tablename__ = "matches"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("events.id", ondelete="SET NULL"), nullable=True)
    squad_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("squads.id", ondelete="CASCADE"), nullable=False)
    opponent_squad_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("squads.id", ondelete="SET NULL"), nullable=True)
    result: Mapped[str] = mapped_column(String(50), default="pending")  # win | loss | draw | pending
    chemistry_delta: Mapped[float] = mapped_column(Float, default=0.0)
    top_performer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    played_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    event = relationship("Event")
    squad = relationship("Squad", foreign_keys=[squad_id])
    opponent_squad = relationship("Squad", foreign_keys=[opponent_squad_id])
    top_performer = relationship("User")

class PlayerStat(Base):
    __tablename__ = "player_stats"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    match_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sport: Mapped[str] = mapped_column(String(50), nullable=False)
    stats_data: Mapped[dict] = mapped_column(JSON, nullable=False)  # football: goals, assists etc.
    media_proof_url: Mapped[str] = mapped_column(String(255), nullable=True)
    validation_status: Mapped[str] = mapped_column(String(50), default="pending")  # pending | accepted | partial | flagged
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    match = relationship("Match")
    user = relationship("User")
    validations = relationship("StatValidation", back_populates="player_stat", cascade="all, delete-orphan")

class StatValidation(Base):
    __tablename__ = "stat_validations"
    __table_args__ = (
        UniqueConstraint("player_stat_id", "validator_id", name="uq_stat_validator"),
    )
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    player_stat_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("player_stats.id", ondelete="CASCADE"), nullable=False)
    validator_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    vote: Mapped[str] = mapped_column(String(50), nullable=False)  # confirm | partial | dispute
    reason: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    player_stat = relationship("PlayerStat", back_populates="validations")
    validator = relationship("User")

class RetentionVote(Base):
    __tablename__ = "retention_votes"
    __table_args__ = (
        UniqueConstraint("match_id", "voter_id", name="uq_match_voter_retention"),
    )
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    match_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    voter_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    squad_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("squads.id", ondelete="CASCADE"), nullable=False)
    vote: Mapped[str] = mapped_column(String(50), nullable=False)  # definitely | maybe | no
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    match = relationship("Match")
    voter = relationship("User")
    squad = relationship("Squad")
