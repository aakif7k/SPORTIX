import logging

from appwrite.query import Query as Q
from appwrite.id import ID
from app.core.appwrite import db, DB_ID
from app.core.config import settings
from app.utils.formatters import now_iso
from app.schemas.event import EventCreate
from typing import Optional

logger = logging.getLogger(__name__)


async def browse(
    sport: Optional[str] = None,
    event_type: Optional[str] = None,
    city: Optional[str] = None,
    status: Optional[str] = None,
    skill_level: Optional[str] = None,
    page: int = 0,
    limit: int = 20,
) -> dict:
    queries = [Q.limit(limit), Q.offset(page * limit), Q.order_asc("starts_at")]
    if sport:
        queries.append(Q.equal("sport", sport))
    if event_type:
        queries.append(Q.equal("format", event_type))
    if city:
        queries.append(Q.equal("city", city))
    if status:
        queries.append(Q.equal("status", status))
    if skill_level:
        queries.append(Q.equal("skill_level", skill_level))
    return db.list_documents(DB_ID, settings.collection_events, queries=queries)


async def create(user_id: str, payload: EventCreate) -> dict:
    return db.create_document(
        DB_ID, settings.collection_events, ID.unique(),
        data={
            "created_at": now_iso(),
            "organizer_id": user_id,
            "title": payload.title,
            "description": payload.description,
            "sport": payload.sport,
            "format": payload.format.value,
            "skill_level": payload.skill_level,
            "venue": payload.venue,
            "city": payload.city,
            "starts_at": payload.event_date,
            "ends_at": payload.end_date,
            "registration_deadline": payload.registration_deadline,
            "max_participants": payload.max_participants,
            "min_participants": payload.min_participants,
            "entry_fee": payload.entry_fee,
            "prize_pool": payload.prize_pool,
            "rules": payload.rules,
            "ai_team_available": payload.is_ai_managed,
            "status": "upcoming",
            "current_participants": 0,
        },
    )


async def get_by_id(event_id: str) -> dict:
    return db.get_document(DB_ID, settings.collection_events, event_id)


async def get_user_events(user_id: str) -> dict:
    created = db.list_documents(
        DB_ID, settings.collection_events,
        queries=[Q.equal("organizer_id", user_id), Q.order_desc("$createdAt")],
    )
    joined = db.list_documents(
        DB_ID, settings.collection_event_participants,
        queries=[Q.equal("user_id", user_id), Q.limit(50)],
    )
    return {"created": created, "joined": joined}


async def update(event_id: str, user_id: str, data: dict) -> dict:
    doc = db.get_document(DB_ID, settings.collection_events, event_id)
    if doc.get("organizer_id") != user_id:
        raise PermissionError("Only the organizer can update this event")
    return db.update_document(DB_ID, settings.collection_events, event_id, data)


async def cancel(event_id: str, user_id: str):
    doc = db.get_document(DB_ID, settings.collection_events, event_id)
    if doc.get("organizer_id") != user_id:
        raise PermissionError("Only the organizer can cancel this event")
    db.update_document(DB_ID, settings.collection_events, event_id, {"status": "cancelled"})


async def join(event_id: str, user_id: str, squad_id: Optional[str], entry_type: str) -> dict:
    # Check not already joined
    existing = db.list_documents(
        DB_ID, settings.collection_event_participants,
        queries=[Q.equal("event_id", event_id), Q.equal("user_id", user_id), Q.limit(1)],
    )
    if existing.get("documents"):
        raise ValueError("Already registered for this event")

    doc = db.create_document(
        DB_ID, settings.collection_event_participants, ID.unique(),
        data={
            "created_at": now_iso(),
            "event_id": event_id,
            "user_id": user_id,
            "squad_id": squad_id,
            "entry_type": entry_type,
            "status": "registered",
            "joined_at": now_iso(),
        },
    )
    # Bump participants count
    e = db.get_document(DB_ID, settings.collection_events, event_id)
    db.update_document(DB_ID, settings.collection_events, event_id,
                       {"current_participants": e.get("current_participants", 0) + 1})
    return doc


async def leave(event_id: str, user_id: str):
    existing = db.list_documents(
        DB_ID, settings.collection_event_participants,
        queries=[Q.equal("event_id", event_id), Q.equal("user_id", user_id), Q.limit(1)],
    )
    for doc in existing.get("documents", []):
        db.delete_document(DB_ID, settings.collection_event_participants, doc["$id"])
    try:
        e = db.get_document(DB_ID, settings.collection_events, event_id)
        db.update_document(DB_ID, settings.collection_events, event_id,
                           {"current_participants": max(0, e.get("current_participants", 1) - 1)})
    except Exception:
        pass


async def get_participants(event_id: str) -> dict:
    """
    An event's entrants, with each one's profile joined in.

    The rows hold only a user_id, so a roster had no name and no avatar to show.
    EventDetail and ManageEvent both papered over that by looking the participant
    up in MOCK_USERS and falling back to a random pravatar image, which meant a
    real event showed fictional people. Joining here is the same fix the squad
    roster needed, and for the same reason: the page cannot query profiles itself.
    """
    res = db.list_documents(
        DB_ID, settings.collection_event_participants,
        queries=[Q.equal("event_id", event_id), Q.limit(200)],
    )
    rows = res.get("documents", [])

    items = []
    for row in rows:
        user_id = row.get("user_id", "")
        profile = {}
        if user_id:
            try:
                profile = db.get_document(DB_ID, settings.collection_users, user_id)
            except Exception:
                # A participant whose profile is gone still occupies a slot, so the
                # row stays and the name is left blank rather than dropping them.
                logger.warning("participant %s has no profile", user_id)
        items.append({
            **row,
            "full_name": profile.get("full_name", ""),
            "username": profile.get("username", ""),
            "avatar_url": profile.get("avatar_url"),
            "sport": profile.get("sport", ""),
            "position": profile.get("position"),
            "level": int(profile.get("level") or 1),
            "pulse_score": float(profile.get("pulse_score") or 0),
            "experience_level": profile.get("experience_level", ""),
            "city": profile.get("city", ""),
        })

    return {"items": items, "documents": items, "total": res.get("total", len(items))}
