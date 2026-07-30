from fastapi import APIRouter, Depends, Query, Request, Response
from app.core.rate_limit import limiter, WRITE_LIMIT
from typing import Optional
from app.core.dependencies import get_current_user
from app.schemas.post import ReelCreate
from app.services import reel_service

router = APIRouter()


@router.get("/")
async def get_reels(
    page: int = Query(0),
    sport: Optional[str] = Query(None),
    user=Depends(get_current_user),
):
    data = await reel_service.get_feed(user["id"], page, sport)
    return {"success": True, "data": data}


@router.post("/", status_code=201)
@limiter.limit(WRITE_LIMIT)
async def create_reel(request: Request, response: Response, payload: ReelCreate, user=Depends(get_current_user)):
    data = await reel_service.create(user["id"], payload)
    return {"success": True, "data": data}


@router.get("/{reel_id}")
async def get_reel(reel_id: str, user=Depends(get_current_user)):
    data = await reel_service.get_by_id(reel_id, user["id"])
    return {"success": True, "data": data}


@router.delete("/{reel_id}")
async def delete_reel(reel_id: str, user=Depends(get_current_user)):
    await reel_service.delete(reel_id, user["id"])
    return {"success": True, "message": "Reel deleted"}


@router.post("/{reel_id}/like")
async def toggle_like(reel_id: str, user=Depends(get_current_user)):
    data = await reel_service.toggle_like(reel_id, user["id"])
    return {"success": True, "data": data}


@router.get("/user/{user_id}")
async def get_user_reels(user_id: str, page: int = Query(0), user=Depends(get_current_user)):
    data = await reel_service.get_by_user(user_id, page)
    return {"success": True, "data": data}
