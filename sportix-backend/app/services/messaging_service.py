"""
Direct-message conversations and squad chat.

Both had collections provisioned and no code at all: no service, no router, not
one route. MessagesPage rendered MOCK_CONVERSATIONS and SquadChat kept messages in
zustand, so nothing was ever sent anywhere.

Two things shape this module.

Membership is answered through conversation_members, not participant_ids.
participant_ids is an array, and Appwrite cannot index array columns, so
"which conversations am I in" has no indexed answer on that field. The join
collection is indexed by user_id; participant_ids stays only as a convenience for
rendering a thread header without a second query.

Unread counts are derived from a per-member last_read_at rather than a flag on
each message. A read flag per message per member would mean writing N rows every
time someone opens a thread; a timestamp is one write and answers the same
question.

Messages are the one place the browser reads Appwrite directly, and only through
a realtime subscription. Both message collections were provisioned with document
security and no collection-level read, so a client sees nothing by default;
_read_grants attaches read to exactly the people entitled to the message, which
is what makes a live subscription possible without opening the collection up.
No write permission is granted to anyone, so the browser still cannot send a
message except through this service. A member who joins a squad later starts
receiving live messages from that point on and gets everything earlier from the
history endpoint -- history is a server read and is not affected by these grants.
"""
from __future__ import annotations

import json
import logging

from appwrite.exception import AppwriteException
from appwrite.id import ID
from appwrite.permission import Permission
from appwrite.query import Query as Q
from appwrite.role import Role

from app.core.appwrite import db, DB_ID
from app.core.config import settings
from app.utils.formatters import now_iso

logger = logging.getLogger(__name__)

CONVERSATIONS = settings.collection_conversations
MEMBERS = settings.collection_conversation_members
MESSAGES = settings.collection_messages
SQUAD_MESSAGES = settings.collection_squad_messages
SQUAD_MEMBERS = settings.collection_squad_members
PROFILES = settings.collection_users


# ─── Helpers ──────────────────────────────────────────────────────────────────
def _profile(user_id: str) -> dict:
    try:
        p = db.get_document(DB_ID, PROFILES, user_id)
        return {
            "user_id": user_id,
            "full_name": p.get("full_name", ""),
            "username": p.get("username", ""),
            "avatar_url": p.get("avatar_url"),
            "sport": p.get("sport", ""),
        }
    except AppwriteException:
        return {"user_id": user_id, "full_name": "", "username": "",
                "avatar_url": None, "sport": ""}


def _membership(conversation_id: str, user_id: str) -> dict:
    rows = db.list_documents(DB_ID, MEMBERS, queries=[
        Q.equal("conversation_id", conversation_id),
        Q.equal("user_id", user_id), Q.limit(1),
    ]).get("documents", [])
    if not rows:
        raise PermissionError("You are not part of this conversation")
    return rows[0]


def _member_rows(conversation_id: str) -> list[dict]:
    return db.list_documents(DB_ID, MEMBERS, queries=[
        Q.equal("conversation_id", conversation_id), Q.limit(50),
    ]).get("documents", [])


def _read_grants(user_ids: list[str]) -> list[str]:
    """Read-only document permissions, deduplicated, for realtime delivery."""
    return [Permission.read(Role.user(uid)) for uid in dict.fromkeys(user_ids) if uid]


# ─── Conversations ────────────────────────────────────────────────────────────
async def list_conversations(user_id: str) -> dict:
    """
    Every conversation the caller is in, most recently active first, with the
    other participants resolved and an unread count.
    """
    memberships = db.list_documents(DB_ID, MEMBERS, queries=[
        Q.equal("user_id", user_id), Q.limit(100),
    ]).get("documents", [])

    items = []
    for membership in memberships:
        try:
            conversation = db.get_document(
                DB_ID, CONVERSATIONS, membership["conversation_id"])
        except AppwriteException:
            # A membership pointing at a deleted conversation is stale, not fatal.
            logger.warning("stale conversation_members row %s", membership.get("$id"))
            continue

        others = [
            _profile(m["user_id"])
            for m in _member_rows(conversation["$id"])
            if m.get("user_id") != user_id
        ]

        items.append({
            **conversation,
            "participants": others,
            "unread_count": _unread_count(conversation["$id"], membership.get("last_read_at")),
            "last_read_at": membership.get("last_read_at"),
        })

    items.sort(key=lambda c: c.get("last_message_at") or c.get("created_at") or "", reverse=True)
    return {"items": items, "total": len(items)}


def _unread_count(conversation_id: str, last_read_at: str | None) -> int:
    queries = [Q.equal("conversation_id", conversation_id), Q.limit(100)]
    if last_read_at:
        queries.append(Q.greater_than("created_at", last_read_at))
    try:
        return db.list_documents(DB_ID, MESSAGES, queries=queries).get("total", 0)
    except AppwriteException:
        logger.warning("could not count unread for %s", conversation_id, exc_info=True)
        return 0


async def get_or_create_direct(user_id: str, other_user_id: str) -> dict:
    """
    The conversation between two people, created if it does not exist.

    Idempotent on purpose: opening a chat from a profile should not mint a second
    thread with the same person every time.
    """
    if user_id == other_user_id:
        raise ValueError("You cannot start a conversation with yourself")

    mine = {
        m["conversation_id"]
        for m in db.list_documents(DB_ID, MEMBERS, queries=[
            Q.equal("user_id", user_id), Q.limit(100),
        ]).get("documents", [])
    }
    theirs = {
        m["conversation_id"]
        for m in db.list_documents(DB_ID, MEMBERS, queries=[
            Q.equal("user_id", other_user_id), Q.limit(100),
        ]).get("documents", [])
    }

    for conversation_id in mine & theirs:
        try:
            conversation = db.get_document(DB_ID, CONVERSATIONS, conversation_id)
        except AppwriteException:
            continue
        # Only reuse a two-person, non-event thread.
        if not conversation.get("is_event_chat") and len(_member_rows(conversation_id)) == 2:
            return conversation

    now = now_iso()
    conversation = db.create_document(DB_ID, CONVERSATIONS, ID.unique(), {
        "participant_ids": [user_id, other_user_id],
        "is_event_chat": False,
        "created_at": now,
    })
    for uid in (user_id, other_user_id):
        db.create_document(DB_ID, MEMBERS, ID.unique(), {
            "conversation_id": conversation["$id"],
            "user_id": uid,
            "joined_at": now,
            "created_at": now,
        })
    return conversation


async def list_messages(conversation_id: str, user_id: str,
                        page: int = 0, limit: int = 50) -> dict:
    _membership(conversation_id, user_id)

    res = db.list_documents(DB_ID, MESSAGES, queries=[
        Q.equal("conversation_id", conversation_id),
        Q.limit(limit), Q.offset(page * limit), Q.order_desc("$createdAt"),
    ])
    messages = res.get("documents", [])

    # Newest-first from the database so paging works; oldest-first for rendering.
    messages.reverse()
    senders = {m["sender_id"] for m in messages if m.get("sender_id")}
    profiles = {uid: _profile(uid) for uid in senders}

    return {
        "items": [{**m, "sender": profiles.get(m.get("sender_id"))} for m in messages],
        "total": res.get("total", len(messages)),
        "page": page,
        "limit": limit,
        "has_more": (page + 1) * limit < res.get("total", 0),
    }


async def send_message(conversation_id: str, user_id: str, content: str,
                       media_url: str | None = None,
                       media_type: str | None = None) -> dict:
    _membership(conversation_id, user_id)
    if not content.strip() and not media_url:
        raise ValueError("A message needs text or an attachment")

    participants = [m["user_id"] for m in _member_rows(conversation_id)
                    if m.get("user_id")]

    now = now_iso()
    message = db.create_document(DB_ID, MESSAGES, ID.unique(), {
        "conversation_id": conversation_id,
        "sender_id": user_id,
        "content": content.strip(),
        "media_url": media_url,
        "media_type": media_type,
        "read_by": [user_id],
        "created_at": now,
    }, permissions=_read_grants(participants))

    # Denormalised onto the conversation so a thread list needs no per-row query.
    try:
        db.update_document(DB_ID, CONVERSATIONS, conversation_id, {
            "last_message": content.strip()[:300],
            "last_message_at": now,
            "updated_at": now,
        })
    except AppwriteException:
        logger.warning("could not update conversation %s preview",
                       conversation_id, exc_info=True)

    return {**message, "sender": _profile(user_id)}


async def mark_read(conversation_id: str, user_id: str) -> dict:
    """Move this member's read marker to now."""
    membership = _membership(conversation_id, user_id)
    now = now_iso()
    db.update_document(DB_ID, MEMBERS, membership["$id"],
                       {"last_read_at": now, "updated_at": now})
    return {"conversation_id": conversation_id, "last_read_at": now, "unread_count": 0}


# ─── Squad chat ───────────────────────────────────────────────────────────────
def _require_squad_member(squad_id: str, user_id: str) -> None:
    rows = db.list_documents(DB_ID, SQUAD_MEMBERS, queries=[
        Q.equal("squad_id", squad_id), Q.equal("user_id", user_id), Q.limit(1),
    ]).get("documents", [])
    if not rows:
        raise PermissionError("Only squad members can use this channel")


async def list_squad_messages(squad_id: str, user_id: str,
                              page: int = 0, limit: int = 50) -> dict:
    _require_squad_member(squad_id, user_id)

    res = db.list_documents(DB_ID, SQUAD_MESSAGES, queries=[
        Q.equal("squad_id", squad_id),
        Q.limit(limit), Q.offset(page * limit), Q.order_desc("$createdAt"),
    ])
    messages = res.get("documents", [])
    messages.reverse()

    # poll_data, tactical_data and announcement_data are JSON blobs in string
    # columns; parse them here so the client never has to.
    for message in messages:
        for field in ("poll_data", "tactical_data", "announcement_data"):
            raw = message.get(field)
            if raw:
                try:
                    message[field] = json.loads(raw)
                except json.JSONDecodeError:
                    logger.warning("unreadable %s on squad message %s",
                                   field, message.get("$id"))
                    message[field] = None

    return {
        "items": messages,
        "total": res.get("total", len(messages)),
        "page": page,
        "limit": limit,
        "has_more": (page + 1) * limit < res.get("total", 0),
    }


async def send_squad_message(squad_id: str, user_id: str, content: str,
                             message_type: str = "text",
                             attachment_url: str | None = None,
                             poll_data: dict | None = None,
                             tactical_data: dict | None = None,
                             announcement_data: dict | None = None) -> dict:
    _require_squad_member(squad_id, user_id)
    if not content.strip():
        raise ValueError("A message needs some content")

    sender = _profile(user_id)
    members = db.list_documents(DB_ID, SQUAD_MEMBERS, queries=[
        Q.equal("squad_id", squad_id), Q.limit(100),
    ]).get("documents", [])
    role = next((m.get("role", "") for m in members if m.get("user_id") == user_id), "")

    now = now_iso()
    return db.create_document(DB_ID, SQUAD_MESSAGES, ID.unique(), {
        "squad_id": squad_id,
        "sender_id": user_id,
        "sender_name": sender["full_name"],
        "sender_avatar_url": sender["avatar_url"],
        "sender_role": role,
        "content": content.strip(),
        "type": message_type,
        "attachment_url": attachment_url,
        "poll_data": json.dumps(poll_data) if poll_data else None,
        "tactical_data": json.dumps(tactical_data) if tactical_data else None,
        "announcement_data": json.dumps(announcement_data) if announcement_data else None,
        "created_at": now,
    }, permissions=_read_grants([m["user_id"] for m in members if m.get("user_id")]))
