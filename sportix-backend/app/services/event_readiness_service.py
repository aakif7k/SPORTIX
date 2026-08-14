import os
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from appwrite.query import Query as Q
from appwrite.id import ID
from app.core.appwrite import db, DB_ID
from app.core.config import settings
from app.services.sports_role_service import get_sport_role_by_id
from app.services.universal_role_engine import allocate_event_participants, validate_sport_config
from app.services.ai_squad_service import compute_player_ssr, compute_pair_chemistry, MATCH_WEIGHTS


def get_target_squad_size(sport: str, format_str: str = "") -> int:
    """
    Dynamically gets target squad size from sportix_sport_roles table.
    Falls back to format string if specified (e.g. 11v11 -> 11, 5v5 -> 5, 6v6 -> 6, 3x3 -> 3, singles -> 1, doubles -> 2).
    """
    fmt = (format_str or "").lower().strip()
    if "11" in fmt:
        return 11
    if "6" in fmt or "6v6" in fmt:
        return 6
    if "3x3" in fmt or "3v3" in fmt:
        return 3
    if "5v5" in fmt or "futsal" in fmt:
        return 5
    if "singles" in fmt or "1v1" in fmt:
        return 2 if sport in ["Tennis", "Padel", "Badminton", "Table Tennis", "Squash"] else 1
    if "doubles" in fmt or "2v2" in fmt:
        return 2

    config = get_sport_role_by_id(sport)
    if config:
        return int(config.get("total_players", 1))

    return 5


async def get_event_readiness(event_id: str, user_id: str | None = None) -> dict:
    """
    Universal sport-agnostic event readiness and team/group allocation calculation.
    Reads sport role configuration from sportix_sport_roles and event_participants from Appwrite.
    """
    # 1. Load event doc
    try:
        event_doc = db.get_document(DB_ID, settings.collection_events, event_id)
    except Exception:
        event_doc = {}

    sport = event_doc.get("sport", "Football")
    event_format = event_doc.get("format", "team")
    max_participants = int(event_doc.get("max_participants", 32) or 32)

    # 2. Load sport role configuration dynamically from sportix_sport_roles
    sport_config = get_sport_role_by_id(sport) or {
        "sport_id": "S001",
        "sport": sport,
        "role_1": "Athlete",
        "role_1_count": 1,
        "role_2": "Captain",
        "role_2_count": 1,
        "role_3": "Support",
        "role_3_count": 1,
        "role_4": "Specialist",
        "role_4_count": 1,
        "total_players": 4,
    }

    target_squad_size = int(sport_config.get("total_players", 1))

    # 3. Fetch event participants from Appwrite
    participants = []
    try:
        parts_res = db.list_documents(
            DB_ID,
            settings.collection_event_participants,
            queries=[Q.equal("event_id", event_id), Q.limit(200)]
        )
        docs = parts_res.get("documents", []) if isinstance(parts_res, dict) else getattr(parts_res, "documents", [])
        for d in docs:
            p_dict = d if isinstance(d, dict) else getattr(d, "data", d.__dict__)
            # Support both event_id / eventId, user_id / userId
            status = p_dict.get("status")
            if status in ["confirmed", "registered", None]:
                participants.append({
                    "user_id": p_dict.get("user_id") or p_dict.get("userId"),
                    "event_id": p_dict.get("event_id") or p_dict.get("eventId"),
                    "role": p_dict.get("role"),
                    "status": status or "registered",
                    "joined_at": p_dict.get("joined_at") or p_dict.get("created_at") or p_dict.get("$createdAt"),
                })
    except Exception as e:
        print(f"[!] Warning fetching event_participants for readiness: {e}")

    eligible_count = len(participants)

    # 4. Run Universal Role Engine Allocation
    allocation = allocate_event_participants(
        sport_config=sport_config,
        participants=participants,
        event_capacity=max_participants,
        event_id=event_id,
        event_format=event_format,
    )

    # 5. Determine overall event readiness state
    if max_participants and eligible_count >= max_participants:
        readiness_state = "FULL"
    elif eligible_count >= 10:
        readiness_state = "AUTOSQUAD_READY"
    else:
        readiness_state = "WAITING_FOR_PLAYERS"

    # 6. Locate user assignment (if user_id provided)
    user_team = None
    user_role_assignment = None
    user_is_waiting = False
    user_waiting_reason = None

    if user_id:
        for t in allocation.teams:
            for pl in t.players:
                if pl.user_id == user_id:
                    user_team = t.team_index
                    user_role_assignment = pl.assigned_role
                    break
            if user_team is not None:
                break

        if user_team is None:
            for wp in allocation.waiting_players:
                if wp.user_id == user_id:
                    user_is_waiting = True
                    user_waiting_reason = wp.reason
                    break

    # Calculate matched players in user's team or first forming team
    if user_team is not None:
        target_t = next((t for t in allocation.teams if t.team_index == user_team), None)
        matched_players = target_t.current_players if target_t else 1
        remaining_needed = target_t.remaining_players if target_t else max(0, target_squad_size - 1)
    else:
        forming_t = next((t for t in allocation.teams if t.status in ["FORMING", "WAITING"]), None)
        matched_players = forming_t.current_players if forming_t else 0
        remaining_needed = forming_t.remaining_players if forming_t else target_squad_size

    return {
        "event_id": event_id,
        "sport": sport,
        "sport_id": sport_config.get("sport_id", "S001"),
        "format": event_format,
        "eligible_count": eligible_count,
        "min_required": 10,
        "max_participants": max_participants,
        "is_autosquad_ready": readiness_state in ["AUTOSQUAD_READY", "FULL"],
        "readiness_state": readiness_state,
        "matching_state": readiness_state,
        "target_squad_size": target_squad_size,
        "matched_players": matched_players,
        "remaining_needed": remaining_needed,
        "user_team_index": user_team,
        "user_role_assignment": user_role_assignment,
        "user_is_waiting": user_is_waiting,
        "user_waiting_reason": user_waiting_reason,
        "allocation": allocation.model_dump(),
    }


async def check_and_notify_event_readiness(event_id: str) -> bool:
    """
    Checks if an event has reached min athletes (>= 10) to be unlocked for AutoSquad.
    Creates an idempotent notification for all registered participants.
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
            return False
    except Exception:
        pass

    # Create idempotent notifications for all registered participants
    now_iso = datetime.now(timezone.utc).isoformat()
    for p in participants:
        uid = p.get("user_id") or p.get("userId")
        if not uid:
            continue
        try:
            db.create_document(
                DB_ID,
                settings.collection_notifications,
                ID.unique(),
                data={
                    "user_id": uid,
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
            pass

    return True


async def check_and_notify_squad_ready(event_id: str, user_id: str, matched_count: int, target_size: int) -> bool:
    """
    Checks if target squad size is complete for user.
    Creates an idempotent notification for that user.
    """
    if matched_count < target_size:
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
