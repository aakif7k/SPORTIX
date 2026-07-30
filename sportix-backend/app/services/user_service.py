from appwrite.query import Query as Q
from appwrite.id import ID
from app.core.appwrite import db, DB_ID
from app.core.config import settings
from app.schemas.user import UserUpdate
from typing import Optional


async def get_full_profile(user_id: str) -> dict:
    try:
        return db.get_document(DB_ID, settings.collection_users, user_id)
    except Exception:
        raise FileNotFoundError(f"Profile not found: {user_id}")


async def get_by_username(username: str, viewer_id: str) -> dict:
    res = db.list_documents(
        DB_ID, settings.collection_users,
        queries=[Q.equal("username", username), Q.limit(1)],
    )
    docs = res.get("documents", [])
    if not docs:
        raise FileNotFoundError(f"User @{username} not found")
    profile = docs[0]
    # Attach follow status
    profile["is_following"] = _check_following(viewer_id, profile["$id"])
    return profile


async def update_profile(user_id: str, payload: UserUpdate) -> dict:
    data = payload.model_dump(exclude_none=True)
    return db.update_document(DB_ID, settings.collection_users, user_id, data)


async def get_profile_stats(user_id: str) -> dict:
    profile = await get_full_profile(user_id)
    return {
        "followers_count": profile.get("followers_count", 0),
        "following_count": profile.get("following_count", 0),
        "posts_count": profile.get("posts_count", 0),
    }


async def get_complete_profile(user_id: str) -> dict:
    from app.services import pulse_service
    profile = await get_full_profile(user_id)
    try:
        pulse = await pulse_service.get_pulse(user_id)
    except Exception:
        pulse = {}
    try:
        level = await pulse_service.get_level(user_id)
    except Exception:
        level = {}
    profile["pulse"] = pulse
    profile["level_data"] = level
    return profile


async def search_users(
    q: Optional[str] = None,
    sport: Optional[str] = None,
    role: Optional[str] = None,
    experience_level: Optional[str] = None,
    city: Optional[str] = None,
    is_open_to_recruit: Optional[bool] = None,
    page: int = 0,
    limit: int = 20,
) -> dict:
    queries = [Q.limit(limit), Q.offset(page * limit)]
    if q:
        queries.append(Q.search("username", q))
    if sport:
        queries.append(Q.equal("sport", sport))
    if role:
        queries.append(Q.equal("role", role))
    if experience_level:
        queries.append(Q.equal("experience_level", experience_level))
    if city:
        queries.append(Q.equal("city", city))
    if is_open_to_recruit is not None:
        queries.append(Q.equal("is_open_to_recruit", is_open_to_recruit))
    return db.list_documents(DB_ID, settings.collection_users, queries=queries)


async def get_suggested(user_id: str, limit: int = 10) -> dict:
    """Suggest users with similar sport/role that are not yet followed."""
    return db.list_documents(
        DB_ID, settings.collection_users,
        queries=[Q.not_equal("$id", user_id), Q.limit(limit), Q.order_desc("followers_count")],
    )


async def follow(follower_id: str, target_id: str):
    if follower_id == target_id:
        raise ValueError("Cannot follow yourself")
    # Create follower document
    db.create_document(DB_ID, settings.collection_followers, ID.unique(), {
        "follower_id": follower_id,
        "following_id": target_id,
    })
    # Increment counters
    _increment_count(follower_id, "following_count", 1)
    _increment_count(target_id, "followers_count", 1)


async def unfollow(follower_id: str, target_id: str):
    res = db.list_documents(
        DB_ID, settings.collection_followers,
        queries=[Q.equal("follower_id", follower_id), Q.equal("following_id", target_id), Q.limit(1)],
    )
    for doc in res.get("documents", []):
        db.delete_document(DB_ID, settings.collection_followers, doc["$id"])
    _increment_count(follower_id, "following_count", -1)
    _increment_count(target_id, "followers_count", -1)


async def get_followers(user_id: str, page: int = 0) -> dict:
    return db.list_documents(
        DB_ID, settings.collection_followers,
        queries=[Q.equal("following_id", user_id), Q.limit(20), Q.offset(page * 20)],
    )


async def get_following(user_id: str, page: int = 0) -> dict:
    return db.list_documents(
        DB_ID, settings.collection_followers,
        queries=[Q.equal("follower_id", user_id), Q.limit(20), Q.offset(page * 20)],
    )


async def get_settings(user_id: str) -> dict:
    profile = await get_full_profile(user_id)
    return {
        "notification_prefs": profile.get("notification_prefs", {}),
        "privacy": profile.get("privacy", {}),
        "sport_preferences": profile.get("sport_preferences", {}),
    }


async def update_settings(user_id: str, data: dict) -> dict:
    return db.update_document(DB_ID, settings.collection_users, user_id, data)


def _check_following(follower_id: str, target_id: str) -> bool:
    try:
        res = db.list_documents(
            DB_ID, settings.collection_followers,
            queries=[Q.equal("follower_id", follower_id), Q.equal("following_id", target_id), Q.limit(1)],
        )
        return len(res.get("documents", [])) > 0
    except Exception:
        return False


def _increment_count(user_id: str, field: str, delta: int):
    try:
        doc = db.get_document(DB_ID, settings.collection_users, user_id)
        current = doc.get(field, 0)
        db.update_document(DB_ID, settings.collection_users, user_id, {field: max(0, current + delta)})
    except Exception:
        pass
