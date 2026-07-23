from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.core.dependencies import get_current_user
from app.services import pulse_service

router = APIRouter()


@router.get("/me")
async def get_my_pulse(user=Depends(get_current_user)):
    data = await pulse_service.get_pulse(user["id"])
    return {"success": True, "data": data}


@router.get("/me/history")
async def get_pulse_history(limit: int = Query(30, le=100), user=Depends(get_current_user)):
    data = await pulse_service.get_history(user["id"], limit)
    return {"success": True, "data": data}


@router.get("/me/level")
async def get_my_level(user=Depends(get_current_user)):
    data = await pulse_service.get_level(user["id"])
    return {"success": True, "data": data}


@router.get("/me/level/history")
async def get_level_history(user=Depends(get_current_user)):
    data = await pulse_service.get_level_history(user["id"])
    return {"success": True, "data": data}


@router.get("/me/ssr")
async def get_my_ssr(sport: Optional[str] = Query(None), user=Depends(get_current_user)):
    data = await pulse_service.get_ssr(user["id"], sport)
    return {"success": True, "data": data}


@router.get("/{user_id}")
async def get_user_pulse(user_id: str, user=Depends(get_current_user)):
    data = await pulse_service.get_pulse(user_id)
    return {"success": True, "data": data}
