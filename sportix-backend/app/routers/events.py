from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.core.dependencies import get_current_user
from app.schemas.event import EventCreate, EventUpdate
from app.services import event_service, event_readiness_service

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


@router.get("/{event_id}/readiness")
async def get_event_readiness(event_id: str, user=Depends(get_current_user)):
    data = await event_readiness_service.get_event_readiness(event_id, user["id"])
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
async def join_event(
    event_id: str,
    squad_id: Optional[str] = None,
    entry_type: str = "solo",
    user=Depends(get_current_user),
):
    data = await event_service.join(event_id, user["id"], squad_id, entry_type)
    # Check & trigger 10-athlete AutoSquad readiness notification
    await event_readiness_service.check_and_notify_event_readiness(event_id)
    return {"success": True, "data": data}


@router.delete("/{event_id}/join")
async def leave_event(event_id: str, user=Depends(get_current_user)):
    await event_service.leave(event_id, user["id"])
    return {"success": True, "message": "Left event"}


@router.get("/{event_id}/participants")
async def get_participants(event_id: str, user=Depends(get_current_user)):
    data = await event_service.get_participants(event_id)
    return {"success": True, "data": data}
