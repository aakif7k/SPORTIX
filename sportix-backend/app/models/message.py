import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Text, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class Message(Base):
    __tablename__ = "messages"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    squad_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("squads.id", ondelete="CASCADE"), nullable=True)
    sender_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    receiver_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    message_type: Mapped[str] = mapped_column(String(50), default="text")  # text | announcement | poll | tactical | achievement
    attachment_url: Mapped[str] = mapped_column(String(255), nullable=True)
    poll_data: Mapped[dict] = mapped_column(JSON, nullable=True)  # poll options & results
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    squad = relationship("Squad")
    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])
