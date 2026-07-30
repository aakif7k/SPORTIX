from appwrite.query import Query as Q
from appwrite.id import ID
from app.core.appwrite import db, DB_ID
from app.core.config import settings
from app.utils.formatters import now_iso
from app.schemas.post import ReelCreate
from typing import Optional


async def get_feed(user_id: str, page: int, sport: Optional[str]) -> dict:
    queries = [Q.limit(20), Q.offset(page * 20), Q.order_desc("$createdAt")]
    if sport:
        queries.append(Q.equal("sport_tag", sport))
    return db.list_documents(DB_ID, settings.collection_reels, queries=queries)


async def create(user_id: str, payload: ReelCreate) -> dict:
    return db.create_document(
        DB_ID, settings.collection_reels, ID.unique(),
        data={
            "created_at": now_iso(),
            "author_id": user_id,
            "video_url": payload.video_url,
            "thumbnail_url": payload.thumbnail_url,
            "caption": payload.caption,
            "sport_tag": payload.sport_tag,
            "duration_seconds": payload.duration_seconds,
            "likes_count": 0,
            "views_count": 0,
        },
    )


async def get_by_id(reel_id: str, viewer_id: str) -> dict:
    doc = db.get_document(DB_ID, settings.collection_reels, reel_id)
    doc["is_liked"] = _check_liked(reel_id, viewer_id)
    return doc


async def get_by_user(user_id: str, page: int) -> dict:
    return db.list_documents(
        DB_ID, settings.collection_reels,
        queries=[Q.equal("author_id", user_id), Q.limit(20), Q.offset(page * 20), Q.order_desc("$createdAt")],
    )


async def delete(reel_id: str, user_id: str):
    doc = db.get_document(DB_ID, settings.collection_reels, reel_id)
    if doc.get("author_id") != user_id:
        raise PermissionError("You can only delete your own reels")
    db.delete_document(DB_ID, settings.collection_reels, reel_id)


async def toggle_like(reel_id: str, user_id: str) -> dict:
    existing = db.list_documents(
        DB_ID, settings.collection_reel_likes,
        queries=[Q.equal("reel_id", reel_id), Q.equal("user_id", user_id), Q.limit(1)],
    )
    if existing.get("documents"):
        db.delete_document(DB_ID, settings.collection_reel_likes, existing["documents"][0]["$id"])
        _bump_count(reel_id, "likes_count", -1)
        return {"liked": False}
    else:
        db.create_document(DB_ID, settings.collection_reel_likes, ID.unique(),
                           { "created_at": now_iso(),"reel_id": reel_id, "user_id": user_id})
        _bump_count(reel_id, "likes_count", 1)
        return {"liked": True}


def _check_liked(reel_id: str, user_id: str) -> bool:
    try:
        res = db.list_documents(
            DB_ID, settings.collection_reel_likes,
            queries=[Q.equal("reel_id", reel_id), Q.equal("user_id", user_id), Q.limit(1)],
        )
        return len(res.get("documents", [])) > 0
    except Exception:
        return False


def _bump_count(reel_id: str, field: str, delta: int):
    try:
        r = db.get_document(DB_ID, settings.collection_reels, reel_id)
        db.update_document(DB_ID, settings.collection_reels, reel_id,
                           {field: max(0, r.get(field, 0) + delta)})
    except Exception:
        pass
