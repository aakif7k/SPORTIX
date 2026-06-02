import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class UserCoins(Base):
    __tablename__ = "user_coins"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    balance: Mapped[int] = mapped_column(Integer, default=0)
    total_earned: Mapped[int] = mapped_column(Integer, default=0)
    total_spent: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="coins")

class CoinTransaction(Base):
    __tablename__ = "coin_transactions"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)  # positive = earn, negative = spend
    transaction_type: Mapped[str] = mapped_column(String(50), nullable=False)  # mission_reward | event_reward | squad_win | achievement | daily_streak | level_up | purchase_theme | purchase_banner | purchase_border | purchase_effect
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    reference_id: Mapped[str] = mapped_column(String(100), nullable=True)  # mission_id, event_id, etc.
    balance_after: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User")
