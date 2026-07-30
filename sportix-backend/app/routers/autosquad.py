from fastapi import APIRouter, Depends, Request, Response
from app.core.rate_limit import limiter, AI_LIMIT
from app.core.dependencies import get_current_user
from app.schemas.ai import AutoSquadRequest
from app.services import ai_squad_service

router = APIRouter()


@router.post("/generate")
@limiter.limit(AI_LIMIT)
async def generate_squad(request: Request, response: Response, payload: AutoSquadRequest, user=Depends(get_current_user)):
    """
    AI AutoSquad — generates an optimal squad for the user based on
    their sport, skill level, and event requirements.
    Limited to MAX_AUTOSQUAD_GENERATIONS per day.
    """
    data = await ai_squad_service.generate(user["id"], payload)
    return {"success": True, "data": data}


@router.get("/history")
async def generation_history(user=Depends(get_current_user)):
    data = await ai_squad_service.get_history(user["id"])
    return {"success": True, "data": data}


@router.get("/remaining")
async def remaining_generations(user=Depends(get_current_user)):
    data = await ai_squad_service.get_remaining(user["id"])
    return {"success": True, "data": data}


@router.post("/{request_id}/accept")
async def accept_squad(request_id: str, user=Depends(get_current_user)):
    data = await ai_squad_service.accept(request_id, user["id"])
    return {"success": True, "data": data}


@router.post("/{request_id}/reject")
async def reject_squad(request_id: str, user=Depends(get_current_user)):
    await ai_squad_service.reject(request_id, user["id"])
    return {"success": True, "message": "Squad suggestion rejected"}
