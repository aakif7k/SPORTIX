from datetime import datetime, timezone
from appwrite.query import Query as Q
from appwrite.id import ID
from app.core.appwrite import db, DB_ID
from app.core.config import settings
from typing import Optional


async def get_pulse(user_id: str) -> dict:
    res = db.list_documents(
        DB_ID, settings.collection_pulse_scores,
        queries=[Q.equal("user_id", user_id), Q.limit(1)],
    )
    docs = res.get("documents", [])
    if not docs:
        # Fallback check profile pulse_score
        profile_pulse = 100.0
        try:
            p_doc = db.get_document(DB_ID, settings.collection_users, user_id)
            if p_doc and p_doc.get("pulse_score") is not None:
                profile_pulse = float(p_doc.get("pulse_score"))
        except Exception:
            pass
        return _default_pulse(user_id, profile_pulse)

    doc = docs[0]
    total_pulse = doc.get("total_pulse", 100.0)
    level_data = await get_level(user_id)

    return {
        "user_id": user_id,
        "total_pulse": total_pulse,
        "totalPulse": total_pulse,
        "match_performance": doc.get("match_performance", 0),
        "matchPerformance": doc.get("match_performance", 0),
        "consistency": doc.get("consistency", 0),
        "team_chemistry": doc.get("team_chemistry", 0),
        "teamChemistry": doc.get("team_chemistry", 0),
        "reliability": doc.get("reliability", 0),
        "activity": doc.get("activity", 0),
        "leadership": doc.get("leadership", 0),
        "tier": doc.get("tier", "contender"),
        "level": level_data.get("current_level") or level_data.get("level", 1),
        "level_progress_percent": level_data.get("progressPercent", 0),
        "prestige_rank": _get_prestige(total_pulse),
        "updated_at": doc.get("updated_at"),
        "created_at": doc.get("created_at"),
    }


async def get_history(user_id: str, limit: int = 30) -> dict:
    return db.list_documents(
        DB_ID, settings.collection_pulse_history,
        queries=[Q.equal("user_id", user_id), Q.limit(limit), Q.order_desc("created_at")],
    )


async def get_level(user_id: str) -> dict:
    res = db.list_documents(
        DB_ID, settings.collection_user_levels,
        queries=[Q.equal("user_id", user_id), Q.limit(1)],
    )
    docs = res.get("documents", [])
    if not docs:
        return {"current_level": 1, "level": 1, "xp": 0, "progressPercent": 0, "prestigeRank": "Rookie"}
    doc = docs[0]
    level = doc.get("current_level", 1)
    current_pulse = doc.get("current_pulse", 0)
    pulse_for_next = doc.get("pulse_for_next", 200)
    progress = round((current_pulse / max(1, pulse_for_next)) * 100, 1)
    doc["progressPercent"] = min(99.9, max(0, progress))
    doc["level"] = level
    return doc


async def get_level_history(user_id: str) -> dict:
    return db.list_documents(
        DB_ID, settings.collection_level_history,
        queries=[Q.equal("user_id", user_id), Q.limit(50), Q.order_desc("created_at")],
    )


async def get_ssr(user_id: str, sport: Optional[str] = None) -> dict:
    """Sport-Specific Rating — filtered pulse stats for a given sport."""
    pulse = await get_pulse(user_id)
    return {
        "user_id": user_id,
        "sport": sport,
        "overall_ssr": pulse.get("total_pulse", 100),
        "match_performance": pulse.get("match_performance", 0),
        "consistency": pulse.get("consistency", 0),
        "reliability": pulse.get("reliability", 0),
    }


async def award_pulse(user_id: str, source: str, amount: float, reason: Optional[str] = None, reference_id: Optional[str] = None):
    """Add pulse points to a user, update pulse_scores, sync profile, and log to pulse_history."""
    now_iso = datetime.now(timezone.utc).isoformat()
    res = db.list_documents(
        DB_ID, settings.collection_pulse_scores,
        queries=[Q.equal("user_id", user_id), Q.limit(1)],
    )
    new_total = 100.0
    if res.get("documents"):
        doc = res["documents"][0]
        new_total = min(1000.0, float(doc.get("total_pulse", 100.0)) + amount)
        db.update_document(
            DB_ID, settings.collection_pulse_scores, doc["$id"],
            {"total_pulse": new_total, "updated_at": now_iso}
        )
    else:
        new_total = min(1000.0, 100.0 + amount)
        db.create_document(
            DB_ID, settings.collection_pulse_scores, ID.unique(),
            {
                "user_id": user_id,
                "total_pulse": new_total,
                "match_performance": 0,
                "consistency": 0,
                "team_chemistry": 0,
                "reliability": 0,
                "activity": 0,
                "leadership": 0,
                "tier": "pulse_elite" if new_total >= 900 else "elite" if new_total >= 800 else "contender",
                "created_at": now_iso,
                "updated_at": now_iso,
            }
        )

    # Sync profiles collection
    try:
        db.update_document(DB_ID, settings.collection_users, user_id, {"pulse_score": int(new_total)})
    except Exception:
        pass

    # Log to pulse_history
    try:
        db.create_document(DB_ID, settings.collection_pulse_history, ID.unique(), {
            "user_id": user_id,
            "source": source,
            "delta": amount,
            "reason": reason or "",
            "reference_id": reference_id or "",
            "score_after": new_total,
            "created_at": now_iso,
            "updated_at": now_iso,
        })
    except Exception as e:
        print(f"[!] pulse_history log warning: {e}")

    # Check for level up
    await _check_level_up(user_id, new_total)


async def _check_level_up(user_id: str, total_pulse: float):
    """Auto-level-up based on total pulse thresholds."""
    level = _pulse_to_level(total_pulse)
    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        res = db.list_documents(
            DB_ID, settings.collection_user_levels,
            queries=[Q.equal("user_id", user_id), Q.limit(1)],
        )
        if res.get("documents"):
            doc = res["documents"][0]
            current_level = doc.get("current_level", 1)
            if level > current_level:
                db.update_document(DB_ID, settings.collection_user_levels, doc["$id"], {
                    "current_level": level,
                    "current_pulse": total_pulse,
                    "updated_at": now_iso,
                })
        else:
            db.create_document(DB_ID, settings.collection_user_levels, ID.unique(), {
                "user_id": user_id,
                "current_level": level,
                "current_pulse": total_pulse,
                "pulse_for_next": level * 100,
                "total_pulse_ever": total_pulse,
                "level_ups_count": 0,
                "prestige_rank": _get_prestige(total_pulse),
                "created_at": now_iso,
                "updated_at": now_iso,
            })
    except Exception as e:
        print(f"[!] Level check warning: {e}")


def _pulse_to_level(pulse: float) -> int:
    return max(1, min(150, int(pulse // 100) + 1))


def _get_prestige(pulse: float) -> str:
    if pulse >= 900:  return "Legend"
    if pulse >= 700:  return "Elite"
    if pulse >= 500:  return "Pro"
    if pulse >= 300:  return "Rising Star"
    if pulse >= 150:  return "Amateur"
    return "Rookie"


def _default_pulse(user_id: str, pulse: float = 100.0) -> dict:
    return {
        "user_id": user_id,
        "userId": user_id,
        "total_pulse": pulse,
        "totalPulse": pulse,
        "match_performance": 0,
        "matchPerformance": 0,
        "consistency": 0,
        "team_chemistry": 0,
        "teamChemistry": 0,
        "reliability": 0,
        "activity": 0,
        "leadership": 0,
        "tier": "contender",
        "level": 1,
        "level_progress_percent": 0,
        "prestige_rank": _get_prestige(pulse),
    }
