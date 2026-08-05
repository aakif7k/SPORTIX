import logging

from appwrite.query import Query as Q
from appwrite.id import ID
from app.core.appwrite import db, DB_ID
from app.core.config import settings
from app.utils.formatters import now_iso
from app.schemas.event import EventCreate
from app.services import notification_service
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

    # The paginated envelope every other list endpoint returns. This was the last
    # one handing back Appwrite's raw {documents, total}, which worked only because
    # the client unwraps both shapes — so a caller could not tell whether more pages
    # existed without doing the arithmetic itself.
    res = db.list_documents(DB_ID, settings.collection_events, queries=queries)
    total = int(res.get("total", 0))
    return {
        "items": res.get("documents", []),
        "total": total,
        "page": page,
        "limit": limit,
        "has_more": (page + 1) * limit < total,
    }


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


# --- Organizer roster management ---------------------------------------------
# ManageEvent could approve, reject and remove entrants, and send an announcement
# to everyone. None of it left the browser: approve and remove edited a zustand
# array, the two pending requests were hardcoded people with a made-up distance,
# and the announcement only flipped a "sent" flag for three seconds.

def _require_organizer(event_id: str, user_id: str) -> dict:
    try:
        event = db.get_document(DB_ID, settings.collection_events, event_id)
    except Exception as exc:
        raise FileNotFoundError("That event does not exist") from exc
    if event.get("organizer_id") != user_id:
        raise PermissionError("Only the organizer can manage this event")
    return event


def _participant_row(event_id: str, target_user_id: str) -> dict:
    rows = db.list_documents(
        DB_ID, settings.collection_event_participants,
        queries=[Q.equal("event_id", event_id), Q.equal("user_id", target_user_id),
                 Q.limit(1)],
    ).get("documents", [])
    if not rows:
        raise FileNotFoundError("That athlete is not entered in this event")
    return rows[0]


def _adjust_participant_count(event_id: str, delta: int) -> None:
    try:
        event = db.get_document(DB_ID, settings.collection_events, event_id)
        current = int(event.get("current_participants") or 0)
        db.update_document(
            DB_ID, settings.collection_events, event_id,
            {"current_participants": max(0, current + delta), "updated_at": now_iso()},
        )
    except Exception:
        # The roster is the source of truth; a stale counter is visible and
        # correctable, while failing here would lose the roster change itself.
        logger.warning("could not adjust participant count on %s", event_id,
                       exc_info=True)


async def set_participant_status(event_id: str, target_user_id: str,
                                 status: str, organizer_id: str) -> dict:
    """
    Confirm or withdraw an entrant.

    The "pending requests" in the UI are entrants still marked `registered`;
    approving moves them to `confirmed`. current_participants counts everyone
    holding a place, so it only moves when somebody withdraws or is reinstated.
    """
    _require_organizer(event_id, organizer_id)
    row = _participant_row(event_id, target_user_id)
    previous = row.get("status")

    updated = db.update_document(
        DB_ID, settings.collection_event_participants, row["$id"],
        {"status": status, "updated_at": now_iso()},
    )

    held_before = previous != "withdrawn"
    holds_now = status != "withdrawn"
    if held_before != holds_now:
        _adjust_participant_count(event_id, 1 if holds_now else -1)

    body = "Your entry status is now " + status + "."
    if status == "confirmed":
        body = "Your place has been confirmed."
    elif status == "withdrawn":
        body = "Your entry has been withdrawn."

    # The roster row is already written. Failing the request now would tell the
    # organizer their change did not happen when it did.
    try:
        await notification_service.create_notification(
            user_id=target_user_id, notif_type="team_update",
            title="Event entry updated", body=body,
            reference_id=event_id, reference_type="event",
        )
    except Exception:
        logger.warning("roster change on %s not announced to %s", event_id,
                       target_user_id, exc_info=True)
    return updated


async def remove_participant(event_id: str, target_user_id: str,
                             organizer_id: str) -> None:
    """Take an athlete off the roster entirely, freeing their slot."""
    _require_organizer(event_id, organizer_id)
    row = _participant_row(event_id, target_user_id)

    db.delete_document(DB_ID, settings.collection_event_participants, row["$id"])
    if row.get("status") != "withdrawn":
        _adjust_participant_count(event_id, -1)

    try:
        await notification_service.create_notification(
            user_id=target_user_id, notif_type="team_update",
            title="Removed from an event",
            body="The organizer has removed you from an event you entered.",
            reference_id=event_id, reference_type="event",
        )
    except Exception:
        logger.warning("removal from %s not announced to %s", event_id,
                       target_user_id, exc_info=True)


async def announce(event_id: str, message: str, organizer_id: str) -> dict:
    """Notify every entrant, which is what the broadcast box always claimed."""
    event = _require_organizer(event_id, organizer_id)
    if not message.strip():
        raise ValueError("An announcement needs a message")

    rows = db.list_documents(
        DB_ID, settings.collection_event_participants,
        queries=[Q.equal("event_id", event_id), Q.limit(200)],
    ).get("documents", [])

    audience = [
        row["user_id"] for row in rows
        # The organizer does not need telling what they just said, and somebody who
        # withdrew is no longer part of the event.
        if row.get("user_id") and row["user_id"] != organizer_id
        and row.get("status") != "withdrawn"
    ]

    sent, failed = 0, 0
    for target in audience:
        try:
            await notification_service.create_notification(
                user_id=target, notif_type="team_update",
                title="Announcement: " + str(event.get("title", "your event")),
                body=message.strip()[:500],
                reference_id=event_id, reference_type="event",
            )
            sent += 1
        except Exception:
            failed += 1
            logger.warning("could not notify %s about event %s", target, event_id,
                           exc_info=True)

    # One unreachable recipient should not lose the announcement for everybody
    # else, but reporting success having reached nobody is a lie: this returned
    # 200 with notified=0 while every single write was failing.
    if audience and not sent:
        raise RuntimeError("The announcement could not be delivered to anyone")

    return {"event_id": event_id, "notified": sent, "failed": failed,
            "audience": len(audience), "recipients": len(rows)}
