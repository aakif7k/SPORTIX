from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
import uuid
from datetime import datetime

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.message import Message
from app.schemas.message import MessageResponse, MessageCreate

router = APIRouter(prefix="/api/messages", tags=["messages"])

@router.get("/squad/{squad_id}", response_model=List[MessageResponse])
async def get_squad_messages(
    squad_id: uuid.UUID,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Message)
        .options(selectinload(Message.sender))
        .where(Message.squad_id == squad_id)
        .order_by(Message.created_at.asc())
        .limit(limit)
    )
    return list(result.scalars().all())

@router.post("/squad/{squad_id}", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_squad_message(
    squad_id: uuid.UUID,
    message_in: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    message = Message(
        id=uuid.uuid4(),
        squad_id=squad_id,
        sender_id=current_user.id,
        receiver_id=message_in.receiver_id,
        content=message_in.content,
        message_type=message_in.message_type,
        attachment_url=message_in.attachment_url,
        poll_data=message_in.poll_data,
        is_read=False,
        created_at=datetime.utcnow()
    )
    db.add(message)
    await db.flush()
    
    # Eager load sender
    await db.refresh(message, ["sender"])
    return message
