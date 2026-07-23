from appwrite.query import Query as Q
from appwrite.id import ID
from app.core.appwrite import db, DB_ID
from app.core.config import settings
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
        queries=[Q.equal("followerId", user_id), Q.limit(200)],
    )
    ids = [doc["followingId"] for doc in following_res.get("documents", [])]
    ids.append(user_id)

    queries = [Q.order_desc("$createdAt"), Q.limit(200)]
    if ids:
        queries.append(Q.equal("authorId", ids))

    res = db.list_documents(DB_ID, settings.collection_stories, queries=queries)
    # Filter expired stories
    now = datetime.now(timezone.utc)
    active = [
        s for s in res.get("documents", [])
        if s.get("expiresAt") and datetime.fromisoformat(s["expiresAt"].replace("Z", "+00:00")) > now
    ]
    return {"documents": active, "total": len(active)}


async def create(user_id: str, payload: StoryCreate) -> dict:
    return db.create_document(
        DB_ID, settings.collection_stories, ID.unique(),
        data={
            "authorId": user_id,
            "mediaUrl": payload.media_url,
            "mediaType": payload.media_type,
            "caption": payload.caption,
            "sportTag": payload.sport_tag,
            "viewsCount": 0,
            "expiresAt": _expiry_iso(),
        },
    )


async def mark_viewed(story_id: str, viewer_id: str):
    existing = db.list_documents(
        DB_ID, settings.collection_story_views,
        queries=[Q.equal("storyId", story_id), Q.equal("viewerId", viewer_id), Q.limit(1)],
    )
    if not existing.get("documents"):
        db.create_document(DB_ID, settings.collection_story_views, ID.unique(),
                           {"storyId": story_id, "viewerId": viewer_id})
        try:
            s = db.get_document(DB_ID, settings.collection_stories, story_id)
            db.update_document(DB_ID, settings.collection_stories, story_id,
                               {"viewsCount": s.get("viewsCount", 0) + 1})
        except Exception:
            pass


async def delete(story_id: str, user_id: str):
    doc = db.get_document(DB_ID, settings.collection_stories, story_id)
    if doc.get("authorId") != user_id:
        raise PermissionError("You can only delete your own stories")
    db.delete_document(DB_ID, settings.collection_stories, story_id)


async def get_viewers(story_id: str, owner_id: str) -> dict:
    doc = db.get_document(DB_ID, settings.collection_stories, story_id)
    if doc.get("authorId") != owner_id:
        raise PermissionError("Only the story owner can see viewers")
    return db.list_documents(
        DB_ID, settings.collection_story_views,
        queries=[Q.equal("storyId", story_id), Q.limit(200)],
    )
