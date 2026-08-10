from appwrite.query import Query as Q
from appwrite.id import ID
from app.core.appwrite import db, DB_ID
from app.core.config import settings
from app.schemas.event import EventCreate
from typing import Optional


async def browse(
    sport: Optional[str] = None,
    event_type: Optional[str] = None,
    city: Optional[str] = None,
    status: Optional[str] = None,
    skill_level: Optional[str] = None,
    page: int = 0,
    limit: int = 20,
) -> dict:
    queries = [Q.limit(limit), Q.offset(page * limit), Q.order_asc("eventDate")]
    if sport:
        queries.append(Q.equal("sport", sport))
    if event_type:
        queries.append(Q.equal("eventType", event_type))
    if city:
        queries.append(Q.equal("city", city))
    if status:
        queries.append(Q.equal("status", status))
    if skill_level:
        queries.append(Q.equal("skillLevel", skill_level))
    return db.list_documents(DB_ID, settings.collection_events, queries=queries)


async def create(user_id: str, payload: EventCreate) -> dict:
    return db.create_document(
        DB_ID, settings.collection_events, ID.unique(),
        data={
            "organizerId": user_id,
            "title": payload.title,
            "description": payload.description,
            "sport": payload.sport,
            "eventType": payload.event_type.value,
            "format": payload.format.value,
            "skillLevel": payload.skill_level,
            "venue": payload.venue,
            "city": payload.city,
            "eventDate": payload.event_date,
            "endDate": payload.end_date,
            "registrationDeadline": payload.registration_deadline,
            "maxParticipants": payload.max_participants,
            "minParticipants": payload.min_participants,
            "entryFee": payload.entry_fee,
            "prizePool": payload.prize_pool,
            "rules": payload.rules,
            "isAiManaged": payload.is_ai_managed,
            "status": "upcoming",
            "participantsCount": 0,
        },
    )


async def get_by_id(event_id: str) -> dict:
    return db.get_document(DB_ID, settings.collection_events, event_id)


async def get_user_events(user_id: str) -> dict:
    created = db.list_documents(
        DB_ID, settings.collection_events,
        queries=[Q.equal("organizerId", user_id), Q.order_desc("$createdAt")],
    )
    joined = db.list_documents(
        DB_ID, settings.collection_event_participants,
        queries=[Q.equal("userId", user_id), Q.limit(50)],
    )
    return {"created": created, "joined": joined}


async def update(event_id: str, user_id: str, data: dict) -> dict:
    doc = db.get_document(DB_ID, settings.collection_events, event_id)
    if doc.get("organizerId") != user_id:
        raise PermissionError("Only the organizer can update this event")
    return db.update_document(DB_ID, settings.collection_events, event_id, data)


async def cancel(event_id: str, user_id: str):
    doc = db.get_document(DB_ID, settings.collection_events, event_id)
    if doc.get("organizerId") != user_id:
        raise PermissionError("Only the organizer can cancel this event")
    db.update_document(DB_ID, settings.collection_events, event_id, {"status": "cancelled"})


async def join(event_id: str, user_id: str, squad_id: Optional[str], entry_type: str) -> dict:
    e = db.get_document(DB_ID, settings.collection_events, event_id)
    status = str(e.get("status", "upcoming")).lower()
    if status in ["completed", "cancelled", "archived"]:
        raise ValueError("This event has ended and is no longer accepting registrations.")

    import datetime
    raw_date = e.get("ends_at") or e.get("endDate") or e.get("starts_at") or e.get("eventDate")
    if raw_date:
        try:
            dt = datetime.datetime.fromisoformat(str(raw_date).replace('Z', '+00:00'))
            if "T" not in str(raw_date):
                dt = dt + datetime.timedelta(days=1)
            if datetime.datetime.now(datetime.timezone.utc) > dt:
                raise ValueError("This event has ended and is no longer accepting registrations.")
        except ValueError as date_val_err:
            if "This event has ended" in str(date_val_err):
                raise date_val_err
        except Exception:
            pass

    # Check not already joined
    existing = db.list_documents(
        DB_ID, settings.collection_event_participants,
        queries=[Q.equal("eventId", event_id), Q.equal("userId", user_id), Q.limit(1)],
    )
    if existing.get("documents"):
        raise ValueError("Already registered for this event")

    doc = db.create_document(
        DB_ID, settings.collection_event_participants, ID.unique(),
        data={
            "eventId": event_id,
            "userId": user_id,
            "squadId": squad_id,
            "entryType": entry_type,
            "status": "registered",
        },
    )
    # Bump participants count
    db.update_document(DB_ID, settings.collection_events, event_id,
                       {"participantsCount": e.get("participantsCount", 0) + 1})
    return doc


async def leave(event_id: str, user_id: str):
    existing = db.list_documents(
        DB_ID, settings.collection_event_participants,
        queries=[Q.equal("eventId", event_id), Q.equal("userId", user_id), Q.limit(1)],
    )
    for doc in existing.get("documents", []):
        db.delete_document(DB_ID, settings.collection_event_participants, doc["$id"])
    try:
        e = db.get_document(DB_ID, settings.collection_events, event_id)
        db.update_document(DB_ID, settings.collection_events, event_id,
                           {"participantsCount": max(0, e.get("participantsCount", 1) - 1)})
    except Exception:
        pass


async def get_participants(event_id: str) -> dict:
    return db.list_documents(
        DB_ID, settings.collection_event_participants,
        queries=[Q.equal("eventId", event_id), Q.limit(200)],
    )
