"""
Seed reference data into Appwrite.

    python -m app.utils.seed            # badges + daily mission templates
    python -m app.utils.seed --demo     # ...plus demo content so the UI renders

Idempotent: every document uses a deterministic id derived from its natural key,
so a second run reports `[=] exists` and creates no duplicates.

Output is ASCII-only. The previous version printed check-mark characters, which
raises UnicodeEncodeError on the cp1252 Windows console this runs on; badge
icons are emoji and are therefore stored but never echoed.
"""
from __future__ import annotations

import argparse
import sys
from datetime import datetime, timedelta, timezone

from appwrite.exception import AppwriteException
from appwrite.query import Query

from app.core.appwrite import db, DB_ID
from app.core.config import settings

created = existed = failed = 0


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _ago(**kw) -> str:
    return (datetime.now(timezone.utc) - timedelta(**kw)).isoformat()


def _ahead(**kw) -> str:
    return (datetime.now(timezone.utc) + timedelta(**kw)).isoformat()


def put(collection: str, doc_id: str, data: dict, label: str) -> None:
    """Create a document under a deterministic id; report if it already exists."""
    global created, existed, failed
    try:
        db.create_document(DB_ID, collection, doc_id, data)
        created += 1
        print(f"  [+] {label}")
    except AppwriteException as e:
        if getattr(e, "code", 0) == 409:
            existed += 1
            print(f"  [=] {label}")
        else:
            failed += 1
            print(f"  [x] {label}: {e.message}")


# ── Reference data ────────────────────────────────────────────────────────────
BADGES = [
    {"key": "first_post",    "name": "First Post",    "description": "Shared your first update",  "icon": "\U0001F4DD", "category": "social", "rarity": "common"},
    {"key": "team_player",   "name": "Team Player",   "description": "Joined your first squad",   "icon": "\U0001F91D", "category": "squad",  "rarity": "common"},
    {"key": "event_warrior", "name": "Event Warrior", "description": "Registered for 3 events",   "icon": "⚔️", "category": "event",  "rarity": "rare"},
    {"key": "streak_7",      "name": "7-Day Streak",  "description": "Active 7 days in a row",    "icon": "\U0001F525", "category": "streak", "rarity": "rare"},
    {"key": "streak_30",     "name": "Month Legend",  "description": "Active 30 days in a row",   "icon": "\U0001F451", "category": "streak", "rarity": "epic"},
    {"key": "stat_master",   "name": "Stat Master",   "description": "10 validated stat reports", "icon": "\U0001F4CA", "category": "match",  "rarity": "epic"},
    {"key": "social_100",    "name": "Connected",     "description": "100 followers",             "icon": "\U0001F31F", "category": "social", "rarity": "rare"},
    {"key": "pulse_500",     "name": "High Pulse",    "description": "Reached 500 Pulse score",   "icon": "⚡",     "category": "pulse",  "rarity": "legendary"},
    {"key": "mvp",           "name": "MVP",           "description": "Earned MVP in a match",     "icon": "\U0001F3C6", "category": "match",  "rarity": "legendary"},
]

DAILY_MISSIONS = [
    {"key": "post_update",   "title": "Share Your Day",    "description": "Post a training update", "reward_coins": 10, "reward_pulse": 2.0, "category": "social", "target_count": 1},
    {"key": "view_feed",     "title": "Scout the Feed",    "description": "Browse 10 posts",        "reward_coins": 5,  "reward_pulse": 1.0, "category": "social", "target_count": 10},
    {"key": "join_event",    "title": "Event Ready",       "description": "Register for an event",  "reward_coins": 20, "reward_pulse": 5.0, "category": "event",  "target_count": 1},
    {"key": "update_stats",  "title": "Stat Tracker",      "description": "Submit match stats",     "reward_coins": 15, "reward_pulse": 4.0, "category": "match",  "target_count": 1},
    {"key": "follow_player", "title": "Grow Your Network", "description": "Follow a new player",    "reward_coins": 5,  "reward_pulse": 1.0, "category": "social", "target_count": 1},
]


def seed_badges() -> None:
    print(f"Badges ({len(BADGES)})")
    for b in BADGES:
        put(settings.collection_badges, b["key"], {**b, "created_at": _now()}, b["name"])


def seed_missions() -> None:
    print(f"Daily mission templates ({len(DAILY_MISSIONS)})")
    for m in DAILY_MISSIONS:
        put(settings.collection_daily_missions, m["key"],
            {**m, "is_active": True, "created_at": _now()}, m["title"])


# ── Demo content ──────────────────────────────────────────────────────────────
# NOTE: these profiles have no corresponding Appwrite *auth* user, so they
# cannot be signed in as. They exist only so feeds, discovery and squad screens
# have something to render. Register a real account to log in.
DEMO_PEOPLE = [
    ("Marcus Thielemann", "marcus_thiel", "Football",   "Striker",     "Berlin",     "pro"),
    ("Priya Krishnamurthy", "priya_t",    "Tennis",     "Singles",     "Chennai",    "semi_pro"),
    ("DeShawn Williams",  "deshawn_w",    "Basketball", "Point Guard", "Atlanta",    "pro"),
    ("Aisha Mensah",      "aisha_m",      "Football",   "Winger",      "Accra",      "semi_pro"),
    ("Zaid Al-Hassan",    "zaid_ah",      "Football",   "Midfielder",  "Dubai",      "pro"),
    ("Devon Clarke",      "devon_c",      "Football",   "Centre Back", "London",     "amateur"),
    ("Lena Novak",        "lena_nv",      "Volleyball", "Setter",      "Prague",     "semi_pro"),
    ("Rahul Iyer",        "rahul_iyer",   "Cricket",    "All-rounder", "Mumbai",     "pro"),
    ("Sofia Marchetti",   "sofia_m",      "Running",    "5000m",       "Milan",      "elite"),
    ("Kwame Boateng",     "kwame_b",      "Basketball", "Center",      "Kumasi",     "amateur"),
    ("Yuki Tanaka",       "yuki_t",       "Badminton",  "Doubles",     "Osaka",      "semi_pro"),
    ("Elena Petrova",     "elena_p",      "Swimming",   "Freestyle",   "Sofia",      "elite"),
]

DEMO_POST_TEXT = [
    ("Wrapped a 3-hour tactical session. Covering 37% more pressing zones this season.", "training", "highlights"),
    ("Serve speed up to 198 km/h, return accuracy 84%. Peaking at the right time.", "highlights", None),
    ("28 points, 11 assists, 9 rebounds. One bucket off a triple-double.", "achievements", None),
    ("Recovery day. Mobility work and film study only.", "training", None),
    ("New personal best in the 5k time trial this morning.", "achievements", None),
    ("Squad chemistry is clicking. Third clean sheet in a row.", "general", None),
    ("Looking for a keeper for Sunday's 7-a-side. Berlin area.", "general", None),
    ("Bowling figures: 4 overs, 2 maidens, 3 wickets for 11.", "achievements", None),
    ("Set-piece drills all week. Delivery is finally consistent.", "training", None),
    ("Match highlights from the semi-final are up.", "highlights", None),
]

DEMO_EVENTS = [
    ("City Football League Semis", "Football",   "tournament", "pro",      "Metropolitan Arena", "Berlin", 22, 3),
    ("Midnight 3v3 Tournament",    "Basketball", "tournament", "semi_pro", "Neon Street Court",  "Atlanta", 12, 5),
    ("Sunset Cricket Clash",       "Cricket",    "team",       "amateur",  "Heritage Oval",      "Mumbai", 22, 7),
    ("Open Tennis Ladder",         "Tennis",     "solo",       "amateur",  "Riverside Courts",   "Chennai", 16, 10),
    ("Coastal 10K Road Race",      "Running",    "solo",       "elite",    "Harbour Front",      "Milan", 200, 14),
    ("Winter Volleyball Cup",      "Volleyball", "league",     "semi_pro", "Central Sports Hall", "Prague", 48, 21),
]

DEMO_SQUADS = [
    ("Iron Pulse FC",   "Football",   "4-3-3", 88.0),
    ("Neon Falcons",    "Basketball", "Motion", 82.5),
    ("Heritage XI",     "Cricket",    "Balanced", 76.0),
]

DEMO_TOURNAMENTS = [
    ("Continental Knockout", "Football",   "knockout",        "registering", 16),
    ("City Hoops League",    "Basketball", "group_knockout",  "in_progress", 8),
]


def seed_demo() -> None:
    print(f"\nDemo profiles ({len(DEMO_PEOPLE)})")
    for i, (name, username, sport, position, city, level) in enumerate(DEMO_PEOPLE, 1):
        uid = f"demo_user_{i:02d}"
        put(settings.collection_users, uid, {
            "full_name": name, "username": username, "email": f"{username}@demo.sportix.app",
            "role": "athlete", "sport": sport, "sports": [sport], "position": position,
            "experience_level": level, "location": city, "city": city,
            "avatar_url": f"https://i.pravatar.cc/240?u={username}",
            "bio": f"{position} playing {sport} out of {city}.",
            "is_open_to_recruit": i % 3 == 0, "is_verified": i % 4 == 0,
            "is_active": True, "is_onboarding_complete": True,
            "pulse_score": 100.0 + i * 37.5, "level": 1 + i * 2,
            "coins_balance": i * 25, "login_streak": i % 7,
            "followers_count": i * 14, "following_count": i * 9, "posts_count": 0,
            "created_at": _ago(days=90 - i),
        }, f"{name} (@{username})")

    print(f"\nDemo posts ({len(DEMO_POST_TEXT) * 2})")
    for i in range(20):
        text, post_type, _ = DEMO_POST_TEXT[i % len(DEMO_POST_TEXT)]
        author = i % len(DEMO_PEOPLE)
        name, username, sport, _, _, _ = DEMO_PEOPLE[author]
        put(settings.collection_posts, f"demo_post_{i:02d}", {
            "author_id": f"demo_user_{author + 1:02d}",
            "author_username": username, "author_full_name": name,
            "author_avatar_url": f"https://i.pravatar.cc/240?u={username}",
            "author_sport": sport, "author_level": 1 + author * 2,
            "content": text, "media_urls": [], "media_file_ids": [],
            "media_type": "none", "post_type": post_type, "sport_tag": sport,
            "likes_count": (i * 7) % 130, "comments_count": (i * 3) % 24, "shares_count": i % 5,
            "is_deleted": False, "created_at": _ago(hours=i * 5 + 1),
        }, f"post {i:02d} by @{username}")

    print(f"\nDemo events ({len(DEMO_EVENTS)})")
    for i, (title, sport, fmt, skill, venue, city, cap, days) in enumerate(DEMO_EVENTS, 1):
        put(settings.collection_events, f"demo_event_{i:02d}", {
            "title": title, "sport": sport, "format": fmt, "skill_level": skill,
            "description": f"{title} -- {sport} at {venue}, {city}.",
            "organizer_id": f"demo_user_{i:02d}",
            "venue": venue, "location": f"{venue}, {city}", "city": city,
            "starts_at": _ahead(days=days), "ends_at": _ahead(days=days, hours=6),
            "max_participants": cap, "current_participants": max(0, cap // 3),
            "status": "upcoming", "prize_pool": f"{i * 500} credits", "entry_fee": "Free",
            "rules": ["Bring your own kit", "Arrive 30 minutes early"],
            "tags": [sport.lower(), skill], "ai_team_available": i % 2 == 0,
            "created_at": _ago(days=i * 2),
        }, title)

    print(f"\nDemo squads ({len(DEMO_SQUADS)})")
    for i, (name, sport, formation, chem) in enumerate(DEMO_SQUADS, 1):
        squad_id = f"demo_squad_{i:02d}"
        captain = f"demo_user_{i:02d}"
        put(settings.collection_squads, squad_id, {
            "name": name, "sport": sport, "captain_id": captain,
            "formation": formation, "tactical_notes": "Press high, transition through the wings.",
            "max_members": 11, "members_count": 4,
            "win_rate": 55.0 + i * 5, "chemistry_score": chem, "pulse_avg": 300.0 + i * 40,
            "trust": chem - 2, "coordination": chem - 5, "communication": chem - 3,
            "matches_played": 10 + i * 4, "wins": 6 + i * 2, "losses": 3, "draws": 1,
            "last_active": _ago(hours=i * 3), "created_at": _ago(days=45 - i),
        }, name)
        # Four members per squad, the first of which is the captain.
        for m in range(4):
            member_uid = f"demo_user_{((i - 1) * 3 + m) % len(DEMO_PEOPLE) + 1:02d}"
            put(settings.collection_squad_members, f"{squad_id}_m{m}", {
                "squad_id": squad_id, "user_id": member_uid,
                "role": "captain" if m == 0 else "member",
                "position": DEMO_PEOPLE[((i - 1) * 3 + m) % len(DEMO_PEOPLE)][3],
                "readiness": "ready", "joined_at": _ago(days=40 - m),
            }, f"  member {member_uid} -> {name}")

    print(f"\nDemo tournaments ({len(DEMO_TOURNAMENTS)})")
    for i, (name, sport, fmt, status, max_squads) in enumerate(DEMO_TOURNAMENTS, 1):
        put(settings.collection_tournaments, f"demo_tournament_{i:02d}", {
            "name": name, "sport": sport, "format": fmt, "status": status,
            "squad_ids": [f"demo_squad_{j:02d}" for j in range(1, 4)],
            "current_round": 0 if status == "registering" else 2,
            "starts_at": _ahead(days=i * 10), "prize_pool": f"{i * 2500} credits",
            "max_squads": max_squads, "created_at": _ago(days=i * 5),
        }, name)


def report_counts(demo: bool) -> int:
    """Prove idempotency: the reference collections must hold exact counts."""
    print("\nDocument counts")
    checks = [
        (settings.collection_badges, "badges", len(BADGES)),
        (settings.collection_daily_missions, "daily_missions", len(DAILY_MISSIONS)),
    ]
    if demo:
        checks += [
            (settings.collection_users, "profiles", None),
            (settings.collection_posts, "posts", None),
            (settings.collection_events, "events", None),
            (settings.collection_squads, "squads", None),
            (settings.collection_squad_members, "squad_members", None),
            (settings.collection_tournaments, "tournaments", None),
        ]

    problems = 0
    for coll, label, expected in checks:
        try:
            total = db.list_documents(DB_ID, coll, [Query.limit(1)])["total"]
        except AppwriteException as e:
            print(f"  [x] {label}: {e.message}")
            problems += 1
            continue
        if expected is not None and total != expected:
            print(f"  [x] {label}: {total} documents, expected exactly {expected}")
            problems += 1
        else:
            print(f"  [=] {label}: {total}")
    return problems


def main() -> int:
    ap = argparse.ArgumentParser(description="Seed SPORTiX reference and demo data (idempotent).")
    ap.add_argument("--demo", action="store_true",
                    help="also seed demo profiles, posts, events, squads and tournaments")
    args = ap.parse_args()

    if settings.appwrite_api_key in ("", "your_api_key_with_all_scopes"):
        print("[x] APPWRITE_API_KEY is unset or still the placeholder in sportix-backend/.env")
        return 2

    seed_badges()
    seed_missions()
    if args.demo:
        seed_demo()

    problems = report_counts(args.demo)

    print(f"\n{'-' * 62}")
    print(f"created {created}   exists {existed}   failed {failed}")
    if failed or problems:
        print("SEED INCOMPLETE -- see [x] lines above")
        return 1
    print("SEED OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
