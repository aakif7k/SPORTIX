from appwrite.query import Query as Q
from appwrite.id import ID
from app.core.appwrite import db, DB_ID
from app.core.config import settings
from typing import Optional


async def get_pulse(user_id: str) -> dict:
    res = db.list_documents(
        DB_ID, settings.collection_pulse_scores,
        queries=[Q.equal("userId", user_id), Q.limit(1)],
    )
    docs = res.get("documents", [])
    if not docs:
        return _default_pulse(user_id)
    doc = docs[0]
    level_data = await get_level(user_id)
    doc["level"] = level_data.get("level", 1)
    doc["level_progress_percent"] = level_data.get("progressPercent", 0)
    doc["prestige_rank"] = _get_prestige(doc.get("totalPulse", 100))
    return doc


async def get_history(user_id: str, limit: int = 30) -> dict:
    return db.list_documents(
        DB_ID, settings.collection_pulse_history,
        queries=[Q.equal("userId", user_id), Q.limit(limit), Q.order_desc("$createdAt")],
    )


async def get_level(user_id: str) -> dict:
    res = db.list_documents(
        DB_ID, settings.collection_user_levels,
        queries=[Q.equal("userId", user_id), Q.limit(1)],
    )
    docs = res.get("documents", [])
    if not docs:
        return {"level": 1, "xp": 0, "progressPercent": 0, "prestigeRank": None}
    doc = docs[0]
    # Recalculate progress based on XP
    level = doc.get("level", 1)
    xp = doc.get("xp", 0)
    xp_for_next = _xp_required(level + 1)
    xp_for_current = _xp_required(level)
    progress = round(((xp - xp_for_current) / max(1, xp_for_next - xp_for_current)) * 100, 1)
    doc["progressPercent"] = min(99.9, max(0, progress))
    return doc


async def get_level_history(user_id: str) -> dict:
    return db.list_documents(
        DB_ID, settings.collection_level_history,
        queries=[Q.equal("userId", user_id), Q.limit(50), Q.order_desc("$createdAt")],
    )


async def get_ssr(user_id: str, sport: Optional[str] = None) -> dict:
    """Sport-Specific Rating — filtered pulse stats for a given sport."""
    pulse = await get_pulse(user_id)
    return {
        "user_id": user_id,
        "sport": sport,
        "overall_ssr": pulse.get("totalPulse", 100),
        "match_performance": pulse.get("matchPerformance", 0),
        "consistency": pulse.get("consistency", 0),
        "reliability": pulse.get("reliability", 0),
    }


async def award_pulse(user_id: str, source: str, amount: float, reason: Optional[str] = None, reference_id: Optional[str] = None):
    """Add pulse points to a user and log to history."""
    res = db.list_documents(
        DB_ID, settings.collection_pulse_scores,
        queries=[Q.equal("userId", user_id), Q.limit(1)],
    )
    if res.get("documents"):
        doc = res["documents"][0]
        new_total = min(1000, doc.get("totalPulse", 100) + amount)
        db.update_document(DB_ID, settings.collection_pulse_scores, doc["$id"],
                           {"totalPulse": new_total})
        # Log to history
        db.create_document(DB_ID, settings.collection_pulse_history, ID.unique(), {
            "userId": user_id,
            "source": source,
            "amount": amount,
            "reason": reason,
            "referenceId": reference_id,
            "balanceAfter": new_total,
        })
        # Check for level up
        await _check_level_up(user_id, new_total)


async def _check_level_up(user_id: str, total_pulse: float):
    """Auto-level-up based on total pulse thresholds."""
    level = _pulse_to_level(total_pulse)
    res = db.list_documents(
        DB_ID, settings.collection_user_levels,
        queries=[Q.equal("userId", user_id), Q.limit(1)],
    )
    if res.get("documents"):
        doc = res["documents"][0]
        current_level = doc.get("level", 1)
        if level > current_level:
            db.update_document(DB_ID, settings.collection_user_levels, doc["$id"],
                               {"level": level, "xp": total_pulse})
            db.create_document(DB_ID, settings.collection_level_history, ID.unique(), {
                "userId": user_id, "oldLevel": current_level, "newLevel": level,
            })


def _pulse_to_level(pulse: float) -> int:
    thresholds = [0, 200, 400, 600, 800, 1000]
    for i, t in enumerate(thresholds):
        if pulse < t:
            return max(1, i)
    return len(thresholds)


def _xp_required(level: int) -> float:
    return (level - 1) * 200.0


def _get_prestige(pulse: float) -> str:
    if pulse >= 900:  return "Legend"
    if pulse >= 700:  return "Elite"
    if pulse >= 500:  return "Pro"
    if pulse >= 300:  return "Rising Star"
    if pulse >= 150:  return "Amateur"
    return "Rookie"


def _default_pulse(user_id: str) -> dict:
    return {
        "userId": user_id, "totalPulse": 100.0,
        "matchPerformance": 0, "consistency": 0,
        "teamChemistry": 0, "reliability": 0,
        "activity": 0, "leadership": 0,
        "level": 1, "level_progress_percent": 0,
        "prestige_rank": "Rookie",
    }
