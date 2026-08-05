from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.core.dependencies import get_current_user
from app.schemas.event import (
    EventCreate, EventUpdate, EventJoin, ParticipantStatusUpdate,
    EventAnnouncement,
)
from app.services import event_service

router = APIRouter()


@router.get("/")
async def browse_events(
    sport: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skill_level: Optional[str] = Query(None),
    page: int = Query(0),
    limit: int = Query(20, le=50),
    user=Depends(get_current_user),
):
    data = await event_service.browse(
        sport=sport, event_type=event_type, city=city,
        status=status, skill_level=skill_level, page=page, limit=limit,
    )
    return {"success": True, "data": data}


@router.post("/", status_code=201)
async def create_event(payload: EventCreate, user=Depends(get_current_user)):
    data = await event_service.create(user["id"], payload)
    return {"success": True, "data": data}


@router.get("/me")
async def my_events(user=Depends(get_current_user)):
    data = await event_service.get_user_events(user["id"])
    return {"success": True, "data": data}


@router.get("/nearby")
async def nearby_events(city: str = Query(...), page: int = Query(0), user=Depends(get_current_user)):
    data = await event_service.browse(city=city, page=page)
    return {"success": True, "data": data}


@router.get("/{event_id}")
async def get_event(event_id: str, user=Depends(get_current_user)):
    data = await event_service.get_by_id(event_id)
    return {"success": True, "data": data}


@router.put("/{event_id}")
async def update_event(event_id: str, payload: EventUpdate, user=Depends(get_current_user)):
    data = await event_service.update(event_id, user["id"], payload.model_dump(exclude_none=True))
    return {"success": True, "data": data}


@router.delete("/{event_id}")
async def cancel_event(event_id: str, user=Depends(get_current_user)):
    await event_service.cancel(event_id, user["id"])
    return {"success": True, "message": "Event cancelled"}


@router.post("/{event_id}/join")
async def join_event(event_id: str, payload: EventJoin, user=Depends(get_current_user)):
    data = await event_service.join(
        event_id, user["id"], payload.squad_id, payload.entry_type.value)
    return {"success": True, "data": data}


@router.delete("/{event_id}/join")
async def leave_event(event_id: str, user=Depends(get_current_user)):
    await event_service.leave(event_id, user["id"])
    return {"success": True, "message": "Left event"}


@router.get("/{event_id}/participants")
async def get_participants(event_id: str, user=Depends(get_current_user)):
    data = await event_service.get_participants(event_id)
    return {"success": True, "data": data}


# --- Organizer roster management ---------------------------------------------
@router.patch("/{event_id}/participants/{target_user_id}")
async def set_participant_status(
    event_id: str, target_user_id: str, payload: ParticipantStatusUpdate,
    user=Depends(get_current_user),
):
    """Confirm or withdraw an entrant. Organizer only."""
    data = await event_service.set_participant_status(
        event_id, target_user_id, payload.status.value, user["id"])
    return {"success": True, "data": data}


@router.delete("/{event_id}/participants/{target_user_id}")
async def remove_participant(
    event_id: str, target_user_id: str, user=Depends(get_current_user),
):
    """Take an athlete off the roster, freeing their slot. Organizer only."""
    await event_service.remove_participant(event_id, target_user_id, user["id"])
    return {"success": True, "message": "Participant removed"}


@router.post("/{event_id}/announce")
async def announce_to_participants(
    event_id: str, payload: EventAnnouncement, user=Depends(get_current_user),
):
    """Notify every entrant, which is what the broadcast box always claimed."""
    data = await event_service.announce(event_id, payload.message, user["id"])
    return {"success": True, "data": data}
