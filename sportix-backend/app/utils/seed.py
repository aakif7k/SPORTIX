"""
Seed script — run once to seed the badges collection in Appwrite.
Usage: python -m app.utils.seed
"""
from app.core.appwrite import db, DB_ID
from app.core.config import settings
from appwrite.id import ID

BADGES = [
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

DAILY_MISSIONS = [
    {"key": "post_update",   "title": "Share Your Day",    "description": "Post a training update",   "rewardCoins": 10, "rewardPulse": 2.0, "category": "social"},
    {"key": "view_feed",     "title": "Scout the Feed",    "description": "Browse 10 posts",          "rewardCoins": 5,  "rewardPulse": 1.0, "category": "social"},
    {"key": "join_event",    "title": "Event Ready",       "description": "Register for an event",    "rewardCoins": 20, "rewardPulse": 5.0, "category": "event"},
    {"key": "update_stats",  "title": "Stat Tracker",      "description": "Submit match stats",       "rewardCoins": 15, "rewardPulse": 4.0, "category": "match"},
    {"key": "follow_player", "title": "Grow Your Network", "description": "Follow a new player",      "rewardCoins": 5,  "rewardPulse": 1.0, "category": "social"},
]


def seed_badges():
    print("Seeding badges...")
    for badge in BADGES:
        try:
            db.create_document(DB_ID, settings.collection_badges, ID.unique(), badge)
            print(f"  ✓ {badge['name']}")
        except Exception as e:
            print(f"  ✗ {badge['name']}: {e}")


def seed_missions():
    print("Seeding daily mission templates...")
    for m in DAILY_MISSIONS:
        try:
            db.create_document(DB_ID, settings.collection_daily_missions, ID.unique(), m)
            print(f"  ✓ {m['title']}")
        except Exception as e:
            print(f"  ✗ {m['title']}: {e}")


if __name__ == "__main__":
    seed_badges()
    seed_missions()
    print("Seeding complete.")
