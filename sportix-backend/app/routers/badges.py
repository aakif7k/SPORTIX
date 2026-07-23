from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user
from app.services import badge_service

router = APIRouter()


@router.get("/")
async def get_all_badges(user=Depends(get_current_user)):
    """All available badges in the system."""
    data = await badge_service.get_all()
    return {"success": True, "data": data}


@router.get("/me")
async def get_my_badges(user=Depends(get_current_user)):
    data = await badge_service.get_user_badges(user["id"])
    return {"success": True, "data": data}


@router.get("/me/recent")
async def get_recent_badges(user=Depends(get_current_user)):
    data = await badge_service.get_recent(user["id"])
    return {"success": True, "data": data}


@router.get("/{user_id}")
async def get_user_badges(user_id: str, user=Depends(get_current_user)):
    data = await badge_service.get_user_badges(user_id)
    return {"success": True, "data": data}
