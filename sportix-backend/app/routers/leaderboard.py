from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.core.dependencies import get_current_user
from app.services import leaderboard_service

router = APIRouter()


@router.get("/global")
async def global_leaderboard(
    sport: Optional[str] = Query(None),
    page: int = Query(0),
    limit: int = Query(50, le=100),
    user=Depends(get_current_user),
):
    data = await leaderboard_service.get_global(sport, page, limit)
    return {"success": True, "data": data}


@router.get("/local")
async def local_leaderboard(
    city: str = Query(...),
    sport: Optional[str] = Query(None),
    page: int = Query(0),
    user=Depends(get_current_user),
):
    data = await leaderboard_service.get_by_city(city, sport, page)
    return {"success": True, "data": data}


@router.get("/sport/{sport}")
async def sport_leaderboard(sport: str, page: int = Query(0), user=Depends(get_current_user)):
    data = await leaderboard_service.get_by_sport(sport, page)
    return {"success": True, "data": data}


@router.get("/me/rank")
async def my_rank(sport: Optional[str] = Query(None), user=Depends(get_current_user)):
    data = await leaderboard_service.get_user_rank(user["id"], sport)
    return {"success": True, "data": data}
