import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Integer, Boolean, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Badge(Base):
    __tablename__ = "badges"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    badge_type: Mapped[str] = mapped_column(String(50), nullable=False)  # level_rank | achievement | mission | event | squad | streak | prestige | special
    tier: Mapped[str] = mapped_column(String(50), nullable=False)  # bronze | silver | gold | elite | prestige | legend
    level_required: Mapped[int] = mapped_column(Integer, nullable=True)
    condition_type: Mapped[str] = mapped_column(String(100), nullable=True)
    condition_value: Mapped[int] = mapped_column(Integer, nullable=True)
    icon_key: Mapped[str] = mapped_column(String(100), nullable=False)  # matches frontend SVG badge icon
    glow_color: Mapped[str] = mapped_column(String(50), default="#CCFF00")
    is_animated: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class UserBadge(Base):
    __tablename__ = "user_badges"
    __table_args__ = (
        UniqueConstraint("user_id", "badge_id", name="uq_user_badge"),
    )
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    badge_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("badges.id", ondelete="CASCADE"), nullable=False)
    unlocked_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)  # shown on profile

    # Relationships
    user = relationship("User")
    badge = relationship("Badge")
