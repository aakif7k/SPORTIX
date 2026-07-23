from fastapi import APIRouter, Depends, Query
from app.core.dependencies import get_current_user
from app.services import notification_service

router = APIRouter()


@router.get("/")
async def get_notifications(
    page: int = Query(0),
    limit: int = Query(20, le=50),
    unread_only: bool = Query(False),
    user=Depends(get_current_user),
):
    data = await notification_service.get_for_user(user["id"], page, limit, unread_only)
    return {"success": True, "data": data}


@router.get("/unread-count")
async def get_unread_count(user=Depends(get_current_user)):
    count = await notification_service.get_unread_count(user["id"])
    return {"success": True, "data": {"count": count}}


@router.post("/{notification_id}/read")
async def mark_read(notification_id: str, user=Depends(get_current_user)):
    await notification_service.mark_read(notification_id, user["id"])
    return {"success": True}


@router.post("/read-all")
async def mark_all_read(user=Depends(get_current_user)):
    await notification_service.mark_all_read(user["id"])
    return {"success": True, "message": "All notifications marked as read"}


@router.delete("/{notification_id}")
async def delete_notification(notification_id: str, user=Depends(get_current_user)):
    await notification_service.delete(notification_id, user["id"])
    return {"success": True}
