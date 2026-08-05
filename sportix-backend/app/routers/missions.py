from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user
from app.services import mission_service

router = APIRouter()


@router.get("/today")
async def get_todays_missions(user=Depends(get_current_user)):
    data = await mission_service.get_today(user["id"])
    return {"success": True, "data": data}


@router.post("/claim/{mission_id}")
async def claim_mission(mission_id: str, user=Depends(get_current_user)):
    data = await mission_service.claim(mission_id, user["id"])
    return {"success": True, "data": data}


@router.get("/history")
async def get_mission_history(user=Depends(get_current_user)):
    data = await mission_service.get_history(user["id"])
    return {"success": True, "data": data}


@router.get("/streak")
async def get_streak(user=Depends(get_current_user)):
    data = await mission_service.get_streak(user["id"])
    return {"success": True, "data": data}


@router.get("/weekly")
async def get_weekly_summary(user=Depends(get_current_user)):
    data = await mission_service.get_weekly(user["id"])
    return {"success": True, "data": data}


@router.post("/streak/claim")
async def claim_daily_reward(user=Depends(get_current_user)):
    """
    Claim today's rung of the 7-day login-streak ladder.

    The calendar on PulseLobby was seven hardcoded rows with days 1-3 permanently
    claimed and day 4 permanently "today"; claiming only changed local state.
    """
    data = await mission_service.claim_daily_reward(user["id"])
    return {"success": True, "data": data}
