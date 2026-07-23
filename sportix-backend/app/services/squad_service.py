from appwrite.query import Query as Q
from appwrite.id import ID
from app.core.appwrite import db, DB_ID
from app.core.config import settings
from app.schemas.squad import SquadCreate, SquadUpdate, MemberAdd
from typing import Optional


async def get_user_squads(user_id: str) -> dict:
    # Squads where user is captain
    owned = db.list_documents(
        DB_ID, settings.collection_squads,
        queries=[Q.equal("captainId", user_id), Q.order_desc("$createdAt")],
    )
    # Squads where user is a member
    memberships = db.list_documents(
        DB_ID, settings.collection_squad_members,
        queries=[Q.equal("userId", user_id), Q.limit(50)],
    )
    return {"owned": owned, "memberships": memberships}


async def create(user_id: str, payload: SquadCreate) -> dict:
    squad = db.create_document(
        DB_ID, settings.collection_squads, ID.unique(),
        data={
            "name": payload.name,
            "sport": payload.sport,
            "captainId": user_id,
            "formation": payload.formation,
            "tacticalNotes": payload.tactical_notes,
            "maxMembers": payload.max_members,
            "membersCount": 1,
            "winRate": 0.0,
            "chemistryScore": 0.0,
        },
    )
    # Add creator as captain member
    db.create_document(DB_ID, settings.collection_squad_members, ID.unique(), {
        "squadId": squad["$id"],
        "userId": user_id,
        "role": "captain",
        "position": None,
    })
    return squad


async def get_by_id(squad_id: str) -> dict:
    return db.get_document(DB_ID, settings.collection_squads, squad_id)


async def update(squad_id: str, user_id: str, payload: SquadUpdate) -> dict:
    doc = db.get_document(DB_ID, settings.collection_squads, squad_id)
    if doc.get("captainId") != user_id:
        raise PermissionError("Only the captain can update squad settings")
    data = payload.model_dump(exclude_none=True)
    return db.update_document(DB_ID, settings.collection_squads, squad_id, data)


async def disband(squad_id: str, user_id: str):
    doc = db.get_document(DB_ID, settings.collection_squads, squad_id)
    if doc.get("captainId") != user_id:
        raise PermissionError("Only the captain can disband the squad")
    db.delete_document(DB_ID, settings.collection_squads, squad_id)


async def get_members(squad_id: str) -> dict:
    return db.list_documents(
        DB_ID, settings.collection_squad_members,
        queries=[Q.equal("squadId", squad_id), Q.limit(50)],
    )


async def add_member(squad_id: str, requester_id: str, payload: MemberAdd) -> dict:
    doc = db.get_document(DB_ID, settings.collection_squads, squad_id)
    if doc.get("captainId") != requester_id:
        raise PermissionError("Only the captain can add members")
    # Check not already a member
    existing = db.list_documents(
        DB_ID, settings.collection_squad_members,
        queries=[Q.equal("squadId", squad_id), Q.equal("userId", payload.user_id), Q.limit(1)],
    )
    if existing.get("documents"):
        raise ValueError("User is already a squad member")
    member = db.create_document(
        DB_ID, settings.collection_squad_members, ID.unique(),
        data={"squadId": squad_id, "userId": payload.user_id, "role": payload.role.value, "position": payload.position},
    )
    db.update_document(DB_ID, settings.collection_squads, squad_id,
                       {"membersCount": doc.get("membersCount", 0) + 1})
    return member


async def remove_member(squad_id: str, target_user_id: str, requester_id: str):
    squad = db.get_document(DB_ID, settings.collection_squads, squad_id)
    if squad.get("captainId") != requester_id and target_user_id != requester_id:
        raise PermissionError("Only the captain can remove other members")
    res = db.list_documents(
        DB_ID, settings.collection_squad_members,
        queries=[Q.equal("squadId", squad_id), Q.equal("userId", target_user_id), Q.limit(1)],
    )
    for doc in res.get("documents", []):
        db.delete_document(DB_ID, settings.collection_squad_members, doc["$id"])
    db.update_document(DB_ID, settings.collection_squads, squad_id,
                       {"membersCount": max(0, squad.get("membersCount", 1) - 1)})


async def update_role(squad_id: str, target_user_id: str, role: str, requester_id: str):
    squad = db.get_document(DB_ID, settings.collection_squads, squad_id)
    if squad.get("captainId") != requester_id:
        raise PermissionError("Only the captain can change roles")
    res = db.list_documents(
        DB_ID, settings.collection_squad_members,
        queries=[Q.equal("squadId", squad_id), Q.equal("userId", target_user_id), Q.limit(1)],
    )
    for doc in res.get("documents", []):
        db.update_document(DB_ID, settings.collection_squad_members, doc["$id"], {"role": role})


async def get_chemistry(squad_id: str) -> dict:
    """Calculate chemistry score based on member pulse scores."""
    members = db.list_documents(
        DB_ID, settings.collection_squad_members,
        queries=[Q.equal("squadId", squad_id), Q.limit(50)],
    )
    member_ids = [m["userId"] for m in members.get("documents", [])]
    pulses = []
    for uid in member_ids:
        try:
            res = db.list_documents(
                DB_ID, settings.collection_pulse_scores,
                queries=[Q.equal("userId", uid), Q.limit(1)],
            )
            if res.get("documents"):
                pulses.append(res["documents"][0].get("totalPulse", 100))
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
        "members_count": squad.get("membersCount", 0),
        "win_rate": squad.get("winRate", 0),
        "chemistry_score": squad.get("chemistryScore", 0),
        "formation": squad.get("formation"),
    }


async def update_tactics(squad_id: str, user_id: str, formation: str, tactical_notes: Optional[str]) -> dict:
    squad = db.get_document(DB_ID, settings.collection_squads, squad_id)
    if squad.get("captainId") != user_id:
        raise PermissionError("Only the captain can change tactics")
    return db.update_document(DB_ID, settings.collection_squads, squad_id,
                               {"formation": formation, "tacticalNotes": tactical_notes})


async def vote_leadership(squad_id: str, candidate_id: str, voter_id: str, vote: str) -> dict:
    doc = db.create_document(
        DB_ID, settings.collection_squad_members, ID.unique(),
        data={"squadId": squad_id, "candidateId": candidate_id, "voterId": voter_id, "vote": vote},
    )
    return doc
