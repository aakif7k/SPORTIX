from fastapi import APIRouter, Depends, Query
from app.core.dependencies import get_current_user
from app.schemas.squad import SquadCreate, SquadUpdate, MemberAdd, RoleUpdate, TacticsUpdate, LeadershipVote, SquadEventCreate, SquadEventVote, SquadPostCreate
from app.schemas.message import SquadMessageCreate
from app.services import squad_service, squad_activity_service, messaging_service

router = APIRouter()


@router.get("/me")
async def my_squads(user=Depends(get_current_user)):
    data = await squad_service.get_user_squads(user["id"])
    return {"success": True, "data": data}


@router.post("/", status_code=201)
async def create_squad(payload: SquadCreate, user=Depends(get_current_user)):
    data = await squad_service.create(user["id"], payload)
    return {"success": True, "data": data}


@router.get("/{squad_id}")
async def get_squad(squad_id: str, user=Depends(get_current_user)):
    data = await squad_service.get_by_id(squad_id)
    return {"success": True, "data": data}


@router.put("/{squad_id}")
async def update_squad(squad_id: str, payload: SquadUpdate, user=Depends(get_current_user)):
    data = await squad_service.update(squad_id, user["id"], payload)
    return {"success": True, "data": data}


@router.delete("/{squad_id}")
async def disband_squad(squad_id: str, user=Depends(get_current_user)):
    await squad_service.disband(squad_id, user["id"])
    return {"success": True, "message": "Squad disbanded"}


@router.get("/{squad_id}/members")
async def get_members(squad_id: str, user=Depends(get_current_user)):
    data = await squad_service.get_members(squad_id)
    return {"success": True, "data": data}


@router.post("/{squad_id}/members", status_code=201)
async def add_member(squad_id: str, payload: MemberAdd, user=Depends(get_current_user)):
    data = await squad_service.add_member(squad_id, user["id"], payload)
    return {"success": True, "data": data}


@router.delete("/{squad_id}/members/{target_user_id}")
async def remove_member(squad_id: str, target_user_id: str, user=Depends(get_current_user)):
    await squad_service.remove_member(squad_id, target_user_id, user["id"])
    return {"success": True, "message": "Member removed"}


@router.patch("/{squad_id}/members/{target_user_id}/role")
async def update_role(
    squad_id: str, target_user_id: str, payload: RoleUpdate,
    user=Depends(get_current_user),
):
    await squad_service.update_role(squad_id, target_user_id, payload.role.value, user["id"])
    return {"success": True, "message": "Role updated"}


@router.get("/{squad_id}/chemistry")
async def get_chemistry(squad_id: str, user=Depends(get_current_user)):
    data = await squad_service.get_chemistry(squad_id)
    return {"success": True, "data": data}


@router.get("/{squad_id}/analytics")
async def get_analytics(squad_id: str, user=Depends(get_current_user)):
    data = await squad_service.get_analytics(squad_id)
    return {"success": True, "data": data}


@router.put("/{squad_id}/tactics")
async def update_tactics(
    squad_id: str,
    payload: TacticsUpdate,
    user=Depends(get_current_user),
):
    data = await squad_service.update_tactics(
        squad_id, user["id"], payload.formation, payload.tactical_notes
    )
    return {"success": True, "data": data}


@router.post("/{squad_id}/leadership/vote")
async def vote_leadership(
    squad_id: str, payload: LeadershipVote, user=Depends(get_current_user),
):
    data = await squad_service.vote_leadership(
        squad_id, payload.candidate_id, user["id"], payload.vote
    )
    return {"success": True, "data": data}


# ─── Squad activity: scheduling, feed, achievements ───────────────────────────
# These endpoints back UI that shipped with no backend at all.

@router.get("/{squad_id}/events")
async def list_squad_events(squad_id: str, user=Depends(get_current_user)):
    """Scheduled practices and matches, with attendance tallies folded in."""
    data = await squad_activity_service.list_events(squad_id, user["id"])
    return {"success": True, "data": data}


@router.post("/{squad_id}/events", status_code=201)
async def create_squad_event(
    squad_id: str, payload: SquadEventCreate, user=Depends(get_current_user),
):
    data = await squad_activity_service.create_event(
        squad_id, user["id"], payload.model_dump(),
    )
    return {"success": True, "data": data}


@router.post("/events/{squad_event_id}/vote")
async def vote_squad_event(
    squad_event_id: str, payload: SquadEventVote, user=Depends(get_current_user),
):
    """Record availability for a session."""
    data = await squad_activity_service.vote_event(
        squad_event_id, user["id"], payload.vote.value,
    )
    return {"success": True, "data": data}


@router.delete("/events/{squad_event_id}")
async def cancel_squad_event(squad_event_id: str, user=Depends(get_current_user)):
    data = await squad_activity_service.cancel_event(squad_event_id, user["id"])
    return {"success": True, "data": data}


@router.get("/{squad_id}/posts")
async def list_squad_posts(
    squad_id: str, page: int = Query(0), limit: int = Query(20, le=50),
    user=Depends(get_current_user),
):
    data = await squad_activity_service.list_posts(squad_id, user["id"], page, limit)
    return {"success": True, "data": data}


@router.post("/{squad_id}/posts", status_code=201)
async def create_squad_post(
    squad_id: str, payload: SquadPostCreate, user=Depends(get_current_user),
):
    data = await squad_activity_service.create_post(
        squad_id, user["id"], payload.content, payload.media_url,
    )
    return {"success": True, "data": data}


@router.post("/posts/{squad_post_id}/like")
async def like_squad_post(squad_post_id: str, user=Depends(get_current_user)):
    data = await squad_activity_service.toggle_post_like(squad_post_id, user["id"])
    return {"success": True, "data": data}


@router.delete("/posts/{squad_post_id}")
async def delete_squad_post(squad_post_id: str, user=Depends(get_current_user)):
    data = await squad_activity_service.delete_post(squad_post_id, user["id"])
    return {"success": True, "data": data}


@router.get("/{squad_id}/achievements")
async def list_squad_achievements(squad_id: str, user=Depends(get_current_user)):
    """The achievement shelf, re-evaluated on read so it is always current."""
    data = await squad_activity_service.list_achievements(squad_id, user["id"])
    return {"success": True, "data": data}


# ─── Squad chat ───────────────────────────────────────────────────────────────
# squad_messages was provisioned in phase 2 and never served; SquadChat kept its
# messages in zustand, so nothing was sent anywhere.

@router.get("/{squad_id}/messages")
async def list_squad_messages(
    squad_id: str, page: int = Query(0), limit: int = Query(50, le=100),
    user=Depends(get_current_user),
):
    """Channel history, oldest-first for rendering, with JSON blobs parsed."""
    data = await messaging_service.list_squad_messages(squad_id, user["id"], page, limit)
    return {"success": True, "data": data}


@router.post("/{squad_id}/messages", status_code=201)
async def send_squad_message(
    squad_id: str, payload: SquadMessageCreate, user=Depends(get_current_user),
):
    data = await messaging_service.send_squad_message(
        squad_id, user["id"], payload.content, payload.type.value,
        payload.attachment_url, payload.poll_data,
        payload.tactical_data, payload.announcement_data,
    )
    return {"success": True, "data": data}
