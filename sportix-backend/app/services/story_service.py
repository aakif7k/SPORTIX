from appwrite.query import Query as Q
from appwrite.id import ID
from app.core.appwrite import db, DB_ID
from app.core.config import settings
from app.utils.formatters import now_iso
from app.schemas.post import StoryCreate
from datetime import datetime, timedelta, timezone


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _expiry_iso() -> str:
    return (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()


async def get_active(user_id: str) -> dict:
    """
    Returns active (<24h) stories from users the current user follows + self.
    Stories are grouped by author on the frontend.
    """
    following_res = db.list_documents(
        DB_ID, settings.collection_followers,
        queries=[Q.equal("follower_id", user_id), Q.limit(200)],
    )
    ids = [doc["following_id"] for doc in following_res.get("documents", [])]
    ids.append(user_id)

    queries = [Q.order_desc("$createdAt"), Q.limit(200)]
    if ids:
        queries.append(Q.equal("author_id", ids))

    res = db.list_documents(DB_ID, settings.collection_stories, queries=queries)
    # Filter expired stories
    now = datetime.now(timezone.utc)
    active = [
        s for s in res.get("documents", [])
        if s.get("expires_at") and datetime.fromisoformat(s["expires_at"].replace("Z", "+00:00")) > now
    ]
    return {"documents": active, "total": len(active)}


async def create(user_id: str, payload: StoryCreate) -> dict:
    return db.create_document(
        DB_ID, settings.collection_stories, ID.unique(),
        data={
            "created_at": now_iso(),
            "author_id": user_id,
            "media_url": payload.media_url,
            "media_type": payload.media_type,
            "caption": payload.caption,
            "sport_tag": payload.sport_tag,
            "view_count": 0,
            "expires_at": _expiry_iso(),
        },
    )


async def mark_viewed(story_id: str, viewer_id: str):
    existing = db.list_documents(
        DB_ID, settings.collection_story_views,
        queries=[Q.equal("story_id", story_id), Q.equal("viewer_id", viewer_id), Q.limit(1)],
    )
    if not existing.get("documents"):
        db.create_document(DB_ID, settings.collection_story_views, ID.unique(),
                           { "created_at": now_iso(),"story_id": story_id, "viewer_id": viewer_id})
        try:
            s = db.get_document(DB_ID, settings.collection_stories, story_id)
            db.update_document(DB_ID, settings.collection_stories, story_id,
                               {"view_count": s.get("view_count", 0) + 1})
        except Exception:
            pass


async def delete(story_id: str, user_id: str):
    doc = db.get_document(DB_ID, settings.collection_stories, story_id)
    if doc.get("author_id") != user_id:
        raise PermissionError("You can only delete your own stories")
    db.delete_document(DB_ID, settings.collection_stories, story_id)


async def get_viewers(story_id: str, owner_id: str) -> dict:
    doc = db.get_document(DB_ID, settings.collection_stories, story_id)
    if doc.get("author_id") != owner_id:
        raise PermissionError("Only the story owner can see viewers")
    return db.list_documents(
        DB_ID, settings.collection_story_views,
        queries=[Q.equal("story_id", story_id), Q.limit(200)],
    )
