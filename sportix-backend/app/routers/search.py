from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.core.dependencies import get_current_user
from app.core.appwrite import db, DB_ID
from app.core.config import settings
from appwrite.query import Query as Q

router = APIRouter()


@router.get("/")
async def global_search(
    q: str = Query(..., min_length=1),
    type: Optional[str] = Query(None, description="users|posts|events|squads"),
    sport: Optional[str] = Query(None),
    limit: int = Query(20, le=50),
    user=Depends(get_current_user),
):
    """
    Multi-entity search across users, posts, events, and squads.
    Pass ?type= to restrict to a single entity type.
    """
    results = {}

    if not type or type == "users":
        try:
            res = db.list_documents(
                DB_ID, settings.collection_users,
                queries=[Q.search("username", q), Q.limit(limit)],
            )
            results["users"] = res["documents"]
        except Exception:
            results["users"] = []

    if not type or type == "posts":
        try:
            res = db.list_documents(
                DB_ID, settings.collection_posts,
                queries=[Q.search("content", q), Q.limit(limit)],
            )
            results["posts"] = res["documents"]
        except Exception:
            results["posts"] = []

    if not type or type == "events":
        try:
            res = db.list_documents(
                DB_ID, settings.collection_events,
                queries=[Q.search("title", q), Q.limit(limit)],
            )
            results["events"] = res["documents"]
        except Exception:
            results["events"] = []

    if not type or type == "squads":
        try:
            res = db.list_documents(
                DB_ID, settings.collection_squads,
                queries=[Q.search("name", q), Q.limit(limit)],
            )
            results["squads"] = res["documents"]
        except Exception:
            results["squads"] = []

    return {"success": True, "data": results, "query": q}
