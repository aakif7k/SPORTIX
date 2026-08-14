from appwrite.id import ID
from appwrite.query import Query as Q
from app.core.appwrite import db, DB_ID
from app.core.config import settings
from app.schemas.event import EventCreate
from typing import Optional, Dict, Any
from datetime import datetime, timezone, timedelta


def _find_participant(event_id: str, user_id: str):
    """Queries for an existing participant document trying event_id or eventId."""
    for eq_event, eq_user in [("event_id", "user_id"), ("eventId", "userId")]:
        try:
            res = db.list_documents(
                DB_ID, settings.collection_event_participants,
                queries=[Q.equal(eq_event, event_id), Q.equal(eq_user, user_id), Q.limit(1)],
            )
            docs = res.get("documents", []) if isinstance(res, dict) else getattr(res, "documents", [])
            if docs:
                return docs[0]
        except Exception:
            continue
    return None


async def browse(
    sport: Optional[str] = None,
    event_type: Optional[str] = None,
    city: Optional[str] = None,
    status: Optional[str] = None,
    skill_level: Optional[str] = None,
    page: int = 0,
    limit: int = 20,
) -> dict:
    queries = [Q.limit(limit), Q.offset(page * limit)]
    if sport:
        queries.append(Q.equal("sport", sport))
    if city:
        queries.append(Q.equal("city", city))
    if skill_level:
        queries.append(Q.equal("skill_level", skill_level))

    return db.list_documents(DB_ID, settings.collection_events, queries=queries)


async def get_by_id(event_id: str) -> dict:
    return db.get_document(DB_ID, settings.collection_events, event_id)


async def create(user_id: str, payload: EventCreate) -> dict:
    data = payload.model_dump()
    data["organizer_id"] = user_id
    data["current_participants"] = 1
    now_iso = datetime.now(timezone.utc).isoformat()
    data["created_at"] = now_iso

    event_doc = db.create_document(
        DB_ID, settings.collection_events, ID.unique(), data=data
    )
    event_id = event_doc.get("$id") if isinstance(event_doc, dict) else getattr(event_doc, "id", None)

    # Automatically register organizer as first participant
    try:
        db.create_document(
            DB_ID, settings.collection_event_participants, ID.unique(),
            data={
                "event_id": event_id,
                "user_id": user_id,
                "role": "Captain",
                "entry_type": "solo",
                "status": "confirmed",
                "joined_at": now_iso,
                "created_at": now_iso,
            },
        )
    except Exception as e:
        print(f"[!] Warning registering organizer in event_participants: {e}")

    return event_doc


async def update(event_id: str, user_id: str, data: dict) -> dict:
    e = db.get_document(DB_ID, settings.collection_events, event_id)
    org_id = e.get("organizer_id") or e.get("organizerId")
    if org_id != user_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Only the organizer can edit this event")
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    return db.update_document(DB_ID, settings.collection_events, event_id, data=data)


async def cancel(event_id: str, user_id: str):
    e = db.get_document(DB_ID, settings.collection_events, event_id)
    org_id = e.get("organizer_id") or e.get("organizerId")
    if org_id != user_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Only the organizer can cancel this event")
    db.update_document(DB_ID, settings.collection_events, event_id, {"status": "cancelled"})


async def get_user_events(user_id: str) -> dict:
    parts = db.list_documents(
        DB_ID, settings.collection_event_participants,
        queries=[Q.equal("user_id", user_id), Q.limit(50)],
    )
    event_ids = [p.get("event_id") or p.get("eventId") for p in parts.get("documents", []) if p.get("event_id") or p.get("eventId")]
    if not event_ids:
        return {"total": 0, "documents": []}
    return db.list_documents(
        DB_ID, settings.collection_events,
        queries=[Q.equal("$id", event_ids[:25])],
    )


async def join(
    event_id: str,
    user_id: str,
    squad_id: Optional[str] = None,
    entry_type: str = "solo",
    role: Optional[str] = None,
) -> dict:
    e = db.get_document(DB_ID, settings.collection_events, event_id)
    status = str(e.get("status", "upcoming")).lower()
    if status in ["completed", "cancelled", "archived"]:
        raise ValueError("This event has ended and is no longer accepting registrations.")

    raw_date = e.get("ends_at") or e.get("endDate") or e.get("starts_at") or e.get("eventDate")
    if raw_date:
        try:
            dt = datetime.fromisoformat(str(raw_date).replace('Z', '+00:00'))
            if "T" not in str(raw_date):
                dt = dt + timedelta(days=1)
            if datetime.now(timezone.utc) > dt:
                raise ValueError("This event has ended and is no longer accepting registrations.")
        except ValueError as date_val_err:
            if "This event has ended" in str(date_val_err):
                raise date_val_err
        except Exception:
            pass

    # Check not already joined
    existing = _find_participant(event_id, user_id)
    if existing:
        # If user already registered, update their role
        if role:
            doc_id = existing.get("$id") if isinstance(existing, dict) else getattr(existing, "id", None)
            try:
                updated = db.update_document(
                    DB_ID, settings.collection_event_participants, doc_id,
                    data={"role": role, "updated_at": datetime.now(timezone.utc).isoformat()}
                )
                return updated
            except Exception:
                pass
        raise ValueError("Already registered for this event")

    now_iso = datetime.now(timezone.utc).isoformat()
    participant_data = {
        "event_id": event_id,
        "user_id": user_id,
        "role": role or "",
        "squad_id": squad_id,
        "entry_type": entry_type,
        "status": "registered",
        "joined_at": now_iso,
        "created_at": now_iso,
    }

    try:
        doc = db.create_document(
            DB_ID, settings.collection_event_participants, ID.unique(),
            data=participant_data,
        )
    except Exception as e:
        # Fallback to camelCase attributes if snake_case fails
        doc = db.create_document(
            DB_ID, settings.collection_event_participants, ID.unique(),
            data={
                "eventId": event_id,
                "userId": user_id,
                "role": role or "",
                "squadId": squad_id,
                "entryType": entry_type,
                "status": "registered",
            },
        )

    # Bump participants count in events doc
    try:
        curr_count = e.get("current_participants") or e.get("participantsCount") or 0
        field_name = "current_participants" if "current_participants" in e else "participantsCount"
        db.update_document(DB_ID, settings.collection_events, event_id, {field_name: curr_count + 1})
    except Exception:
        pass

    return doc


async def update_participant_role(event_id: str, user_id: str, new_role: str) -> dict:
    """Updates the selected role for an existing registered participant."""
    existing = _find_participant(event_id, user_id)
    if not existing:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Participant record not found")

    doc_id = existing.get("$id") if isinstance(existing, dict) else getattr(existing, "id", None)
    now_iso = datetime.now(timezone.utc).isoformat()
    return db.update_document(
        DB_ID, settings.collection_event_participants, doc_id,
        data={"role": new_role, "updated_at": now_iso}
    )


async def leave(event_id: str, user_id: str):
    existing = _find_participant(event_id, user_id)
    if existing:
        doc_id = existing.get("$id") if isinstance(existing, dict) else getattr(existing, "id", None)
        db.delete_document(DB_ID, settings.collection_event_participants, doc_id)
    try:
        e = db.get_document(DB_ID, settings.collection_events, event_id)
        curr_count = e.get("current_participants") or e.get("participantsCount") or 1
        field_name = "current_participants" if "current_participants" in e else "participantsCount"
        db.update_document(DB_ID, settings.collection_events, event_id, {field_name: max(0, curr_count - 1)})
    except Exception:
        pass


async def get_participants(event_id: str) -> dict:
    try:
        return db.list_documents(
            DB_ID, settings.collection_event_participants,
            queries=[Q.equal("event_id", event_id), Q.limit(200)],
        )
    except Exception:
        return db.list_documents(
            DB_ID, settings.collection_event_participants,
            queries=[Q.equal("eventId", event_id), Q.limit(200)],
        )
