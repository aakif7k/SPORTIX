from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
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
        return {"success": True, "data": res.to_dict() if hasattr(res, 'to_dict') else res}
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


@router.post("/users/{user_id}/ban")
async def admin_ban_user(user_id: str, reason: Optional[str] = None, user=Depends(require_admin)):
    """Disable a user account (admin only)."""
    try:
        users_svc.update_status(user_id, False)
        db.update_document(DB_ID, settings.collection_users, user_id, {"is_banned": True, "ban_reason": reason})
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
                "total_users": getattr(users_count, 'total', 0),
                "total_posts": getattr(posts_count, 'total', 0),
                "total_events": getattr(events_count, 'total', 0),
                "total_squads": getattr(squads_count, 'total', 0),
            },
        }
    except Exception as e:
        raise HTTPException(500, str(e))


# ── List all Appwrite collections (tables) ────────────────────────────────────

@router.get("/collections", summary="List all Appwrite collections (tables)")
async def list_collections():
    """
    Returns every collection in the Appwrite database with:
    - collection name & ID
    - number of attributes (schema columns)
    - live document count
    - enabled status

    No auth guard on this endpoint so it can be called directly from
    the browser or FastAPI /docs during development.
    """
    try:
        # Fetch the collection list from Appwrite
        result = db.list_collections(DB_ID)
        raw = getattr(result, "collections", [])

        tables = []
        for col_obj in raw:
            col = col_obj.to_dict() if hasattr(col_obj, 'to_dict') else (col_obj if isinstance(col_obj, dict) else vars(col_obj))
            
            col_id   = col.get("$id", col.get("id", ""))
            col_name = col.get("name", col_id)
            attrs    = col.get("attributes", [])

            # Live document count (falls back to -1 if the collection is inaccessible)
            doc_count = 0
            try:
                from appwrite.query import Query as Q
                docs = db.list_documents(DB_ID, col_id, queries=[Q.limit(1)])
                doc_count = getattr(docs, 'total', 0) if not isinstance(docs, dict) else docs.get("total", 0)
            except Exception:
                doc_count = -1

            tables.append({
                "id":              col_id,
                "name":            col_name,
                "enabled":         col.get("enabled", True),
                "attribute_count": len(attrs),
                "document_count":  doc_count,
                # Quick schema view — column names & types
                "attributes": [
                    {
                        "key":      a.get("key", "") if isinstance(a, dict) else getattr(a, "key", ""),
                        "type":     a.get("type", "") if isinstance(a, dict) else getattr(a, "type", ""),
                        "required": a.get("required", False) if isinstance(a, dict) else getattr(a, "required", False),
                        "array":    a.get("array", False) if isinstance(a, dict) else getattr(a, "array", False),
                    }
                    for a in attrs
                ],
            })

        # Alphabetical order
        tables.sort(key=lambda t: t["name"])

        return {
            "success":          True,
            "database_id":      DB_ID,
            "collection_count": len(tables),
            "collections":      tables,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Appwrite error: {str(e)}")
