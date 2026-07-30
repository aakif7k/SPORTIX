import logging
from appwrite.id import ID
from appwrite.exception import AppwriteException
from appwrite.query import Query
from app.core.appwrite import db
from app.core.config import settings
from datetime import datetime, timezone

DB = settings.appwrite_database_id
POSTS = settings.collection_posts
USERS = settings.collection_users

logger = logging.getLogger(__name__)

def get_user_info(user_id: str) -> dict:
    """
    Author fields to denormalise onto a post.

    A profiles document id IS the Appwrite auth user $id, so this is a direct
    get_document. It previously queried Query.equal("auth_uid", ...) against an
    attribute that only one of the two profile writers ever set, so the lookup
    found nothing and every post was stored with just {author_id} -- no username,
    no avatar, no sport.
    """
    try:
        u = db.get_document(DB, USERS, user_id)
        return {
            "author_id": user_id,
            "author_username": u.get("username", ""),
            "author_full_name": u.get("full_name", ""),
            "author_avatar_url": u.get("avatar_url"),
            "author_sport": u.get("sport", ""),
            "author_level": u.get("level", 1),
        }
    except AppwriteException:
        # No profile yet (a brand-new OAuth user). The post is still valid; it
        # just carries no denormalised author fields.
        logger.warning("no profile document for %s; post will lack author fields", user_id)
        return {"author_id": user_id}

async def create(user_id: str, payload) -> dict:
    user_info = get_user_info(user_id)

    doc = db.create_document(
        DB, POSTS,
        document_id=ID.unique(),
        data={
            **user_info,
            "content": payload.content,
            "media_urls": payload.media_urls or [],
            "media_type": payload.media_type or "none",
            "post_type": payload.post_type or "general",
            "sport_tag": payload.sport_tag,
            "location_tag": payload.location_tag,
            "likes_count": 0,
            "comments_count": 0,
            "shares_count": 0,
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    return doc

async def get_feed(
    user_id: str,
    page: int = 0,
    limit: int = 20,
    post_type: str = None,
    sport: str = None
) -> dict:
    queries = [
        Query.equal("is_deleted", [False]),
        Query.order_desc("$createdAt"),
        Query.limit(limit),
        Query.offset(page * limit),
    ]
    if post_type:
        queries.append(Query.equal("post_type", [post_type]))
    if sport:
        queries.append(Query.equal("sport_tag", [sport]))

    result = db.list_documents(DB, POSTS, queries=queries)
    return {
        "posts": result["documents"],
        "total": result["total"],
        "page": page,
        "limit": limit,
        "has_more": (page + 1) * limit < result["total"],
    }

async def get_by_user(
    author_id: str,
    page: int = 0,
    limit: int = 20
) -> dict:
    queries = [
        Query.equal("author_id", [author_id]),
        Query.equal("is_deleted", [False]),
        Query.order_desc("$createdAt"),
        Query.limit(limit),
        Query.offset(page * limit),
    ]
    result = db.list_documents(DB, POSTS, queries=queries)
    return {
        "posts": result["documents"],
        "total": result["total"],
    }

async def get_by_id(post_id: str, viewer_id: str = None) -> dict:
    doc = db.get_document(DB, POSTS, post_id)
    if doc.get("is_deleted"):
        from fastapi import HTTPException
        raise HTTPException(404, "Post not found")
    return doc

async def update(
    post_id: str, user_id: str, payload
) -> dict:
    doc = db.get_document(DB, POSTS, post_id)
    if doc.get("author_id") != user_id:
        from fastapi import HTTPException
        raise HTTPException(403, "Not your post")

    updates = {}
    if payload.content is not None:
        updates["content"] = payload.content
    if payload.sport_tag is not None:
        updates["sport_tag"] = payload.sport_tag
    if payload.location_tag is not None:
        updates["location_tag"] = payload.location_tag

    return db.update_document(DB, POSTS, post_id, updates)

async def delete(post_id: str, user_id: str):
    doc = db.get_document(DB, POSTS, post_id)
    if doc.get("author_id") != user_id:
        from fastapi import HTTPException
        raise HTTPException(403, "Not your post")
    db.update_document(DB, POSTS, post_id, {"is_deleted": True})

async def toggle_like(post_id: str, user_id: str) -> dict:
    LIKES = settings.collection_post_likes if hasattr(
        settings, 'collection_post_likes'
    ) else "post_likes"

    # Check if already liked
    try:
        existing = db.list_documents(
            DB, LIKES,
            queries=[
                Query.equal("post_id", [post_id]),
                Query.equal("user_id", [user_id]),
            ]
        )
        if existing["documents"]:
            # Unlike
            db.delete_document(
                DB, LIKES, existing["documents"][0]["$id"]
            )
            post = db.get_document(DB, POSTS, post_id)
            new_count = max(0, post.get("likes_count", 0) - 1)
            db.update_document(
                DB, POSTS, post_id, {"likes_count": new_count}
            )
            return {"liked": False, "likes_count": new_count}
        else:
            # Like
            db.create_document(
                DB, LIKES,
                document_id=ID.unique(),
                data={
                    "post_id": post_id,
                    "user_id": user_id,
                    "created_at":
                        datetime.now(timezone.utc).isoformat(),
                }
            )
            post = db.get_document(DB, POSTS, post_id)
            new_count = post.get("likes_count", 0) + 1
            db.update_document(
                DB, POSTS, post_id, {"likes_count": new_count}
            )
            return {"liked": True, "likes_count": new_count}
    except Exception as e:
        raise ValueError(f"Like failed: {str(e)}")

async def get_comments(post_id: str, page: int = 0) -> dict:
    COMMENTS = "comments"
    result = db.list_documents(
        DB, COMMENTS,
        queries=[
            Query.equal("post_id", [post_id]),
            Query.equal("is_deleted", [False]),
            Query.order_asc("$createdAt"),
            Query.limit(50),
            Query.offset(page * 50),
        ]
    )
    return {"comments": result["documents"]}

async def add_comment(
    post_id: str, user_id: str, content: str
) -> dict:
    COMMENTS = "comments"
    user_info = get_user_info(user_id)

    doc = db.create_document(
        DB, COMMENTS,
        document_id=ID.unique(),
        data={
            "post_id": post_id,
            "author_id": user_id,
            "author_username": user_info.get(
                "author_username", ""
            ),
            "author_avatar_url": user_info.get(
                "author_avatar_url"
            ),
            "content": content.strip(),
            "is_deleted": False,
            "created_at":
                datetime.now(timezone.utc).isoformat(),
        }
    )

    # Increment comment count on post
    try:
        post = db.get_document(DB, POSTS, post_id)
        new_count = post.get("comments_count", 0) + 1
        db.update_document(
            DB, POSTS, post_id,
            {"comments_count": new_count}
        )
    except:
        pass

    return doc

async def delete_comment(comment_id: str, user_id: str):
    COMMENTS = "comments"
    doc = db.get_document(DB, COMMENTS, comment_id)
    if doc.get("author_id") != user_id:
        from fastapi import HTTPException
        raise HTTPException(403, "Not your comment")
    db.update_document(
        DB, COMMENTS, comment_id, {"is_deleted": True}
    )