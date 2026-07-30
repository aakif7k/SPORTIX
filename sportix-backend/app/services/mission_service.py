"""
Daily missions and login streaks.

Two things were wrong beyond key casing:

  1. user_missions rows carried a copy of the template (title, description,
     reward_coins, reward_pulse) and an is_completed flag. None of those are
     columns on that collection, so every write would have been rejected. They
     are now joined from daily_missions on read, and completion is derived from
     progress >= target rather than stored as a third source of truth.
  2. the templates were hardcoded here as well as in app/utils/seed.py, so the
     same five missions existed in three places and could disagree. They are now
     read from the daily_missions collection, which the seed owns.
"""
from __future__ import annotations

import logging
from datetime import date

from appwrite.id import ID
from appwrite.query import Query as Q

from app.core.appwrite import db, DB_ID
from app.core.config import settings
from app.utils.formatters import now_iso

logger = logging.getLogger(__name__)

USER_MISSIONS = settings.collection_user_missions
TEMPLATES = settings.collection_daily_missions
STREAKS = settings.collection_user_streaks


def _today() -> str:
    return date.today().isoformat()


def _templates() -> list[dict]:
    """Active mission templates, seeded by app/utils/seed.py."""
    res = db.list_documents(DB_ID, TEMPLATES, queries=[
        Q.equal("is_active", True), Q.limit(50),
    ])
    return res.get("documents", [])


def _decorate(row: dict, template: dict | None) -> dict:
    """A user_missions row joined with its template, plus derived completion."""
    progress = int(row.get("progress", 0))
    target = int(row.get("target", 1) or 1)
    return {
        "id": row.get("$id"),
        "user_id": row.get("user_id"),
        "mission_key": row.get("mission_key"),
        "mission_date": row.get("mission_date"),
        "progress": progress,
        "target": target,
        "is_completed": progress >= target,     # derived, never stored
        "is_claimed": bool(row.get("is_claimed")),
        "claimed_at": row.get("claimed_at"),
        "title": (template or {}).get("title"),
        "description": (template or {}).get("description"),
        "reward_coins": int((template or {}).get("reward_coins", 0)),
        "reward_pulse": float((template or {}).get("reward_pulse", 0.0)),
        "category": (template or {}).get("category"),
    }


async def get_today(user_id: str) -> dict:
    """
    Today's missions, creating the day's rows on first request.

    unique(user_id, mission_key, mission_date) means a concurrent second call
    cannot double-create; a conflict just means the row already exists.
    """
    today = _today()
    templates = {t["key"]: t for t in _templates()}

    existing = db.list_documents(DB_ID, USER_MISSIONS, queries=[
        Q.equal("user_id", user_id), Q.equal("mission_date", today), Q.limit(50),
    ]).get("documents", [])

    have = {r.get("mission_key") for r in existing}
    for key, template in templates.items():
        if key in have:
            continue
        now = now_iso()
        try:
            existing.append(db.create_document(DB_ID, USER_MISSIONS, ID.unique(), {
                "user_id": user_id,
                "mission_key": key,
                "mission_date": today,
                "progress": 0,
                "target": int(template.get("target_count", 1) or 1),
                "is_claimed": False,
                "created_at": now,
            }))
        except Exception:
            logger.warning("could not create mission %s for %s on %s",
                           key, user_id, today, exc_info=True)

    items = [_decorate(r, templates.get(r.get("mission_key"))) for r in existing]
    items.sort(key=lambda m: m["mission_key"] or "")
    return {"items": items, "total": len(items), "mission_date": today}


async def record_progress(user_id: str, mission_key: str, amount: int = 1) -> dict | None:
    """
    Advance one of today's missions. Returns the updated mission, or None when
    the user has no such mission today.
    """
    today = _today()
    rows = db.list_documents(DB_ID, USER_MISSIONS, queries=[
        Q.equal("user_id", user_id), Q.equal("mission_key", mission_key),
        Q.equal("mission_date", today), Q.limit(1),
    ]).get("documents", [])
    if not rows:
        return None

    row = rows[0]
    target = int(row.get("target", 1) or 1)
    progress = min(target, int(row.get("progress", 0)) + amount)
    updated = db.update_document(DB_ID, USER_MISSIONS, row["$id"],
                                {"progress": progress, "updated_at": now_iso()})

    templates = {t["key"]: t for t in _templates()}
    return _decorate(updated, templates.get(mission_key))


async def claim(mission_id: str, user_id: str) -> dict:
    """Pay out a completed mission exactly once."""
    row = db.get_document(DB_ID, USER_MISSIONS, mission_id)
    if row.get("user_id") != user_id:
        raise PermissionError("Not your mission")

    progress = int(row.get("progress", 0))
    target = int(row.get("target", 1) or 1)
    if progress < target:
        raise ValueError(f"Mission not yet completed ({progress}/{target})")
    if row.get("is_claimed"):
        raise ValueError("Already claimed")

    templates = {t["key"]: t for t in _templates()}
    template = templates.get(row.get("mission_key")) or {}
    title = template.get("title", "Mission")

    now = now_iso()
    updated = db.update_document(DB_ID, USER_MISSIONS, mission_id,
                                 {"is_claimed": True, "claimed_at": now, "updated_at": now})

    # Imported here to avoid a circular import at module load.
    from app.services import coins_service, pulse_service
    await coins_service.award(user_id, int(template.get("reward_coins", 0)), f"Mission: {title}")
    await pulse_service.award_pulse(
        user_id, "mission", float(template.get("reward_pulse", 0.0)),
        reason=title, reference_id=mission_id, component="activity",
    )
    await _update_streak(user_id)

    return _decorate(updated, template)


async def get_history(user_id: str) -> dict:
    rows = db.list_documents(DB_ID, USER_MISSIONS, queries=[
        Q.equal("user_id", user_id), Q.equal("is_claimed", True),
        Q.limit(50), Q.order_desc("$createdAt"),
    ]).get("documents", [])
    templates = {t["key"]: t for t in _templates()}
    return {"items": [_decorate(r, templates.get(r.get("mission_key"))) for r in rows],
            "total": len(rows)}


async def get_streak(user_id: str) -> dict:
    rows = db.list_documents(DB_ID, STREAKS, queries=[
        Q.equal("user_id", user_id), Q.limit(1),
    ]).get("documents", [])
    if rows:
        r = rows[0]
        return {
            "user_id": user_id,
            "current_streak": int(r.get("current_streak", 0)),
            "longest_streak": int(r.get("longest_streak", 0)),
            "last_active_date": r.get("last_active_date"),
        }
    return {"user_id": user_id, "current_streak": 0, "longest_streak": 0,
            "last_active_date": None}


async def get_weekly(user_id: str) -> dict:
    rows = db.list_documents(DB_ID, USER_MISSIONS, queries=[
        Q.equal("user_id", user_id), Q.limit(35), Q.order_desc("mission_date"),
    ]).get("documents", [])
    claimed = sum(1 for r in rows if r.get("is_claimed"))
    return {
        "total": len(rows),
        "completed": claimed,
        "completion_rate": round(claimed / max(1, len(rows)) * 100),
    }


async def _update_streak(user_id: str) -> None:
    """
    Advance the login streak, resetting it when a day was missed.

    The previous version incremented unconditionally, so a user returning after a
    month kept their old streak.
    """
    today = date.today()
    today_str = today.isoformat()
    rows = db.list_documents(DB_ID, STREAKS, queries=[
        Q.equal("user_id", user_id), Q.limit(1),
    ]).get("documents", [])
    now = now_iso()

    if not rows:
        db.create_document(DB_ID, STREAKS, ID.unique(), {
            "user_id": user_id, "current_streak": 1, "longest_streak": 1,
            "last_active_date": today_str, "updated_at": now, "created_at": now,
        })
        return

    row = rows[0]
    last = row.get("last_active_date")
    if last == today_str:
        return

    current = int(row.get("current_streak", 0))
    consecutive = False
    if last:
        try:
            consecutive = (today - date.fromisoformat(last)).days == 1
        except ValueError:
            logger.warning("unparseable last_active_date %r for %s", last, user_id)

    current = current + 1 if consecutive else 1
    db.update_document(DB_ID, STREAKS, row["$id"], {
        "current_streak": current,
        "longest_streak": max(int(row.get("longest_streak", 0)), current),
        "last_active_date": today_str,
        "updated_at": now,
    })
