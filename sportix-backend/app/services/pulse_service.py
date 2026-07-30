"""
Pulse scores.

Owns the pulse_scores and pulse_history collections. All arithmetic comes from
pulse_math; level bookkeeping is delegated to level_service.

What changed here, and why it mattered:

  - Every attribute key was camelCase (userId, totalPulse, matchPerformance)
    while auth_service wrote the same rows in snake_case. Reads therefore matched
    nothing and get_pulse always returned the default 100.
  - The level curve was a local invention (six thresholds, xp_required =
    (level-1)*200) that disagreed with the frontend, so level was always 1 and
    progress always 0.
  - award_pulse wrote pulse_history rows as {amount, balanceAfter, referenceId},
    none of which are attributes in the schema; those writes now use
    {delta, score_after, reference_id} and include the required created_at.
"""
from __future__ import annotations

import logging
from typing import Optional

from appwrite.id import ID
from appwrite.query import Query as Q

from app.core.appwrite import db, DB_ID
from app.core.config import settings
from app.services import level_service, pulse_math
from app.utils.formatters import now_iso

logger = logging.getLogger(__name__)

SCORES = settings.collection_pulse_scores
HISTORY = settings.collection_pulse_history

# The six components stored per user, matching PulseScoreBreakdown.
COMPONENTS = (
    "match_performance", "consistency", "team_chemistry",
    "reliability", "activity", "leadership",
)


def _row(user_id: str) -> dict | None:
    res = db.list_documents(DB_ID, SCORES, queries=[Q.equal("user_id", user_id), Q.limit(1)])
    docs = res.get("documents", [])
    return docs[0] if docs else None


def _default(user_id: str) -> dict:
    return {
        "user_id": user_id,
        "total_pulse": 100.0,
        **{c: 0.0 for c in COMPONENTS},
        "tier": pulse_math.tier_for(100.0),
    }


async def get_pulse(user_id: str) -> dict:
    """Score, component breakdown, tier, and live level progress."""
    row = _row(user_id) or _default(user_id)
    total = float(row.get("total_pulse", 100.0))
    level = await level_service.get_user_level(user_id)

    return {
        "user_id": user_id,
        "total_pulse": total,
        "tier": pulse_math.tier_for(total),
        "breakdown": {c: float(row.get(c, 0.0)) for c in COMPONENTS},
        "level": level["current_level"],
        "level_title": level["prestige_rank"],
        "progress_percent": level["progress_percent"],
        "prestige_rank": level["prestige_rank"],
    }


async def get_history(user_id: str, limit: int = 30) -> dict:
    return db.list_documents(DB_ID, HISTORY, queries=[
        Q.equal("user_id", user_id), Q.limit(limit), Q.order_desc("$createdAt"),
    ])


async def get_level(user_id: str) -> dict:
    return await level_service.get_user_level(user_id)


async def get_level_history(user_id: str) -> dict:
    return await level_service.get_level_history(user_id)


async def get_ssr(user_id: str, sport: Optional[str] = None) -> dict:
    """
    Sport-Specific Rating.

    Note: the components are not yet stored per sport, so `sport` is echoed back
    but does not filter. Splitting SSR by sport needs a per-sport row, which the
    schema does not model.
    """
    pulse = await get_pulse(user_id)
    breakdown = pulse["breakdown"]
    return {
        "user_id": user_id,
        "sport": sport,
        "overall_ssr": pulse["total_pulse"],
        "tier": pulse["tier"],
        "match_performance": breakdown["match_performance"],
        "consistency": breakdown["consistency"],
        "reliability": breakdown["reliability"],
    }


async def award_pulse(
    user_id: str,
    source: str,
    amount: float,
    reason: Optional[str] = None,
    reference_id: Optional[str] = None,
    component: Optional[str] = None,
) -> dict:
    """
    Add (or subtract) Pulse, write an audit row, and resync the user's level.

    `component` optionally attributes the award to one of COMPONENTS so the
    breakdown stays meaningful rather than only the total moving.

    Creates the pulse_scores row when absent: a user whose registration predates
    this collection would otherwise never accumulate anything.
    """
    now = now_iso()
    row = _row(user_id)

    if row is None:
        new_total = pulse_math.clamp_pulse(100.0 + amount)
        payload = {
            "user_id": user_id,
            "total_pulse": new_total,
            **{c: 0.0 for c in COMPONENTS},
            "tier": pulse_math.tier_for(new_total),
            "updated_at": now,
            "created_at": now,
        }
        if component in COMPONENTS:
            payload[component] = max(0.0, amount)
        db.create_document(DB_ID, SCORES, ID.unique(), payload)
    else:
        new_total = pulse_math.clamp_pulse(float(row.get("total_pulse", 100.0)) + amount)
        patch = {
            "total_pulse": new_total,
            "tier": pulse_math.tier_for(new_total),
            "updated_at": now,
        }
        if component in COMPONENTS:
            patch[component] = max(0.0, float(row.get(component, 0.0)) + amount)
        db.update_document(DB_ID, SCORES, row["$id"], patch)

    try:
        db.create_document(DB_ID, HISTORY, ID.unique(), {
            "user_id": user_id,
            "delta": float(amount),
            "source": source,
            "reason": reason,
            "score_after": new_total,
            "reference_id": reference_id,
            "created_at": now,
        })
    except Exception:
        # The score is the source of truth; a missing audit row must not undo it.
        logger.warning("pulse_history write failed for %s (delta=%s source=%s)",
                       user_id, amount, source, exc_info=True)

    # Levels track lifetime earned, so only positive awards advance them and a
    # deduction can never demote. The current score is passed for display only.
    lifetime = await level_service.get_lifetime_pulse(user_id) + max(0.0, float(amount))
    level = await level_service.sync_level(user_id, lifetime, new_total)

    return {
        "user_id": user_id,
        "delta": float(amount),
        "total_pulse": new_total,
        "tier": pulse_math.tier_for(new_total),
        "level": level["level"],
        "leveled_up": level["leveled_up"],
        "lifetime_pulse": lifetime,
    }


async def award_from_match(
    user_id: str,
    sport: str,
    stats: dict,
    match_rating: float,
    is_mvp: bool,
    result: str,
    weight: float = 1.0,
    match_id: Optional[str] = None,
) -> dict:
    """
    Award the Pulse a match performance earns.

    Replaces match_service's placeholder of rating/10*20 with the real per-sport
    formula. `weight` is the validation consensus multiplier, so unverified or
    disputed stats award proportionally less.
    """
    earned = pulse_math.calculate_pulse(sport, stats, match_rating, is_mvp, result)
    weighted = pulse_math.js_round(earned * weight)

    awarded = await award_pulse(
        user_id=user_id,
        source="match",
        amount=float(weighted),
        reason=f"{sport} match ({result}){' MVP' if is_mvp else ''}",
        reference_id=match_id,
        component="match_performance",
    )

    return {
        **awarded,
        "pulse_earned": weighted,
        "pulse_before_weight": earned,
        "weight": weight,
        "ssr_delta": pulse_math.calculate_ssr_delta(sport, stats, match_rating, result),
        "chemistry_delta": pulse_math.calculate_chemistry_delta(is_mvp, result, match_rating),
    }
