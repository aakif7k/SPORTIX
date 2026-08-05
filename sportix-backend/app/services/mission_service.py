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


# --- Daily streak rewards -----------------------------------------------------
# The 7-day reward calendar on PulseLobby was seven hardcoded rows in
# gamificationStore, with days 1-3 permanently claimed, day 4 permanently "today",
# and claiming only mutating local state. user_streaks tracked a streak but nothing
# rewarded it.
#
# The ladder is defined here rather than stored, because it is a product rule and
# not per-user data: day N always pays the same. The streak row is the only state,
# and last_active_date is what makes claiming idempotent -- a second claim on the
# same day is refused rather than paying twice.

STREAK_LADDER = [
    {"day": 1, "label": "Day 1", "pulse": 10, "coins": 5, "icon": "\u26a1"},
    {"day": 2, "label": "Day 2", "pulse": 15, "coins": 10, "icon": "\u26a1"},
    {"day": 3, "label": "Day 3", "pulse": 20, "coins": 15, "icon": "\U0001f50b"},
    {"day": 4, "label": "Day 4", "pulse": 25, "coins": 20, "icon": "\U0001f3af"},
    {"day": 5, "label": "Day 5", "pulse": 30, "coins": 25, "icon": "\U0001f680",
     "xp_booster": 1.5},
    {"day": 6, "label": "Day 6", "pulse": 40, "coins": 35, "icon": "\U0001f48e"},
    {"day": 7, "label": "BONUS", "pulse": 100, "coins": 100, "icon": "\U0001f451",
     "xp_booster": 2.0, "is_bonus_day": True},
]

LADDER_LENGTH = len(STREAK_LADDER)


def _today() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).date().isoformat()


def _yesterday() -> str:
    from datetime import datetime, timedelta, timezone
    return (datetime.now(timezone.utc).date() - timedelta(days=1)).isoformat()


def _streak_row(user_id: str) -> dict | None:
    rows = db.list_documents(DB_ID, STREAKS, queries=[
        Q.equal("user_id", user_id), Q.limit(1),
    ]).get("documents", [])
    return rows[0] if rows else None


def _ladder_state(current_streak: int, claimed_today: bool) -> list[dict]:
    """
    The calendar as the UI draws it.

    The position in the ladder cycles every 7 days, so a 9-day streak is on day 2
    of its second lap rather than off the end of the board.
    """
    # The rung the athlete is standing on. Position cycles every 7 days, so a
    # 9-day streak is on day 2 of its second lap rather than off the end of the
    # board.
    position = (current_streak - 1) % LADDER_LENGTH + 1 if current_streak > 0 else 1

    # Rungs strictly below the current one are behind you. The current rung is
    # claimed only if today's reward has been collected -- being on day 3 with
    # nothing claimed means day 3 is the one to press, not day 4.
    claimed_through = position if claimed_today else position - 1

    out = []
    for rung in STREAK_LADDER:
        day = rung["day"]
        out.append({
            **rung,
            "claimed": day <= claimed_through,
            "is_today": day == position,
            "is_locked": day > position,
        })
    return out


async def get_streak(user_id: str) -> dict:
    row = _streak_row(user_id)
    current = int(row.get("current_streak", 0)) if row else 0
    longest = int(row.get("longest_streak", 0)) if row else 0
    last_active = row.get("last_active_date") if row else None
    # Login stamps last_active_date to advance the streak; whether today's reward
    # has been collected is a separate marker, or logging in would silently consume
    # the claim.
    claimed_today = str((row or {}).get("last_claimed_date") or "")[:10] == _today()

    return {
        "user_id": user_id,
        "current_streak": current,
        "longest_streak": longest,
        "last_active_date": last_active,
        "claimed_today": claimed_today,
        "rewards": _ladder_state(current, claimed_today),
    }


async def claim_daily_reward(user_id: str) -> dict:
    """
    Claim today's rung of the streak ladder.

    Idempotent by date: claiming twice in a day is a ValueError rather than a
    second payout. A gap of more than one day resets the streak to 1, which is what
    makes it a streak.
    """
    from app.services import coins_service, pulse_service

    row = _streak_row(user_id)
    today = _today()

    if str((row or {}).get("last_claimed_date") or "")[:10] == today:
        raise ValueError("Today's reward has already been claimed")

    # The streak itself is maintained by _update_streak on login, so claiming reads
    # it rather than advancing it a second time. A user who has logged in today is
    # already on day N; one who somehow claims without a streak row starts at 1.
    last_active = str((row or {}).get("last_active_date") or "")[:10]
    current = int((row or {}).get("current_streak", 0))
    if current <= 0:
        current = 1
    elif last_active != today:
        # Claiming is itself activity, so it advances a stale streak the same way a
        # login would.
        current = current + 1 if last_active == _yesterday() else 1
    longest = max(int((row or {}).get("longest_streak", 0)), current)

    position = (current - 1) % LADDER_LENGTH
    rung = STREAK_LADDER[position]

    now = now_iso()
    if row:
        db.update_document(DB_ID, STREAKS, row["$id"], {
            "current_streak": current,
            "longest_streak": longest,
            "last_active_date": today,
            "last_claimed_date": today,
            "updated_at": now,
        })
    else:
        db.create_document(DB_ID, STREAKS, ID.unique(), {
            "user_id": user_id,
            "current_streak": current,
            "longest_streak": longest,
            "last_active_date": today,
            "last_claimed_date": today,
            "created_at": now,
            "updated_at": now,
        })

    # The streak row is written first: if an award fails the streak still advanced,
    # which is recoverable, whereas paying out twice is not.
    awarded_pulse, awarded_coins = 0.0, 0
    try:
        award = await pulse_service.award_pulse(
            user_id=user_id, source="streak", amount=float(rung["pulse"]),
            reason=f"Day {rung['day']} login streak", component="activity",
        )
        awarded_pulse = float(rung["pulse"])
    except Exception:
        award = {}
        logger.warning("streak Pulse award failed for %s", user_id, exc_info=True)

    try:
        await coins_service.award(user_id, int(rung["coins"]),
                                  f"Day {rung['day']} login streak", source="reward")
        awarded_coins = int(rung["coins"])
    except Exception:
        logger.warning("streak coin award failed for %s", user_id, exc_info=True)

    return {
        "day": rung["day"],
        "current_streak": current,
        "longest_streak": longest,
        "pulse_awarded": awarded_pulse,
        "coins_awarded": awarded_coins,
        "xp_booster": rung.get("xp_booster"),
        "total_pulse": award.get("total_pulse"),
        "level": award.get("level"),
        "leveled_up": award.get("leveled_up", False),
        "rewards": _ladder_state(current, True),
    }
