"""
The AI proxy.

Gemini used to be called straight from the browser with VITE_GEMINI_API_KEY, so
the key was in the bundle for anyone to take. These endpoints keep it on the
server, and they are the strictest rate-limited tier because they cost money per
call.
"""
from fastapi import APIRouter, Depends, Request, Response

from app.core.dependencies import get_current_user
from app.core.rate_limit import limiter, AI_LIMIT
from app.schemas.ai import SquadSuggestRequest
from app.services import ai_service, career_service

router = APIRouter()


@router.get("/health")
async def ai_health(user=Depends(get_current_user)):
    """
    Whether AI is configured and reachable. Backs the Settings diagnostic, which
    used to make its own Gemini call from the browser.
    """
    data = await ai_service.check()
    return {"success": True, "data": data}


@router.post("/squad-suggestion")
@limiter.limit(AI_LIMIT)
async def suggest_squad(
    request: Request, response: Response,
    payload: SquadSuggestRequest, user=Depends(get_current_user),
):
    """
    Assign roles across real athletes and explain the choice.

    The candidates are selected from the database first; the model only reasons
    over athletes that exist, and anything it names outside that set is dropped.
    """
    from app.services import ai_squad_service

    candidates = await ai_squad_service.find_candidates(
        payload.sport, payload.skill_level.value, user["id"])
    data = await ai_service.suggest_squad(
        candidates, payload.sport, payload.skill_level.value, payload.size)
    return {
        "success": True,
        "data": {
            **data,
            # The full candidate rows, so the client can render whoever was chosen
            # without a second request.
            "candidates": candidates,
        },
    }


@router.get("/performance-insight")
@limiter.limit(AI_LIMIT)
async def performance_insight(
    request: Request, response: Response, user=Depends(get_current_user),
):
    """
    Observations about the caller's own record, replacing three hardcoded
    "insights" that asserted the same specifics for every athlete.
    """
    career = await career_service.get_career(user["id"])
    history = (await career_service.get_history(user["id"], limit=20)).get("items", [])
    data = await ai_service.performance_insight(career, history)
    return {"success": True, "data": data}
