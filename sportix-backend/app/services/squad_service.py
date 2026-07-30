import logging
from appwrite.query import Query as Q
from appwrite.id import ID
from app.core.appwrite import db, DB_ID
from app.core.config import settings
from app.utils.formatters import now_iso
from app.schemas.squad import SquadCreate, SquadUpdate, MemberAdd
from typing import Optional

logger = logging.getLogger(__name__)


async def get_user_squads(user_id: str) -> dict:
    # Squads where user is captain
    owned = db.list_documents(
        DB_ID, settings.collection_squads,
        queries=[Q.equal("captain_id", user_id), Q.order_desc("$createdAt")],
    )
    # Squads where user is a member
    memberships = db.list_documents(
        DB_ID, settings.collection_squad_members,
        queries=[Q.equal("user_id", user_id), Q.limit(50)],
    )
    return {"owned": owned, "memberships": memberships}


async def create(user_id: str, payload: SquadCreate) -> dict:
    squad = db.create_document(
        DB_ID, settings.collection_squads, ID.unique(),
        data={
            "created_at": now_iso(),
            "name": payload.name,
            "sport": payload.sport,
            "captain_id": user_id,
            "formation": payload.formation,
            "tactical_notes": payload.tactical_notes,
            "max_members": payload.max_members,
            "members_count": 1,
            "win_rate": 0.0,
            "chemistry_score": 0.0,
        },
    )
    # Add creator as captain member
    db.create_document(DB_ID, settings.collection_squad_members, ID.unique(), {
        "created_at": now_iso(),
        "joined_at": now_iso(),
        "squad_id": squad["$id"],
        "user_id": user_id,
        "role": "captain",
        "position": None,
    })
    return squad


async def get_by_id(squad_id: str) -> dict:
    return db.get_document(DB_ID, settings.collection_squads, squad_id)


async def update(squad_id: str, user_id: str, payload: SquadUpdate) -> dict:
    doc = db.get_document(DB_ID, settings.collection_squads, squad_id)
    if doc.get("captain_id") != user_id:
        raise PermissionError("Only the captain can update squad settings")
    data = payload.model_dump(exclude_none=True)
    return db.update_document(DB_ID, settings.collection_squads, squad_id, data)


async def disband(squad_id: str, user_id: str):
    doc = db.get_document(DB_ID, settings.collection_squads, squad_id)
    if doc.get("captain_id") != user_id:
        raise PermissionError("Only the captain can disband the squad")
    db.delete_document(DB_ID, settings.collection_squads, squad_id)


async def get_members(squad_id: str) -> dict:
    return db.list_documents(
        DB_ID, settings.collection_squad_members,
        queries=[Q.equal("squad_id", squad_id), Q.limit(50)],
    )


async def add_member(squad_id: str, requester_id: str, payload: MemberAdd) -> dict:
    doc = db.get_document(DB_ID, settings.collection_squads, squad_id)
    if doc.get("captain_id") != requester_id:
        raise PermissionError("Only the captain can add members")
    # Check not already a member
    existing = db.list_documents(
        DB_ID, settings.collection_squad_members,
        queries=[Q.equal("squad_id", squad_id), Q.equal("user_id", payload.user_id), Q.limit(1)],
    )
    if existing.get("documents"):
        raise ValueError("User is already a squad member")
    member = db.create_document(
        DB_ID, settings.collection_squad_members, ID.unique(),
        data={
            "created_at": now_iso(),
            "joined_at": now_iso(),
            "squad_id": squad_id,
            "user_id": payload.user_id,
            "role": payload.role.value,
            "position": payload.position,
        },
    )
    db.update_document(DB_ID, settings.collection_squads, squad_id,
                       {"members_count": doc.get("members_count", 0) + 1})
    return member


async def remove_member(squad_id: str, target_user_id: str, requester_id: str):
    squad = db.get_document(DB_ID, settings.collection_squads, squad_id)
    if squad.get("captain_id") != requester_id and target_user_id != requester_id:
        raise PermissionError("Only the captain can remove other members")
    res = db.list_documents(
        DB_ID, settings.collection_squad_members,
        queries=[Q.equal("squad_id", squad_id), Q.equal("user_id", target_user_id), Q.limit(1)],
    )
    for doc in res.get("documents", []):
        db.delete_document(DB_ID, settings.collection_squad_members, doc["$id"])
    db.update_document(DB_ID, settings.collection_squads, squad_id,
                       {"members_count": max(0, squad.get("members_count", 1) - 1)})


async def update_role(squad_id: str, target_user_id: str, role: str, requester_id: str):
    squad = db.get_document(DB_ID, settings.collection_squads, squad_id)
    if squad.get("captain_id") != requester_id:
        raise PermissionError("Only the captain can change roles")
    res = db.list_documents(
        DB_ID, settings.collection_squad_members,
        queries=[Q.equal("squad_id", squad_id), Q.equal("user_id", target_user_id), Q.limit(1)],
    )
    for doc in res.get("documents", []):
        db.update_document(DB_ID, settings.collection_squad_members, doc["$id"], {"role": role})


async def get_chemistry(squad_id: str) -> dict:
    """Calculate chemistry score based on member pulse scores."""
    members = db.list_documents(
        DB_ID, settings.collection_squad_members,
        queries=[Q.equal("squad_id", squad_id), Q.limit(50)],
    )
    member_ids = [m["user_id"] for m in members.get("documents", [])]
    pulses = []
    for uid in member_ids:
        try:
            res = db.list_documents(
                DB_ID, settings.collection_pulse_scores,
                queries=[Q.equal("user_id", uid), Q.limit(1)],
            )
            if res.get("documents"):
                pulses.append(res["documents"][0].get("total_pulse", 100))
        except Exception:
            pulses.append(100.0)
    avg_pulse = sum(pulses) / len(pulses) if pulses else 0
    chemistry = round(min(100, avg_pulse * 0.8 + len(pulses) * 2), 1)
    return {"chemistry_score": chemistry, "member_count": len(pulses), "avg_pulse": round(avg_pulse, 1)}


async def get_analytics(squad_id: str) -> dict:
    squad = db.get_document(DB_ID, settings.collection_squads, squad_id)
    return {
        "squad_id": squad_id,
        "name": squad.get("name"),
        "members_count": squad.get("members_count", 0),
        "win_rate": squad.get("win_rate", 0),
        "chemistry_score": squad.get("chemistry_score", 0),
        "formation": squad.get("formation"),
    }


async def update_tactics(squad_id: str, user_id: str, formation: str, tactical_notes: Optional[str]) -> dict:
    squad = db.get_document(DB_ID, settings.collection_squads, squad_id)
    if squad.get("captain_id") != user_id:
        raise PermissionError("Only the captain can change tactics")
    return db.update_document(DB_ID, settings.collection_squads, squad_id,
                               {"formation": formation, "tactical_notes": tactical_notes})


async def vote_leadership(squad_id: str, candidate_id: str, voter_id: str, vote: str) -> dict:
    """
    Cast a leadership vote, and hand over the captaincy once a candidate holds a
    strict majority of the squad's members.

    These rows used to be written into squad_members, so every leadership vote
    inserted a bogus "member" with no user_id -- inflating members_count and
    corrupting every membership query. They now have their own collection.

    Appwrite has no transactions, so the promotion writes in an order where a
    mid-failure leaves a recoverable state: the new captain is recorded on the
    squad first (the authoritative field), then the two member roles are
    adjusted. If a role write fails the squad still has exactly one captain_id,
    and the mismatch is logged rather than left silent.
    """
    members = db.list_documents(
        DB_ID, settings.collection_squad_members,
        queries=[Q.equal("squad_id", squad_id), Q.limit(100)],
    ).get("documents", [])
    member_ids = {m.get("user_id") for m in members if m.get("user_id")}

    if voter_id not in member_ids:
        raise PermissionError("Only squad members can vote on leadership")
    if candidate_id not in member_ids:
        raise ValueError("The candidate is not a member of this squad")

    now = now_iso()
    existing = db.list_documents(
        DB_ID, settings.collection_leadership_votes,
        queries=[Q.equal("squad_id", squad_id), Q.equal("voter_id", voter_id), Q.limit(1)],
    ).get("documents", [])

    if existing:
        # unique(squad_id, voter_id): one vote each, changeable.
        db.update_document(
            DB_ID, settings.collection_leadership_votes, existing[0]["$id"],
            {"candidate_id": candidate_id, "vote": vote, "updated_at": now},
        )
    else:
        db.create_document(
            DB_ID, settings.collection_leadership_votes, ID.unique(),
            data={
                "squad_id": squad_id, "candidate_id": candidate_id,
                "voter_id": voter_id, "vote": vote, "created_at": now,
            },
        )

    return await _tally_leadership(squad_id, len(member_ids))


async def _tally_leadership(squad_id: str, member_count: int) -> dict:
    """Count votes and promote a candidate who has a strict majority."""
    votes = db.list_documents(
        DB_ID, settings.collection_leadership_votes,
        queries=[Q.equal("squad_id", squad_id), Q.limit(100)],
    ).get("documents", [])

    counts: dict[str, int] = {}
    for v in votes:
        if v.get("vote") == "approve" and v.get("candidate_id"):
            counts[v["candidate_id"]] = counts.get(v["candidate_id"], 0) + 1

    needed = member_count // 2 + 1          # strict majority
    winner = next((cid for cid, n in counts.items() if n >= needed), None)

    result = {
        "squad_id": squad_id,
        "votes": counts,
        "member_count": member_count,
        "votes_needed": needed,
        "new_captain_id": None,
    }
    if winner is None:
        return result

    squad = db.get_document(DB_ID, settings.collection_squads, squad_id)
    previous = squad.get("captain_id")
    if previous == winner:
        return result

    now = now_iso()
    # Authoritative field first, so a later failure is recoverable.
    db.update_document(DB_ID, settings.collection_squads, squad_id,
                       {"captain_id": winner, "updated_at": now})

    for uid, role in ((winner, "captain"), (previous, "member")):
        if not uid:
            continue
        try:
            rows = db.list_documents(
                DB_ID, settings.collection_squad_members,
                queries=[Q.equal("squad_id", squad_id), Q.equal("user_id", uid), Q.limit(1)],
            ).get("documents", [])
            if rows:
                db.update_document(DB_ID, settings.collection_squad_members,
                                   rows[0]["$id"], {"role": role, "updated_at": now})
        except Exception:
            logger.warning(
                "squad %s: captain_id is now %s but the squad_members role for %s "
                "was not updated; roles and captain_id disagree",
                squad_id, winner, uid, exc_info=True,
            )

    # Clear the ballot so the next contest starts fresh.
    for v in votes:
        try:
            db.delete_document(DB_ID, settings.collection_leadership_votes, v["$id"])
        except Exception:
            logger.warning("could not clear leadership vote %s", v["$id"], exc_info=True)

    result["new_captain_id"] = winner
    result["previous_captain_id"] = previous
    return result
