"""
Squad invitations, and the activity feed across an athlete's squads.

Both were fixtures on SquadFormation: two invented invitations with a tab badge
permanently reading 2, and five invented activity lines identical for every
athlete.

Invitations needed a pending state, which squad_members does not have — it holds
confirmed membership only. squad_invites carries it, with a unique index on
(squad_id, invited_user_id) so a squad cannot end up with two rows disagreeing
about whether somebody was invited.

The activity feed needed no new collection. Squad posts, scheduled events, channel
messages and achievements all already exist; nothing joined them. It is an
aggregation, which means there is one place a fact lives and the feed cannot drift
from it.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from appwrite.exception import AppwriteException
from appwrite.id import ID
from appwrite.query import Query as Q

from app.core.appwrite import db, DB_ID
from app.core.config import settings
from app.utils.formatters import now_iso

logger = logging.getLogger(__name__)

INVITES = settings.collection_squad_invites
SQUADS = settings.collection_squads
MEMBERS = settings.collection_squad_members
PROFILES = settings.collection_users
POSTS = settings.collection_squad_posts
EVENTS = settings.collection_squad_events
MESSAGES = settings.collection_squad_messages
ACHIEVEMENTS = settings.collection_squad_achievements

# How long an invitation stands. Stored on the row rather than recomputed, so
# changing this does not retroactively expire or revive existing invitations.
INVITE_TTL = timedelta(hours=48)


def _iso(dt: datetime) -> str:
    return dt.isoformat().replace("+00:00", "+00:00")


def _parse(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def _profile(user_id: str) -> dict:
    try:
        p = db.get_document(DB_ID, PROFILES, user_id)
    except AppwriteException:
        return {"user_id": user_id, "full_name": "", "username": "",
                "avatar_url": None, "level": 1, "pulse_score": 0.0}
    return {
        "user_id": user_id,
        "full_name": p.get("full_name", ""),
        "username": p.get("username", ""),
        "avatar_url": p.get("avatar_url"),
        "level": int(p.get("level") or 1),
        "pulse_score": float(p.get("pulse_score") or 0),
    }


def _squad(squad_id: str) -> dict:
    try:
        return db.get_document(DB_ID, SQUADS, squad_id)
    except AppwriteException:
        return {}


def _is_member(squad_id: str, user_id: str) -> bool:
    return bool(db.list_documents(DB_ID, MEMBERS, queries=[
        Q.equal("squad_id", squad_id), Q.equal("user_id", user_id), Q.limit(1),
    ]).get("documents", []))


def _my_squad_ids(user_id: str) -> list[str]:
    return [
        m["squad_id"] for m in db.list_documents(DB_ID, MEMBERS, queries=[
            Q.equal("user_id", user_id), Q.limit(50),
        ]).get("documents", []) if m.get("squad_id")
    ]


# ─── Invitations ──────────────────────────────────────────────────────────────
async def invite(squad_id: str, target_user_id: str, inviter_id: str,
                 position: str | None = None, message: str | None = None) -> dict:
    """
    Invite an athlete to a squad. Captain only.

    Re-inviting somebody who previously declined replaces the old row rather than
    failing, because the unique index allows one row per pair and a captain should
    be able to ask again.
    """
    squad = _squad(squad_id)
    if not squad:
        raise FileNotFoundError("That squad does not exist")
    if squad.get("captain_id") != inviter_id:
        raise PermissionError("Only the squad's captain can invite athletes")
    if target_user_id == inviter_id:
        raise ValueError("You are already in this squad")
    if _is_member(squad_id, target_user_id):
        raise ValueError("That athlete is already in this squad")

    members = db.list_documents(DB_ID, MEMBERS, queries=[
        Q.equal("squad_id", squad_id), Q.limit(100),
    ]).get("total", 0)
    if members >= int(squad.get("max_members") or 11):
        raise ValueError("This squad is full")

    now = datetime.now(timezone.utc)
    payload = {
        "squad_id": squad_id,
        "invited_user_id": target_user_id,
        "invited_by": inviter_id,
        "status": "pending",
        "position": position,
        "message": (message or "").strip()[:300] or None,
        "expires_at": _iso(now + INVITE_TTL),
        "responded_at": None,
        "updated_at": now_iso(),
    }

    existing = db.list_documents(DB_ID, INVITES, queries=[
        Q.equal("squad_id", squad_id), Q.equal("invited_user_id", target_user_id),
        Q.limit(1),
    ]).get("documents", [])

    if existing:
        row = existing[0]
        if row.get("status") == "pending" and (_parse(row.get("expires_at")) or now) > now:
            raise ValueError("That athlete already has a pending invitation")
        invite_row = db.update_document(DB_ID, INVITES, row["$id"], payload)
    else:
        invite_row = db.create_document(DB_ID, INVITES, ID.unique(),
                                        {**payload, "created_at": now_iso()})

    _notify(target_user_id, "squad_invite", "Squad invitation",
            f"{squad.get('name', 'A squad')} invited you to join.", squad_id)
    return _shape_invite(invite_row)


def _shape_invite(row: dict) -> dict:
    squad = _squad(row.get("squad_id", ""))
    expires = _parse(row.get("expires_at"))
    now = datetime.now(timezone.utc)
    return {
        **row,
        "squad": {
            "squad_id": row.get("squad_id"),
            "name": squad.get("name", "Unknown squad"),
            "sport": squad.get("sport", ""),
            "logo_url": squad.get("logo_url"),
            "chemistry_score": float(squad.get("chemistry_score") or 0),
            "members_count": int(squad.get("members_count") or 0),
        },
        "inviter": _profile(row.get("invited_by", "")),
        # Whether it is still actionable, which the status alone cannot say: a row
        # can be `pending` and long past its deadline.
        "is_expired": bool(expires and expires < now),
        "expires_in_seconds": int((expires - now).total_seconds()) if expires and expires > now else 0,
    }


def _notify(user_id: str, notif_type: str, title: str, body: str,
            reference_id: str | None) -> None:
    from app.services import notification_service
    import asyncio

    try:
        coro = notification_service.create_notification(
            user_id=user_id, notif_type=notif_type, title=title, body=body,
            reference_id=reference_id, reference_type="squad",
        )
        # This helper is called from async contexts only; scheduling keeps the
        # invite write from being undone by a notification failure.
        asyncio.get_running_loop().create_task(coro)
    except Exception:
        logger.warning("could not notify %s about %s", user_id, title, exc_info=True)


async def list_mine(user_id: str) -> dict:
    """
    Invitations waiting on this athlete. Expired rows are marked and excluded,
    which is what keeps a stale invite from being acceptable a week later.
    """
    rows = db.list_documents(DB_ID, INVITES, queries=[
        Q.equal("invited_user_id", user_id), Q.equal("status", "pending"),
        Q.limit(50), Q.order_desc("$createdAt"),
    ]).get("documents", [])

    live, expired = [], []
    for row in rows:
        shaped = _shape_invite(row)
        (expired if shaped["is_expired"] else live).append(shaped)

    for shaped in expired:
        try:
            db.update_document(DB_ID, INVITES, shaped["$id"],
                               {"status": "expired", "updated_at": now_iso()})
        except AppwriteException:
            logger.warning("could not expire invite %s", shaped["$id"])

    return {"items": live, "total": len(live), "expired": len(expired)}


async def list_for_squad(squad_id: str, user_id: str) -> dict:
    """Outstanding invitations a captain has sent."""
    if not _is_member(squad_id, user_id):
        raise PermissionError("Only squad members can see its invitations")
    rows = db.list_documents(DB_ID, INVITES, queries=[
        Q.equal("squad_id", squad_id), Q.limit(50), Q.order_desc("$createdAt"),
    ]).get("documents", [])
    items = [{**_shape_invite(r), "invitee": _profile(r.get("invited_user_id", ""))}
             for r in rows]
    return {"items": items, "total": len(items)}


async def respond(invite_id: str, user_id: str, accept: bool) -> dict:
    """
    Accept or decline. Accepting is what actually creates the membership row, so
    the two cannot disagree about whether someone joined.
    """
    try:
        row = db.get_document(DB_ID, INVITES, invite_id)
    except AppwriteException as exc:
        raise FileNotFoundError("That invitation does not exist") from exc

    if row.get("invited_user_id") != user_id:
        raise PermissionError("That invitation is not yours")
    if row.get("status") != "pending":
        raise ValueError(f"That invitation was already {row.get('status')}")

    expires = _parse(row.get("expires_at"))
    if expires and expires < datetime.now(timezone.utc):
        db.update_document(DB_ID, INVITES, invite_id,
                           {"status": "expired", "updated_at": now_iso()})
        raise ValueError("That invitation has expired")

    now = now_iso()
    squad_id = row.get("squad_id", "")

    if accept:
        # Membership first: if the status write failed afterwards the athlete is in
        # the squad with a stale invite, which is recoverable and visible. The
        # reverse would show them as joined while they are not.
        from app.services import squad_service
        await squad_service.join_from_invite(
            squad_id, user_id, row.get("position") or None)

    db.update_document(DB_ID, INVITES, invite_id, {
        "status": "accepted" if accept else "declined",
        "responded_at": now,
        "updated_at": now,
    })

    inviter = row.get("invited_by", "")
    if inviter:
        who = _profile(user_id).get("full_name") or "An athlete"
        _notify(inviter, "squad_invite",
                "Invitation accepted" if accept else "Invitation declined",
                f"{who} {'joined' if accept else 'declined'} your squad.", squad_id)

    return {"invite_id": invite_id, "status": "accepted" if accept else "declined",
            "squad_id": squad_id}


async def revoke(invite_id: str, user_id: str) -> None:
    """A captain withdrawing an invitation they sent."""
    try:
        row = db.get_document(DB_ID, INVITES, invite_id)
    except AppwriteException as exc:
        raise FileNotFoundError("That invitation does not exist") from exc

    squad = _squad(row.get("squad_id", ""))
    if squad.get("captain_id") != user_id:
        raise PermissionError("Only the squad's captain can withdraw an invitation")
    db.delete_document(DB_ID, INVITES, invite_id)


# ─── Activity feed ────────────────────────────────────────────────────────────
async def activity(user_id: str, limit: int = 25) -> dict:
    """
    One stream across the squads an athlete belongs to.

    Aggregated from four collections that already existed separately — posts,
    scheduled events, channel messages and unlocked achievements — rather than
    written to a feed table, so a fact has one home and the feed cannot contradict
    it. Newest first.
    """
    squad_ids = _my_squad_ids(user_id)
    if not squad_ids:
        return {"items": [], "total": 0, "squads": 0}

    names = {sid: _squad(sid).get("name", "Your squad") for sid in squad_ids}
    items: list[dict] = []

    for squad_id in squad_ids:
        squad_name = names[squad_id]

        for post in _rows(POSTS, squad_id, 10):
            author = post.get("author_name") or _profile(post.get("author_id", "")).get("full_name")
            items.append(_entry(
                "post", post, squad_id, squad_name,
                f"{author or 'A teammate'} posted in {squad_name}",
                (post.get("content") or "")[:140],
            ))

        for event in _rows(EVENTS, squad_id, 10):
            items.append(_entry(
                "event", event, squad_id, squad_name,
                f"{event.get('type', 'session').title()} scheduled for {squad_name}",
                event.get("title") or "",
            ))

        for message in _rows(MESSAGES, squad_id, 10):
            # Plain chatter would drown the feed; only the deliberate ones.
            if message.get("type") in ("text", None):
                continue
            items.append(_entry(
                "message", message, squad_id, squad_name,
                f"{message.get('sender_name') or 'A teammate'} posted "
                f"a {message.get('type')} in {squad_name}",
                (message.get("content") or "")[:140],
            ))

        for achievement in _rows(ACHIEVEMENTS, squad_id, 10):
            if not achievement.get("unlocked_at"):
                continue
            items.append(_entry(
                "achievement", achievement, squad_id, squad_name,
                f"{squad_name} unlocked {achievement.get('name', 'an achievement')}",
                achievement.get("description") or "",
            ))

    items.sort(key=lambda i: i.get("at") or "", reverse=True)
    return {"items": items[:limit], "total": len(items), "squads": len(squad_ids)}


def _rows(collection: str, squad_id: str, limit: int) -> list[dict]:
    try:
        return db.list_documents(DB_ID, collection, queries=[
            Q.equal("squad_id", squad_id), Q.limit(limit), Q.order_desc("$createdAt"),
        ]).get("documents", [])
    except Exception:
        # One unreadable collection should cost its own entries, not the feed.
        logger.warning("activity: could not read %s for %s", collection, squad_id,
                       exc_info=True)
        return []


def _entry(kind: str, row: dict, squad_id: str, squad_name: str,
           text: str, detail: str) -> dict:
    return {
        "id": f"{kind}:{row.get('$id')}",
        "type": kind,
        "squad_id": squad_id,
        "squad_name": squad_name,
        "text": text,
        "detail": detail,
        "at": row.get("unlocked_at") or row.get("starts_at")
        or row.get("created_at") or row.get("$createdAt"),
    }
