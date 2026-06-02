import uuid
from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.event import Event, EventParticipant
from app.services.mission_service import update_mission_progress

async def create_new_event(
    db: AsyncSession,
    organizer_id: uuid.UUID,
    event_in
) -> Event:
    event = Event(
        id=uuid.uuid4(),
        organizer_id=organizer_id,
        title=event_in.title,
        description=event_in.description,
        sport=event_in.sport,
        event_type=event_in.event_type,
        format=event_in.format,
        date=event_in.date,
        venue=event_in.venue,
        city=event_in.city,
        max_participants=event_in.max_participants,
        current_count=1,  # Organizer joins automatically
        status="open",
        is_ai_managed=False,
        created_at=datetime.utcnow()
    )
    db.add(event)
    await db.flush()
    
    # Add organizer as participant
    organizer_participant = EventParticipant(
        id=uuid.uuid4(),
        event_id=event.id,
        user_id=organizer_id,
        entry_type="solo",
        status="confirmed",
        joined_at=datetime.utcnow()
    )
    db.add(organizer_participant)
    await db.flush()
    return event

async def join_event(
    db: AsyncSession,
    user_id: uuid.UUID,
    event_id: uuid.UUID,
    entry_type: str = "solo",
    squad_id: uuid.UUID = None
) -> dict:
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
        
    if event.status != "open":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Event is not open for registration")
        
    # Check if already joined
    result = await db.execute(
        select(EventParticipant).where(
            EventParticipant.event_id == event_id,
            EventParticipant.user_id == user_id
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        return {"success": True, "message": "Already registered for event"}
        
    if event.current_count >= event.max_participants:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Event is full")
        
    participant = EventParticipant(
        id=uuid.uuid4(),
        event_id=event_id,
        user_id=user_id,
        entry_type=entry_type,
        squad_id=squad_id,
        status="confirmed",
        joined_at=datetime.utcnow()
    )
    db.add(participant)
    event.current_count += 1
    
    if event.current_count >= event.max_participants:
        event.status = "full"
        
    await db.flush()
    
    # Update Daily Mission Progress
    await update_mission_progress(db, user_id, "join_event")
    
    return {"success": True, "message": "Successfully joined event"}

async def leave_event(db: AsyncSession, user_id: uuid.UUID, event_id: uuid.UUID) -> dict:
    event = await db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
        
    result = await db.execute(
        select(EventParticipant).where(
            EventParticipant.event_id == event_id,
            EventParticipant.user_id == user_id
        )
    )
    participant = result.scalar_one_or_none()
    if not participant:
        return {"success": True, "message": "Not registered in this event"}
        
    await db.delete(participant)
    event.current_count = max(0, event.current_count - 1)
    
    if event.status == "full" and event.current_count < event.max_participants:
        event.status = "open"
        
    await db.flush()
    return {"success": True, "message": "Successfully left event"}

async def list_events(db: AsyncSession, sport: str = None, city: str = None) -> list[Event]:
    query = select(Event).options(
        selectinload(Event.organizer),
        selectinload(Event.participants).selectinload(EventParticipant.user)
    )
    if sport:
        query = query.where(Event.sport == sport)
    if city:
        query = query.where(Event.city == city)
        
    result = await db.execute(query.order_by(Event.date.asc()))
    return list(result.scalars().all())
