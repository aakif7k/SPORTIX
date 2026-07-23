from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user
from app.services import user_service

router = APIRouter()


@router.get("/")
async def get_settings(user=Depends(get_current_user)):
    data = await user_service.get_settings(user["id"])
    return {"success": True, "data": data}


@router.put("/notifications")
async def update_notification_prefs(payload: dict, user=Depends(get_current_user)):
    data = await user_service.update_settings(user["id"], {"notification_prefs": payload})
    return {"success": True, "data": data}


@router.put("/privacy")
async def update_privacy(payload: dict, user=Depends(get_current_user)):
    data = await user_service.update_settings(user["id"], {"privacy": payload})
    return {"success": True, "data": data}


@router.put("/sport-preferences")
async def update_sport_prefs(payload: dict, user=Depends(get_current_user)):
    data = await user_service.update_settings(user["id"], {"sport_preferences": payload})
    return {"success": True, "data": data}


@router.delete("/account")
async def delete_account(user=Depends(get_current_user)):
    """Permanently delete the user's account and all associated data."""
    from app.services import auth_service
    await auth_service.delete_account(user["id"])
    return {"success": True, "message": "Account deleted permanently"}
