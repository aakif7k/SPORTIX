from fastapi import APIRouter, Depends, Query
from app.core.dependencies import get_current_user
from app.schemas.squad import SquadCreate, SquadUpdate, MemberAdd, RoleUpdate, TacticsUpdate, LeadershipVote
from app.services import squad_service

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
