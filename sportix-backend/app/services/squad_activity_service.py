"""
Squad practice scheduling, the squad feed and squad achievements.

SquadOverview shipped complete UI for all three — scheduling a practice, voting on
whether you can make it, posting to a squad feed, liking those posts, and an
achievements shelf — with no collections and no endpoints behind any of it. The
zustand store faked every one, so nothing survived a refresh and nothing was
visible to another member.

Membership is checked on every call: these are squad-private, and the collections
grant no client write permission, so the server is the only gate.
"""
from __future__ import annotations

import logging

from appwrite.exception import AppwriteException
from appwrite.id import ID
from appwrite.query import Query as Q

from app.core.appwrite import db, DB_ID
from app.core.config import settings
from app.utils.formatters import now_iso

logger = logging.getLogger(__name__)

EVENTS = settings.collection_squad_events
VOTES = settings.collection_squad_event_votes
POSTS = settings.collection_squad_posts
LIKES = settings.collection_squad_post_likes
ACHIEVEMENTS = settings.collection_squad_achievements
MEMBERS = settings.collection_squad_members
SQUADS = settings.collection_squads


# ─── Membership ───────────────────────────────────────────────────────────────
def _member_ids(squad_id: str) -> set[str]:
    rows = db.list_documents(DB_ID, MEMBERS, queries=[
        Q.equal("squad_id", squad_id), Q.limit(100),
    ]).get("documents", [])
    return {r["user_id"] for r in rows if r.get("user_id")}


def _require_member(squad_id: str, user_id: str) -> set[str]:
    members = _member_ids(squad_id)
    if user_id not in members:
        raise PermissionError("Only squad members can do that")
    return members


def _require_captain(squad_id: str, user_id: str) -> None:
    squad = db.get_document(DB_ID, SQUADS, squad_id)
    if squad.get("captain_id") != user_id:
        raise PermissionError("Only the captain can do that")


# ─── Practice / match scheduling ──────────────────────────────────────────────
async def list_events(squad_id: str, user_id: str) -> dict:
    """
    Scheduled sessions with their attendance tallies.

    Votes are folded in here so the UI can draw "4 of 6 available" without a
    request per event.
    """
    _require_member(squad_id, user_id)

    events = db.list_documents(DB_ID, EVENTS, queries=[
        Q.equal("squad_id", squad_id), Q.limit(50), Q.order_asc("starts_at"),
    ]).get("documents", [])

    items = []
    for event in events:
        votes = db.list_documents(DB_ID, VOTES, queries=[
            Q.equal("squad_event_id", event["$id"]), Q.limit(100),
        ]).get("documents", [])
        tally = {"yes": 0, "maybe": 0, "no": 0}
        for v in votes:
            if v.get("vote") in tally:
                tally[v["vote"]] += 1
        items.append({
            **event,
            "votes": tally,
            "my_vote": next((v["vote"] for v in votes if v.get("user_id") == user_id), None),
            "total_members": len(_member_ids(squad_id)),
        })

    return {"items": items, "total": len(items)}


async def create_event(squad_id: str, user_id: str, payload: dict) -> dict:
    """Schedule a session. Any member may propose one; the captain confirms."""
    _require_member(squad_id, user_id)
    now = now_iso()
    return db.create_document(DB_ID, EVENTS, ID.unique(), {
        "squad_id": squad_id,
        "title": payload["title"],
        "type": payload.get("type", "practice"),
        "starts_at": payload["starts_at"],
        "venue": payload.get("venue"),
        "notes": payload.get("notes"),
        "created_by": user_id,
        "status": "scheduled",
        "created_at": now,
    })


async def vote_event(squad_event_id: str, user_id: str, vote: str) -> dict:
    """Record availability. Re-voting updates rather than colliding on the index."""
    if vote not in ("yes", "maybe", "no"):
        raise ValueError("vote must be yes, maybe or no")

    event = db.get_document(DB_ID, EVENTS, squad_event_id)
    _require_member(event.get("squad_id", ""), user_id)

    now = now_iso()
    existing = db.list_documents(DB_ID, VOTES, queries=[
        Q.equal("squad_event_id", squad_event_id), Q.equal("user_id", user_id), Q.limit(1),
    ]).get("documents", [])

    if existing:
        db.update_document(DB_ID, VOTES, existing[0]["$id"], {"vote": vote, "updated_at": now})
    else:
        db.create_document(DB_ID, VOTES, ID.unique(), {
            "squad_event_id": squad_event_id, "user_id": user_id,
            "vote": vote, "created_at": now,
        })

    votes = db.list_documents(DB_ID, VOTES, queries=[
        Q.equal("squad_event_id", squad_event_id), Q.limit(100),
    ]).get("documents", [])
    tally = {"yes": 0, "maybe": 0, "no": 0}
    for v in votes:
        if v.get("vote") in tally:
            tally[v["vote"]] += 1
    return {"squad_event_id": squad_event_id, "votes": tally, "my_vote": vote}


async def cancel_event(squad_event_id: str, user_id: str) -> dict:
    event = db.get_document(DB_ID, EVENTS, squad_event_id)
    # The person who proposed it, or the captain, can call it off.
    if event.get("created_by") != user_id:
        _require_captain(event.get("squad_id", ""), user_id)
    return db.update_document(DB_ID, EVENTS, squad_event_id,
                              {"status": "cancelled", "updated_at": now_iso()})


# ─── Squad feed ───────────────────────────────────────────────────────────────
async def list_posts(squad_id: str, user_id: str, page: int = 0, limit: int = 20) -> dict:
    _require_member(squad_id, user_id)

    res = db.list_documents(DB_ID, POSTS, queries=[
        Q.equal("squad_id", squad_id), Q.equal("is_deleted", False),
        Q.limit(limit), Q.offset(page * limit), Q.order_desc("$createdAt"),
    ])
    posts = res.get("documents", [])

    # Which of these the caller has already liked, so the heart renders filled.
    liked: set[str] = set()
    if posts:
        rows = db.list_documents(DB_ID, LIKES, queries=[
            Q.equal("user_id", user_id), Q.limit(100),
        ]).get("documents", [])
        liked = {r["squad_post_id"] for r in rows if r.get("squad_post_id")}

    return {
        "items": [{**p, "is_liked": p["$id"] in liked} for p in posts],
        "total": res.get("total", len(posts)),
        "page": page,
        "limit": limit,
        "has_more": (page + 1) * limit < res.get("total", 0),
    }


async def create_post(squad_id: str, user_id: str, content: str,
                      media_url: str | None = None) -> dict:
    _require_member(squad_id, user_id)
    if not content.strip():
        raise ValueError("A post needs some content")

    # Author fields are denormalised so the feed renders without a profile lookup
    # per row, matching how posts and reels work.
    author = {}
    try:
        profile = db.get_document(DB_ID, settings.collection_users, user_id)
        author = {
            "author_name": profile.get("full_name", ""),
            "author_avatar_url": profile.get("avatar_url"),
        }
    except AppwriteException:
        logger.warning("no profile for squad post author %s", user_id)

    now = now_iso()
    return db.create_document(DB_ID, POSTS, ID.unique(), {
        "squad_id": squad_id,
        "author_id": user_id,
        **author,
        "content": content.strip(),
        "media_url": media_url,
        "likes_count": 0,
        "is_deleted": False,
        "created_at": now,
    })


async def toggle_post_like(squad_post_id: str, user_id: str) -> dict:
    """
    Like or unlike. The server decides the new state rather than trusting a flag
    from the client, so two rapid taps cannot desynchronise the counter.
    """
    post = db.get_document(DB_ID, POSTS, squad_post_id)
    _require_member(post.get("squad_id", ""), user_id)

    existing = db.list_documents(DB_ID, LIKES, queries=[
        Q.equal("squad_post_id", squad_post_id), Q.equal("user_id", user_id), Q.limit(1),
    ]).get("documents", [])

    current = int(post.get("likes_count", 0))
    if existing:
        db.delete_document(DB_ID, LIKES, existing[0]["$id"])
        count = max(0, current - 1)
        liked = False
    else:
        db.create_document(DB_ID, LIKES, ID.unique(), {
            "squad_post_id": squad_post_id, "user_id": user_id, "created_at": now_iso(),
        })
        count = current + 1
        liked = True

    db.update_document(DB_ID, POSTS, squad_post_id,
                       {"likes_count": count, "updated_at": now_iso()})
    return {"squad_post_id": squad_post_id, "liked": liked, "likes_count": count}


async def delete_post(squad_post_id: str, user_id: str) -> dict:
    post = db.get_document(DB_ID, POSTS, squad_post_id)
    if post.get("author_id") != user_id:
        _require_captain(post.get("squad_id", ""), user_id)
    return db.update_document(DB_ID, POSTS, squad_post_id,
                              {"is_deleted": True, "updated_at": now_iso()})


# ─── Achievements ─────────────────────────────────────────────────────────────
# Thresholds evaluated against the squad's own counters. Kept here rather than in
# the frontend so an achievement cannot be "unlocked" by editing local state.
ACHIEVEMENT_RULES = [
    ("first_blood", "First Blood", "Won your first match together", "\U0001F3C6",
     lambda s: int(s.get("wins", 0)) >= 1),
    ("chemistry_90", "In Sync", "Reached 90% squad chemistry", "⚡",
     lambda s: float(s.get("chemistry_score", 0)) >= 90),
    ("ten_matches", "Seasoned", "Played ten matches as a squad", "\U0001F396",
     lambda s: int(s.get("matches_played", 0)) >= 10),
    ("full_squad", "Full Strength", "Filled every roster slot", "\U0001F465",
     lambda s: int(s.get("members_count", 0)) >= int(s.get("max_members", 11))),
    ("unbeaten_five", "Unbeaten", "Five wins with no losses", "\U0001F525",
     lambda s: int(s.get("wins", 0)) >= 5 and int(s.get("losses", 0)) == 0),
]


async def list_achievements(squad_id: str, user_id: str) -> dict:
    """
    Unlocked achievements, re-evaluating the rules first so the shelf is current
    without needing a background job.
    """
    _require_member(squad_id, user_id)
    await evaluate_achievements(squad_id)

    rows = db.list_documents(DB_ID, ACHIEVEMENTS, queries=[
        Q.equal("squad_id", squad_id), Q.limit(50),
    ]).get("documents", [])
    unlocked = {r["key"] for r in rows}

    return {
        "items": [
            {
                "key": key, "name": name, "description": description, "icon": icon,
                "unlocked": key in unlocked,
                "unlocked_at": next((r.get("unlocked_at") for r in rows if r["key"] == key), None),
            }
            for key, name, description, icon, _ in ACHIEVEMENT_RULES
        ],
        "total": len(ACHIEVEMENT_RULES),
        "unlocked_count": len(unlocked),
    }


async def evaluate_achievements(squad_id: str) -> list[str]:
    """Award any newly earned achievements. Returns the keys awarded this call."""
    squad = db.get_document(DB_ID, SQUADS, squad_id)
    existing = {
        r["key"] for r in db.list_documents(DB_ID, ACHIEVEMENTS, queries=[
            Q.equal("squad_id", squad_id), Q.limit(50),
        ]).get("documents", [])
    }

    awarded = []
    now = now_iso()
    for key, name, description, icon, rule in ACHIEVEMENT_RULES:
        if key in existing or not rule(squad):
            continue
        try:
            db.create_document(DB_ID, ACHIEVEMENTS, ID.unique(), {
                "squad_id": squad_id, "key": key, "name": name,
                "description": description, "icon": icon,
                "unlocked_at": now, "created_at": now,
            })
            awarded.append(key)
        except AppwriteException:
            # unique(squad_id, key) means a concurrent call already awarded it.
            logger.debug("achievement %s already awarded to %s", key, squad_id)
    return awarded
