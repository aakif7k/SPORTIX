"""
Event crews: the ad-hoc team an athlete forms for one event.

The crews and crew_members collections were provisioned in phase 2 and no code
ever touched them. EventCrewPage held a MOCK_CREW array in the component, a crew
name typed into local state, and kick/invite/ready buttons that filtered that
array — so a crew existed only until the page unmounted, and no teammate could
ever see it.

A crew is distinct from a squad: a squad is a standing team with chemistry and a
Pulse history, while a crew is assembled for a single event and referenced by
event_participants.crew_id. That column already existed with nothing to point at.

Readiness is deliberately not stored on crew_members. The roster has a `role` and
a `position` and no readiness column, and an event crew's readiness is really
"has this person confirmed their entry", which event_participants.status already
records. Reading it from there means one answer rather than two that can disagree.
"""
from __future__ import annotations

import logging

from appwrite.exception import AppwriteException
from appwrite.id import ID
from appwrite.query import Query as Q

from app.core.appwrite import db, DB_ID
from app.core.config import settings
from app.utils.formatters import now_iso

logger = logging.getLogger(__name__)

CREWS = settings.collection_crews
CREW_MEMBERS = settings.collection_crew_members
PARTICIPANTS = settings.collection_event_participants
PROFILES = settings.collection_users
EVENTS = settings.collection_events

MAX_CREW = 32


def _crew(crew_id: str) -> dict:
    try:
        return db.get_document(DB_ID, CREWS, crew_id)
    except AppwriteException as exc:
        raise FileNotFoundError("That crew does not exist") from exc


def _members(crew_id: str) -> list[dict]:
    return db.list_documents(DB_ID, CREW_MEMBERS, queries=[
        Q.equal("crew_id", crew_id), Q.limit(MAX_CREW),
    ]).get("documents", [])


def _require_captain(crew: dict, user_id: str) -> None:
    if crew.get("captain_id") != user_id:
        raise PermissionError("Only the crew's captain can do that")


def _participant_status(event_id: str, user_id: str) -> str:
    """
    Whether this athlete has confirmed their entry to the event.

    This is what the roster's "ready / maybe / unavailable" chip means for a crew,
    so it is read from the entry rather than duplicated onto crew_members.
    """
    rows = db.list_documents(DB_ID, PARTICIPANTS, queries=[
        Q.equal("event_id", event_id), Q.equal("user_id", user_id), Q.limit(1),
    ]).get("documents", [])
    return rows[0].get("status", "registered") if rows else "not_entered"


def _shape_member(row: dict, event_id: str) -> dict:
    user_id = row.get("user_id", "")
    profile = {}
    if user_id:
        try:
            profile = db.get_document(DB_ID, PROFILES, user_id)
        except AppwriteException:
            logger.warning("crew member %s has no profile", user_id)

    status = _participant_status(event_id, user_id)
    return {
        **row,
        "full_name": profile.get("full_name", ""),
        "username": profile.get("username", ""),
        "avatar_url": profile.get("avatar_url"),
        "sport": profile.get("sport", ""),
        "level": int(profile.get("level") or 1),
        "pulse_score": float(profile.get("pulse_score") or 0),
        "entry_status": status,
        # confirmed -> ready, registered -> maybe, withdrawn/absent -> unavailable.
        "readiness": {"confirmed": "ready", "registered": "maybe"}.get(status, "unavailable"),
    }


async def get_for_event(event_id: str, user_id: str) -> dict:
    """
    The caller's crew for an event, with its roster, or nothing if they have none.

    Returns a null crew rather than raising: having no crew yet is the normal
    starting state, not an error.
    """
    mine = db.list_documents(DB_ID, CREW_MEMBERS, queries=[
        Q.equal("user_id", user_id), Q.limit(50),
    ]).get("documents", [])

    for membership in mine:
        crew_id = membership.get("crew_id")
        if not crew_id:
            continue
        try:
            crew = db.get_document(DB_ID, CREWS, crew_id)
        except AppwriteException:
            continue
        if crew.get("event_id") != event_id:
            continue

        members = [_shape_member(m, event_id) for m in _members(crew_id)]
        return {
            "crew": {
                **crew,
                "members": members,
                "is_captain": crew.get("captain_id") == user_id,
                "ready_count": sum(1 for m in members if m["readiness"] == "ready"),
            },
        }

    return {"crew": None}


async def create(event_id: str, name: str, user_id: str) -> dict:
    """Form a crew for an event. The creator is its captain and first member."""
    if not name.strip():
        raise ValueError("A crew needs a name")

    try:
        db.get_document(DB_ID, EVENTS, event_id)
    except AppwriteException as exc:
        raise FileNotFoundError("That event does not exist") from exc

    existing = await get_for_event(event_id, user_id)
    if existing["crew"]:
        raise ValueError("You already have a crew for this event")

    now = now_iso()
    crew = db.create_document(DB_ID, CREWS, ID.unique(), {
        "event_id": event_id,
        "name": name.strip(),
        "captain_id": user_id,
        "members_count": 1,
        "created_at": now,
    })
    db.create_document(DB_ID, CREW_MEMBERS, ID.unique(), {
        "crew_id": crew["$id"],
        "user_id": user_id,
        "role": "captain",
        "joined_at": now,
        "created_at": now,
    })

    _link_entry(event_id, user_id, crew["$id"])
    return (await get_for_event(event_id, user_id))["crew"]


def _link_entry(event_id: str, user_id: str, crew_id: str | None) -> None:
    """
    Point the athlete's event entry at the crew.

    event_participants.crew_id existed from the start with nothing ever writing
    it, so an entry could not say which crew it belonged to.
    """
    rows = db.list_documents(DB_ID, PARTICIPANTS, queries=[
        Q.equal("event_id", event_id), Q.equal("user_id", user_id), Q.limit(1),
    ]).get("documents", [])
    if not rows:
        return
    try:
        db.update_document(DB_ID, PARTICIPANTS, rows[0]["$id"], {
            "crew_id": crew_id,
            "entry_type": "crew" if crew_id else "solo",
            "updated_at": now_iso(),
        })
    except AppwriteException:
        logger.warning("could not link entry of %s to crew %s", user_id, crew_id,
                       exc_info=True)


async def rename(crew_id: str, name: str, user_id: str) -> dict:
    crew = _crew(crew_id)
    _require_captain(crew, user_id)
    if not name.strip():
        raise ValueError("A crew needs a name")

    db.update_document(DB_ID, CREWS, crew_id,
                       {"name": name.strip(), "updated_at": now_iso()})
    return (await get_for_event(crew["event_id"], user_id))["crew"]


async def add_member(crew_id: str, target_user_id: str, user_id: str,
                     position: str | None = None) -> dict:
    """Invite an athlete into the crew. Captain only."""
    crew = _crew(crew_id)
    _require_captain(crew, user_id)

    members = _members(crew_id)
    if any(m.get("user_id") == target_user_id for m in members):
        raise ValueError("That athlete is already in this crew")
    if len(members) >= MAX_CREW:
        raise ValueError("This crew is full")

    now = now_iso()
    db.create_document(DB_ID, CREW_MEMBERS, ID.unique(), {
        "crew_id": crew_id,
        "user_id": target_user_id,
        "role": "member",
        "position": position,
        "joined_at": now,
        "created_at": now,
    })
    _sync_count(crew_id)
    _link_entry(crew["event_id"], target_user_id, crew_id)
    return (await get_for_event(crew["event_id"], user_id))["crew"]


async def remove_member(crew_id: str, target_user_id: str, user_id: str) -> dict:
    """
    Remove someone. The captain can remove anyone; anyone can remove themselves.
    """
    crew = _crew(crew_id)
    if crew.get("captain_id") != user_id and target_user_id != user_id:
        raise PermissionError("Only the captain can remove another member")
    if target_user_id == crew.get("captain_id"):
        raise ValueError("The captain cannot be removed; disband the crew instead")

    rows = [m for m in _members(crew_id) if m.get("user_id") == target_user_id]
    if not rows:
        raise FileNotFoundError("That athlete is not in this crew")

    db.delete_document(DB_ID, CREW_MEMBERS, rows[0]["$id"])
    _sync_count(crew_id)
    _link_entry(crew["event_id"], target_user_id, None)
    return (await get_for_event(crew["event_id"], crew["captain_id"]))["crew"]


async def disband(crew_id: str, user_id: str) -> None:
    crew = _crew(crew_id)
    _require_captain(crew, user_id)

    for member in _members(crew_id):
        _link_entry(crew["event_id"], member.get("user_id", ""), None)
        try:
            db.delete_document(DB_ID, CREW_MEMBERS, member["$id"])
        except AppwriteException:
            logger.warning("could not delete crew member %s", member["$id"])
    db.delete_document(DB_ID, CREWS, crew_id)


def _sync_count(crew_id: str) -> None:
    """members_count is denormalised for listing; keep it honest."""
    try:
        db.update_document(DB_ID, CREWS, crew_id, {
            "members_count": len(_members(crew_id)),
            "updated_at": now_iso(),
        })
    except AppwriteException:
        logger.warning("could not sync members_count on %s", crew_id, exc_info=True)
