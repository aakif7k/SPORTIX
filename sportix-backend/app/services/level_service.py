"""
Level progression.

Owns the user_levels and level_history collections and the level curve, which
comes from pulse_math (ported from gamificationStore). Previously this module
just forwarded to pulse_service, and pulse_service carried a different curve of
its own -- a 6-entry threshold table and xp_required = (level-1)*200 -- which
disagreed with the frontend's 150 levels of 100 Pulse each. That is why levels
and progress never matched what the UI drew.

Level runs off LIFETIME earned Pulse (total_pulse_ever), not the current 0..1000
score. Deriving it from the current score, as the frontend did, has two
consequences that make the whole progression pointless: the 1000 cap puts 139 of
the 150 levels and 13 of the 15 titles permanently out of reach, so every account
is stuck on "Rookie"; and because the current score can fall, a bad match would
demote you. Lifetime earned only ever increases, so levels only ever go up.
"""
from __future__ import annotations

import logging

from appwrite.id import ID
from appwrite.query import Query as Q

from app.core.appwrite import db, DB_ID
from app.core.config import settings
from app.services import pulse_math
from app.utils.formatters import now_iso

logger = logging.getLogger(__name__)

COLL = settings.collection_user_levels
HISTORY = settings.collection_level_history


def _row(user_id: str) -> dict | None:
    res = db.list_documents(DB_ID, COLL, queries=[Q.equal("user_id", user_id), Q.limit(1)])
    docs = res.get("documents", [])
    return docs[0] if docs else None


def _shape(lifetime_pulse: float) -> dict:
    """Level fields derived from lifetime earned Pulse."""
    progress = pulse_math.level_progress(lifetime_pulse)
    return {
        "current_level": progress["level"],
        "pulse_for_next": progress["max_pulse"],
        "prestige_rank": progress["title"],
        "progress_percent": progress["progress_percent"],
        "current_in_level": progress["current"],
        "required_for_level": progress["required"],
        "remaining": progress["remaining"],
    }


async def get_lifetime_pulse(user_id: str) -> float:
    """Total Pulse this user has ever earned. 0 for an account that has earned none."""
    row = _row(user_id)
    return float(row.get("total_pulse_ever", 0.0)) if row else 0.0


async def get_user_level(user_id: str) -> dict:
    """
    Current level with real progress.

    Progress is recomputed from the stored lifetime total rather than read back,
    so a row written by an older version still reports correctly.
    """
    row = _row(user_id)
    lifetime = float(row.get("total_pulse_ever", 0.0)) if row else 0.0
    return {
        "user_id": user_id,
        **_shape(lifetime),
        "current_pulse": float(row.get("current_pulse", 100.0)) if row else 100.0,
        "total_pulse_ever": lifetime,
        "level_ups_count": int(row.get("level_ups_count", 0)) if row else 0,
    }


async def sync_level(user_id: str, lifetime_pulse: float, current_pulse: float) -> dict:
    """
    Persist the level implied by `lifetime_pulse`, recording a level_history row
    on each promotion. `current_pulse` is stored for display only and does not
    affect the level. Returns {level, previous_level, leveled_up}.
    """
    shaped = _shape(lifetime_pulse)
    new_level = shaped["current_level"]
    row = _row(user_id)
    now = now_iso()

    if row is None:
        db.create_document(DB_ID, COLL, ID.unique(), {
            "user_id": user_id,
            "current_level": new_level,
            "current_pulse": float(current_pulse),
            "pulse_for_next": shaped["pulse_for_next"],
            "total_pulse_ever": float(lifetime_pulse),
            "level_ups_count": 0,
            "prestige_rank": shaped["prestige_rank"],
            "updated_at": now,
            "created_at": now,
        })
        # A first row for an account that has already earned its way past level 1
        # is still a promotion from the starting level.
        return {"level": new_level, "previous_level": 1, "leveled_up": new_level > 1}

    previous = int(row.get("current_level", 1))
    leveled_up = new_level > previous
    patch = {
        "current_level": new_level,
        "current_pulse": float(current_pulse),
        "pulse_for_next": shaped["pulse_for_next"],
        # Monotonic: lifetime earned can never decrease.
        "total_pulse_ever": max(float(row.get("total_pulse_ever", 0.0)), float(lifetime_pulse)),
        "prestige_rank": shaped["prestige_rank"],
        "updated_at": now,
    }
    if leveled_up:
        patch["level_ups_count"] = int(row.get("level_ups_count", 0)) + (new_level - previous)

    db.update_document(DB_ID, COLL, row["$id"], patch)

    if leveled_up:
        try:
            db.create_document(DB_ID, HISTORY, ID.unique(), {
                "user_id": user_id,
                "old_level": previous,
                "new_level": new_level,
                "created_at": now,
            })
        except Exception:
            # A missing audit row must not fail the promotion itself.
            logger.warning("level_history write failed for %s (%s -> %s)",
                           user_id, previous, new_level, exc_info=True)

    return {"level": new_level, "previous_level": previous, "leveled_up": leveled_up}


async def get_level_history(user_id: str, limit: int = 50) -> dict:
    return db.list_documents(DB_ID, HISTORY, queries=[
        Q.equal("user_id", user_id), Q.limit(limit), Q.order_desc("$createdAt"),
    ])
