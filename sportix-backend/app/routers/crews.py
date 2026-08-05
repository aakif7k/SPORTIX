"""
Event crews.

The collections were provisioned in phase 2 and never touched: EventCrewPage held
its roster in a component array, so a crew existed until the page unmounted and no
teammate ever saw it.
"""
from fastapi import APIRouter, Depends, Request, Response

from app.core.dependencies import get_current_user
from app.core.rate_limit import limiter, WRITE_LIMIT
from app.schemas.crew import CrewCreate, CrewRename, CrewMemberAdd
from app.services import crew_service

router = APIRouter()


@router.get("/event/{event_id}")
async def get_crew_for_event(event_id: str, user=Depends(get_current_user)):
    """
    The caller's crew for this event, or null.

    Null rather than a 404: having no crew yet is the normal starting state.
    """
    data = await crew_service.get_for_event(event_id, user["id"])
    return {"success": True, "data": data}


@router.post("/event/{event_id}", status_code=201)
@limiter.limit(WRITE_LIMIT)
async def create_crew(
    request: Request, response: Response,
    event_id: str, payload: CrewCreate, user=Depends(get_current_user),
):
    """Form a crew for an event; the creator becomes its captain."""
    data = await crew_service.create(event_id, payload.name, user["id"])
    return {"success": True, "data": data}


@router.put("/{crew_id}")
async def rename_crew(crew_id: str, payload: CrewRename, user=Depends(get_current_user)):
    data = await crew_service.rename(crew_id, payload.name, user["id"])
    return {"success": True, "data": data}


@router.post("/{crew_id}/members", status_code=201)
async def add_crew_member(
    crew_id: str, payload: CrewMemberAdd, user=Depends(get_current_user),
):
    """Invite an athlete. Captain only."""
    data = await crew_service.add_member(
        crew_id, payload.user_id, user["id"], payload.position)
    return {"success": True, "data": data}


@router.delete("/{crew_id}/members/{target_user_id}")
async def remove_crew_member(
    crew_id: str, target_user_id: str, user=Depends(get_current_user),
):
    """The captain can remove anyone; anyone can remove themselves."""
    data = await crew_service.remove_member(crew_id, target_user_id, user["id"])
    return {"success": True, "data": data}


@router.delete("/{crew_id}")
async def disband_crew(crew_id: str, user=Depends(get_current_user)):
    await crew_service.disband(crew_id, user["id"])
    return {"success": True, "message": "Crew disbanded"}
