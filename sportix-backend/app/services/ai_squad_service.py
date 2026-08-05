import json
from appwrite.query import Query as Q
from appwrite.id import ID
from app.core.appwrite import db, DB_ID
from app.core.config import settings
from app.utils.formatters import now_iso
from app.schemas.ai import AutoSquadRequest
from datetime import date
import random


async def find_candidates(sport: str, skill_level: str, exclude_user_id: str) -> list[dict]:
    """
    Athletes who could join a squad, best Pulse first.

    Extracted so the AI proxy scores the same pool by the same rule rather than
    writing a second query that could drift away from this one. Each row carries
    `_pulse` and a `pulse_score` mirror, because the AI prompt and the client both
    want it under a normal name.
    """
    candidates = db.list_documents(DB_ID, settings.collection_users, queries=[
        Q.equal("sport", sport),
        Q.equal("experience_level", skill_level),
        Q.not_equal("$id", exclude_user_id),
        Q.limit(50),
    ]).get("documents", [])

    scored = []
    for c in candidates:
        try:
            res = db.list_documents(
                DB_ID, settings.collection_pulse_scores,
                queries=[Q.equal("user_id", c["$id"]), Q.limit(1)],
            )
            docs = res.get("documents", [])
            pulse = float(docs[0].get("total_pulse", 100)) if docs else 100.0
        except Exception:
            # A missing Pulse row is a new account, not a failure; 100 is the
            # starting score every account is seeded with.
            pulse = 100.0
        scored.append({**c, "_pulse": pulse, "pulse_score": pulse})

    scored.sort(key=lambda x: x["_pulse"], reverse=True)
    return scored


async def generate(user_id: str, payload: AutoSquadRequest) -> dict:
    """
    AI AutoSquad generator.
    Finds compatible players matching sport + skill level
    and builds an optimal squad suggestion.
    Uses generation quota (MAX_AUTOSQUAD_GENERATIONS per day).
    """
    # Check daily quota
    remaining = await get_remaining(user_id)
    if remaining["remaining"] <= 0:
        raise ValueError(f"Daily AutoSquad limit reached ({settings.max_autosquad_generations}/day)")

    scored = await find_candidates(payload.sport, payload.skill_level.value, user_id)
    squad_size = {"solo": 0, "duo": 1, "squad": 4}.get(payload.entry_type.value, 0)
    suggested = scored[:squad_size]

    # Record the generation request
    # entry_type and the suggested ids are request parameters, not columns; the
    # collection carries a `params` JSON blob for exactly this. Storing them as
    # attributes referenced fields that do not exist on autosquad_requests.
    request_doc = db.create_document(
        DB_ID, settings.collection_autosquad_requests, ID.unique(),
        data={
            "user_id": user_id,
            "sport": payload.sport,
            "event_id": payload.event_id,
            "skill_level": payload.skill_level.value,
            "params": json.dumps({
                "entry_type": payload.entry_type.value,
                "suggested_player_ids": [s["$id"] for s in suggested],
            }),
            "status": "pending",
            "created_at": now_iso(),
        },
    )

    return {
        "request_id": request_doc["$id"],
        "suggested_squad": suggested,
        "match_quality": _score_squad(suggested),
        "entry_type": payload.entry_type.value,
    }


async def get_history(user_id: str) -> dict:
    return db.list_documents(
        DB_ID, settings.collection_autosquad_requests,
        queries=[Q.equal("user_id", user_id), Q.limit(20), Q.order_desc("$createdAt")],
    )


async def get_remaining(user_id: str) -> dict:
    # Counted with Q.equal("date", ...) against a non-existent column, so `used`
    # was always 0 and the generation limit never actually applied. created_at is
    # indexed on this collection, so a range query is the right tool.
    today = date.today().isoformat()
    res = db.list_documents(
        DB_ID, settings.collection_autosquad_requests,
        queries=[
            Q.equal("user_id", user_id),
            Q.greater_than_equal("created_at", f"{today}T00:00:00.000+00:00"),
            Q.limit(100),
        ],
    )
    used = res.get("total", 0)
    remaining = max(0, settings.max_autosquad_generations - used)
    return {"used": used, "remaining": remaining, "max": settings.max_autosquad_generations}


async def accept(request_id: str, user_id: str) -> dict:
    doc = db.get_document(DB_ID, settings.collection_autosquad_requests, request_id)
    if doc.get("user_id") != user_id:
        raise PermissionError("Not your AutoSquad request")
    return db.update_document(DB_ID, settings.collection_autosquad_requests, request_id, {"status": "accepted"})


async def reject(request_id: str, user_id: str):
    doc = db.get_document(DB_ID, settings.collection_autosquad_requests, request_id)
    if doc.get("user_id") != user_id:
        raise PermissionError("Not your AutoSquad request")
    db.update_document(DB_ID, settings.collection_autosquad_requests, request_id, {"status": "rejected"})


def _score_squad(members: list) -> str:
    if not members:
        return "N/A"
    avg = sum(m.get("_pulse", 100) for m in members) / len(members)
    if avg >= 700:  return "S-Tier"
    if avg >= 500:  return "A-Tier"
    if avg >= 300:  return "B-Tier"
    return "C-Tier"
