from appwrite.query import Query as Q
from appwrite.id import ID
from app.core.appwrite import db, DB_ID
from app.core.config import settings

# Badge catalog — in production these would live in the badges collection
BADGE_CATALOG = [
    {"key": "first_post",      "name": "First Post",       "description": "Shared your first update",    "icon": "📝", "category": "social"},
    {"key": "team_player",     "name": "Team Player",      "description": "Joined your first squad",     "icon": "🤝", "category": "squad"},
    {"key": "event_warrior",   "name": "Event Warrior",    "description": "Registered for 3 events",     "icon": "⚔️", "category": "event"},
    {"key": "streak_7",        "name": "7-Day Streak",     "description": "Active 7 days in a row",      "icon": "🔥", "category": "streak"},
    {"key": "streak_30",       "name": "Month Legend",     "description": "Active 30 days in a row",     "icon": "👑", "category": "streak"},
    {"key": "stat_master",     "name": "Stat Master",      "description": "10 validated stat reports",   "icon": "📊", "category": "match"},
    {"key": "social_100",      "name": "Connected",        "description": "100 followers",                "icon": "🌟", "category": "social"},
    {"key": "pulse_500",       "name": "High Pulse",       "description": "Reached 500 Pulse score",     "icon": "⚡", "category": "pulse"},
    {"key": "mvp",             "name": "MVP",              "description": "Earned MVP in a match",       "icon": "🏆", "category": "match"},
]


async def get_all() -> dict:
    return {"documents": BADGE_CATALOG, "total": len(BADGE_CATALOG)}


async def get_user_badges(user_id: str) -> dict:
    return db.list_documents(
        DB_ID, settings.collection_user_badges,
        queries=[Q.equal("userId", user_id), Q.order_desc("$createdAt"), Q.limit(50)],
    )


async def get_recent(user_id: str) -> dict:
    return db.list_documents(
        DB_ID, settings.collection_user_badges,
        queries=[Q.equal("userId", user_id), Q.order_desc("$createdAt"), Q.limit(5)],
    )


async def award_badge(user_id: str, badge_key: str) -> dict:
    """Award a badge if user doesn't already have it."""
    existing = db.list_documents(
        DB_ID, settings.collection_user_badges,
        queries=[Q.equal("userId", user_id), Q.equal("badgeKey", badge_key), Q.limit(1)],
    )
    if existing.get("documents"):
        return existing["documents"][0]  # already awarded
    badge_info = next((b for b in BADGE_CATALOG if b["key"] == badge_key), {})
    return db.create_document(
        DB_ID, settings.collection_user_badges, ID.unique(),
        data={
            "userId": user_id,
            "badgeKey": badge_key,
            "name": badge_info.get("name", badge_key),
            "description": badge_info.get("description", ""),
            "icon": badge_info.get("icon", "🏅"),
            "category": badge_info.get("category", "general"),
        },
    )
