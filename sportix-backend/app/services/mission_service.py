from appwrite.query import Query as Q
from appwrite.id import ID
from app.core.appwrite import db, DB_ID
from app.core.config import settings
from datetime import datetime, timezone, date


def _today() -> str:
    return date.today().isoformat()


DAILY_MISSIONS_TEMPLATE = [
    {"key": "post_update",   "title": "Share Your Day",      "description": "Post a training update",   "reward_coins": 10, "reward_pulse": 2.0},
    {"key": "view_feed",     "title": "Scout the Feed",      "description": "Browse 10 posts",          "reward_coins": 5,  "reward_pulse": 1.0},
    {"key": "join_event",    "title": "Event Ready",         "description": "Register for an event",    "reward_coins": 20, "reward_pulse": 5.0},
    {"key": "update_stats",  "title": "Stat Tracker",        "description": "Submit match stats",       "reward_coins": 15, "reward_pulse": 4.0},
    {"key": "follow_player", "title": "Grow Your Network",   "description": "Follow a new player",      "reward_coins": 5,  "reward_pulse": 1.0},
]


async def get_today(user_id: str) -> dict:
    today = _today()
    res = db.list_documents(
        DB_ID, settings.collection_user_missions,
        queries=[Q.equal("userId", user_id), Q.equal("date", today), Q.limit(10)],
    )
    if res.get("documents"):
        return res
    # Seed today's missions for this user
    missions = []
    for template in DAILY_MISSIONS_TEMPLATE:
        doc = db.create_document(
            DB_ID, settings.collection_user_missions, ID.unique(),
            data={
                "userId": user_id,
                "date": today,
                "missionKey": template["key"],
                "title": template["title"],
                "description": template["description"],
                "rewardCoins": template["reward_coins"],
                "rewardPulse": template["reward_pulse"],
                "isCompleted": False,
                "isClaimed": False,
            },
        )
        missions.append(doc)
    return {"documents": missions, "total": len(missions)}


async def claim(mission_id: str, user_id: str) -> dict:
    doc = db.get_document(DB_ID, settings.collection_user_missions, mission_id)
    if doc.get("userId") != user_id:
        raise PermissionError("Not your mission")
    if not doc.get("isCompleted"):
        raise ValueError("Mission not yet completed")
    if doc.get("isClaimed"):
        raise ValueError("Already claimed")
    updated = db.update_document(DB_ID, settings.collection_user_missions, mission_id,
                                 {"isClaimed": True})
    # Award coins and pulse
    from app.services import coins_service, pulse_service
    await coins_service.award(user_id, doc.get("rewardCoins", 0), f"Mission: {doc.get('title')}")
    await pulse_service.award_pulse(user_id, "mission", doc.get("rewardPulse", 0), doc.get("title"))
    # Update streak
    await _update_streak(user_id)
    return updated


async def get_history(user_id: str) -> dict:
    return db.list_documents(
        DB_ID, settings.collection_user_missions,
        queries=[Q.equal("userId", user_id), Q.equal("isClaimed", True),
                 Q.limit(50), Q.order_desc("$createdAt")],
    )


async def get_streak(user_id: str) -> dict:
    res = db.list_documents(
        DB_ID, settings.collection_user_streaks,
        queries=[Q.equal("userId", user_id), Q.limit(1)],
    )
    if res.get("documents"):
        return res["documents"][0]
    return {"userId": user_id, "currentStreak": 0, "longestStreak": 0}


async def get_weekly(user_id: str) -> dict:
    res = db.list_documents(
        DB_ID, settings.collection_user_missions,
        queries=[Q.equal("userId", user_id), Q.limit(35), Q.order_desc("date")],
    )
    docs = res.get("documents", [])
    completed = sum(1 for d in docs if d.get("isClaimed"))
    return {"total": len(docs), "completed": completed, "completion_rate": round(completed / max(1, len(docs)) * 100)}


async def _update_streak(user_id: str):
    res = db.list_documents(
        DB_ID, settings.collection_user_streaks,
        queries=[Q.equal("userId", user_id), Q.limit(1)],
    )
    today = _today()
    if res.get("documents"):
        doc = res["documents"][0]
        last = doc.get("lastActiveDate")
        current = doc.get("currentStreak", 0)
        longest = doc.get("longestStreak", 0)
        if last == today:
            return
        current += 1
        db.update_document(DB_ID, settings.collection_user_streaks, doc["$id"], {
            "currentStreak": current,
            "longestStreak": max(longest, current),
            "lastActiveDate": today,
        })
    else:
        db.create_document(DB_ID, settings.collection_user_streaks, ID.unique(), {
            "userId": user_id, "currentStreak": 1, "longestStreak": 1, "lastActiveDate": today,
        })
