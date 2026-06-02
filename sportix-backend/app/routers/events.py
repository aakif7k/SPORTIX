from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from typing import List, Optional

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.event import EventCreate, EventResponse
from app.services.event_service import create_new_event, join_event, leave_event, list_events

router = APIRouter(prefix="/api/events", tags=["events"])

@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_in: EventCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await create_new_event(db, current_user.id, event_in)

@router.get("", response_model=List[EventResponse])
async def get_events(
    sport: Optional[str] = None,
    city: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    return await list_events(db, sport, city)

@router.post("/{event_id}/join")
async def register_event(
    event_id: uuid.UUID,
    entry_type: str = "solo",
    squad_id: Optional[uuid.UUID] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await join_event(db, current_user.id, event_id, entry_type, squad_id)

@router.delete("/{event_id}/leave")
async def withdraw_event(
    event_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await leave_event(db, current_user.id, event_id)
