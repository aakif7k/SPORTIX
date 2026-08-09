import os
import json
from datetime import datetime, timezone
from appwrite.query import Query as Q
from appwrite.id import ID
from app.core.appwrite import db, DB_ID
from app.core.config import settings
from app.services.ai_squad_service import compute_player_ssr, compute_pair_chemistry, MATCH_WEIGHTS

# Target squad sizes by sport + format
SPORT_TARGET_SIZES = {
    ("Football", "11v11"): 11,
    ("Football", "5v5"): 5,
    ("Football", "futsal"): 5,
    ("Football", "team"): 5,
    ("Football", "solo"): 5,
    ("Basketball", "5v5"): 5,
    ("Basketball", "3x3"): 3,
    ("Basketball", "solo"): 5,
    ("Basketball", "team"): 5,
    ("Cricket", "11v11"): 11,
    ("Cricket", "team"): 11,
    ("Volleyball", "6v6"): 6,
    ("Volleyball", "team"): 6,
    ("Padel", "doubles"): 2,
    ("Padel", "2v2"): 2,
    ("Tennis", "singles"): 2,
    ("Tennis", "doubles"): 2,
}

def get_target_squad_size(sport: str, format_str: str = "") -> int:
    fmt = (format_str or "").lower().strip()
    key = (sport, fmt)
    if key in SPORT_TARGET_SIZES:
        return SPORT_TARGET_SIZES[key]
    
    # Fallback by sport name
    if sport == "Football":
        return 11 if "11" in fmt else 5
    if sport == "Basketball":
        return 3 if "3" in fmt else 5
    if sport == "Cricket":
        return 11
    if sport == "Volleyball":
        return 6
    if sport in ["Padel", "Tennis"]:
        return 2
    return 5


async def get_event_readiness(event_id: str, user_id: str | None = None) -> dict:
    """
    Calculates derived event readiness state from Appwrite event_participants.
    LOCKED (< 10 athletes) -> AUTOSQUAD_READY (>= 10 athletes).
    If user_id is provided and event is READY, evaluates candidate matches for the user
    and returns partial squad progress (e.g. 4 / 5 perfect players found).
    NEVER consumes the user's 5 daily AutoSquad generations quota.
    """
    # Load event doc
    try:
        event_doc = db.get_document(DB_ID, settings.collection_events, event_id)
    except Exception:
        event_doc = {}

    sport = event_doc.get("sport", "Football")
    event_format = event_doc.get("format", "team")
    max_participants = event_doc.get("max_participants", 32)
    target_squad_size = get_target_squad_size(sport, event_format)

    # Fetch event participants from Appwrite
    try:
        parts_res = db.list_documents(
            DB_ID,
            settings.collection_event_participants,
            queries=[Q.equal("event_id", event_id), Q.limit(200)]
        )
        participants = [
            p for p in parts_res.get("documents", [])
            if p.get("status") in ["confirmed", "registered", None]
        ]
    except Exception:
        participants = []

    eligible_count = len(participants)

    # Determine event readiness state
    if max_participants and eligible_count >= max_participants:
        readiness_state = "FULL"
    elif eligible_count >= 10:
        readiness_state = "AUTOSQUAD_READY"
    else:
        readiness_state = "WAITING_FOR_PLAYERS"

    # Individual User Candidate Evaluation (if user_id provided)
    matched_players = 0
    remaining_needed = target_squad_size - 1  # excluding current user
    matching_state = readiness_state

    if user_id and readiness_state in ["AUTOSQUAD_READY", "FULL"]:
        other_participant_ids = [p.get("user_id") for p in participants if p.get("user_id") and p.get("user_id") != user_id]
        
        if other_participant_ids:
            # Fetch profiles for other participants
            cand_profiles = []
            for cand_id in other_participant_ids[:50]:
                try:
                    cp = db.get_document(DB_ID, settings.collection_users, cand_id)
                    cand_profiles.append(cp)
                except Exception:
                    pass
            
            # Fetch user profile
            try:
                user_prof = db.get_document(DB_ID, settings.collection_users, user_id)
            except Exception:
                user_prof = {"$id": user_id, "level": 1, "experience_level": "amateur"}

            user_ssr, _ = compute_player_ssr(user_prof, [])
            user_level = user_prof.get("level", 1)

            # Evaluate suitability threshold (compat >= 70%)
            suitable_matches = 0
            for cp in cand_profiles:
                cand_ssr, _ = compute_player_ssr(cp, [])
                skill_score = max(0.0, 100.0 - (abs(user_ssr - cand_ssr) * 2.5))
                level_score = max(0.0, 100.0 - (abs(user_level - cp.get("level", 1)) * 4.0))
                distance_score = 90.0
                position_score = 85.0
                activity_score = min(100.0, (cp.get("pulse_score", 100.0) / 10.0))
                
                compat = round(
                    (skill_score * MATCH_WEIGHTS["SKILL_SSR"]) +
                    (position_score * MATCH_WEIGHTS["POSITION_FIT"]) +
                    (distance_score * MATCH_WEIGHTS["DISTANCE"]) +
                    (level_score * MATCH_WEIGHTS["LEVEL_SIMILARITY"]) +
                    (activity_score * MATCH_WEIGHTS["ACTIVITY_PULSE"]) +
                    (70.0 * MATCH_WEIGHTS["HISTORICAL_COMPAT"]),
                    1
                )
                if compat >= 70.0:
                    suitable_matches += 1

            matched_players = min(target_squad_size - 1, suitable_matches)
            remaining_needed = max(0, (target_squad_size - 1) - matched_players)

            if matched_players >= target_squad_size - 1:
                matching_state = "SQUAD_READY"
                # Trigger squad_ready notification for user (idempotent)
                await check_and_notify_squad_ready(event_id, user_id, matched_players, target_squad_size)
            elif matched_players > 0:
                matching_state = "SQUAD_FORMING"

    return {
        "event_id": event_id,
        "sport": sport,
        "format": event_format,
        "eligible_count": eligible_count,
        "min_required": 10,
        "max_participants": max_participants,
        "is_autosquad_ready": eligible_count >= 10,
        "readiness_state": readiness_state,
        "matching_state": matching_state,
        "target_squad_size": target_squad_size,
        "matched_players": matched_players + (1 if user_id else 0),  # include current user in count
        "remaining_needed": remaining_needed,
    }


async def check_and_notify_event_readiness(event_id: str) -> bool:
    """
    Checks if event has reached 10 eligible participants.
    If yes and notification hasn't been sent yet, creates an idempotent
    Appwrite notification for all registered participants.
    """
    try:
        parts_res = db.list_documents(
            DB_ID,
            settings.collection_event_participants,
            queries=[Q.equal("event_id", event_id), Q.limit(200)]
        )
        participants = [
            p for p in parts_res.get("documents", [])
            if p.get("status") in ["confirmed", "registered", None]
        ]
    except Exception:
        participants = []

    if len(participants) < 10:
        return False

    # Check if notification already sent for this event
    try:
        existing = db.list_documents(
            DB_ID,
            settings.collection_notifications,
            queries=[
                Q.equal("entity_id", event_id),
                Q.equal("type", "event_autosquad_ready"),
                Q.limit(1)
            ]
        )
        if existing.get("documents") and len(existing["documents"]) > 0:
            return False  # Already sent, prevent duplicate notification
    except Exception:
        pass

    # Create idempotent notifications for all registered participants
    now_iso = datetime.now(timezone.utc).isoformat()
    for p in participants:
        user_id = p.get("user_id")
        if not user_id:
            continue
        try:
            db.create_document(
                DB_ID,
                settings.collection_notifications,
                ID.unique(),
                data={
                    "user_id": user_id,
                    "type": "event_autosquad_ready",
                    "title": "Your event is ready for AutoSquad ⚡",
                    "body": "10 athletes have joined. AutoSquad can now start building your squad.",
                    "entity_id": event_id,
                    "entity_type": "event",
                    "is_read": False,
                    "created_at": now_iso,
                }
            )
        except Exception:
            pass  # Ignore individual insertion failure

    return True


async def check_and_notify_squad_ready(event_id: str, user_id: str, matched_count: int, target_size: int) -> bool:
    """
    Checks if target squad size is complete for user.
    Creates an idempotent notification for that user.
    """
    if matched_count < target_size - 1:
        return False

    try:
        existing = db.list_documents(
            DB_ID,
            settings.collection_notifications,
            queries=[
                Q.equal("user_id", user_id),
                Q.equal("entity_id", event_id),
                Q.equal("type", "squad_ready"),
                Q.limit(1)
            ]
        )
        if existing.get("documents") and len(existing["documents"]) > 0:
            return False
    except Exception:
        pass

    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        db.create_document(
            DB_ID,
            settings.collection_notifications,
            ID.unique(),
            data={
                "user_id": user_id,
                "type": "squad_ready",
                "title": "Your crew is ready! ⚡",
                "body": "Your AutoSquad has found the perfect players for your event.",
                "entity_id": event_id,
                "entity_type": "event",
                "is_read": False,
                "created_at": now_iso,
            }
        )
        return True
    except Exception:
        return False
