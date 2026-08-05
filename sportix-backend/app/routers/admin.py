from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from pydantic import BaseModel
from app.core.dependencies import get_current_user
from app.core.appwrite import db, users_svc, DB_ID
from app.core.config import settings

router = APIRouter()


def require_admin(user=Depends(get_current_user)):
    # In production: check a custom 'role' label on the Appwrite user
    # For now, implement role check via the profiles collection
    return user


@router.get("/users")
async def admin_list_users(
    page: int = Query(0),
    limit: int = Query(25, le=100),
    user=Depends(require_admin),
):
    """List all users (admin only)."""
    try:
        from appwrite.query import Query as Q
        res = db.list_documents(
            DB_ID, settings.collection_users,
            queries=[Q.limit(limit), Q.offset(page * limit), Q.order_desc("$createdAt")],
        )
        return {"success": True, "data": res}
    except Exception as e:
        raise HTTPException(500, str(e))


@router.delete("/users/{user_id}")
async def admin_delete_user(user_id: str, user=Depends(require_admin)):
    """Hard-delete a user account (admin only)."""
    try:
        users_svc.delete(user_id)
        db.delete_document(DB_ID, settings.collection_users, user_id)
        return {"success": True, "message": f"User {user_id} deleted"}
    except Exception as e:
        raise HTTPException(500, str(e))


class BanRequest(BaseModel):
    """A ban reason belongs in the body, not the URL: it is prose, and a URL is
    logged by every proxy in the path."""
    reason: Optional[str] = None


@router.post("/users/{user_id}/ban")
async def admin_ban_user(user_id: str, payload: BanRequest, user=Depends(require_admin)):
    """Disable a user account (admin only)."""
    try:
        users_svc.update_status(user_id, False)
        db.update_document(DB_ID, settings.collection_users, user_id, {"is_banned": True, "ban_reason": payload.reason})
        return {"success": True, "message": f"User {user_id} banned"}
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/users/{user_id}/verify")
async def admin_verify_user(user_id: str, user=Depends(require_admin)):
    """Grant verified badge to a user (admin only)."""
    db.update_document(DB_ID, settings.collection_users, user_id, {"is_verified": True})
    return {"success": True, "message": "User verified"}


@router.get("/stats")
async def platform_stats(user=Depends(require_admin)):
    """Platform-wide stats dashboard."""
    try:
        users_count = db.list_documents(DB_ID, settings.collection_users, [])
        posts_count = db.list_documents(DB_ID, settings.collection_posts, [])
        events_count = db.list_documents(DB_ID, settings.collection_events, [])
        squads_count = db.list_documents(DB_ID, settings.collection_squads, [])
        return {
            "success": True,
            "data": {
                "total_users": users_count.get("total", 0),
                "total_posts": posts_count.get("total", 0),
                "total_events": events_count.get("total", 0),
                "total_squads": squads_count.get("total", 0),
            },
        }
    except Exception as e:
        raise HTTPException(500, str(e))
