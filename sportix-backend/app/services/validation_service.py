"""
Teammate validation of submitted match stats.

Owns the stat_validations collection and the consensus rule, which comes from
pulse_math.validate_stat_votes (ported from validationService.ts):

    score = (confirms + partials * 0.5) / total
      >= 0.8 -> validated, weight 1.0
      >= 0.5 -> partial,   weight 0.7
      else   -> disputed,  weight 0.3

The weight is what scales the Pulse actually awarded, so a disputed submission
still earns something rather than nothing.

Previously this module forwarded to match_service; the dependency now runs the
other way so the rule lives in one place.
"""
from __future__ import annotations

import logging

from appwrite.id import ID
from appwrite.query import Query as Q

from app.core.appwrite import db, DB_ID
from app.core.config import settings
from app.services import pulse_math
from app.utils.formatters import now_iso

logger = logging.getLogger(__name__)

VALIDATIONS = settings.collection_stat_validations
PLAYER_STATS = settings.collection_player_stats

VALID_VOTES = ("confirm", "partial", "dispute")


def get_votes(stat_id: str) -> list[dict]:
    res = db.list_documents(DB_ID, VALIDATIONS, queries=[
        Q.equal("stat_id", stat_id), Q.limit(100),
    ])
    return res.get("documents", [])


def tally(stat_id: str) -> dict:
    """Current consensus for a stat submission."""
    votes = [v.get("vote") for v in get_votes(stat_id)]
    return pulse_math.validate_stat_votes([v for v in votes if v in VALID_VOTES])


async def record_vote(stat_id: str, validator_id: str, vote: str, reason: str | None = None) -> dict:
    """
    Register one teammate's vote and re-evaluate the submission.

    A validator may vote once per stat; the unique(stat_id, validator_id) index
    enforces that, and a repeat vote updates the existing row rather than adding
    a second one that would skew the tally.
    """
    if vote not in VALID_VOTES:
        raise ValueError(f"vote must be one of {', '.join(VALID_VOTES)}")

    stat = db.get_document(DB_ID, PLAYER_STATS, stat_id)
    if stat.get("user_id") == validator_id:
        raise PermissionError("You cannot validate your own stats.")

    now = now_iso()
    existing = db.list_documents(DB_ID, VALIDATIONS, queries=[
        Q.equal("stat_id", stat_id), Q.equal("validator_id", validator_id), Q.limit(1),
    ]).get("documents", [])

    if existing:
        db.update_document(DB_ID, VALIDATIONS, existing[0]["$id"],
                           {"vote": vote, "reason": reason, "updated_at": now})
    else:
        db.create_document(DB_ID, VALIDATIONS, ID.unique(), {
            "stat_id": stat_id,
            "validator_id": validator_id,
            "vote": vote,
            "reason": reason,
            "created_at": now,
        })

    return await apply_consensus(stat_id)


async def apply_consensus(stat_id: str) -> dict:
    """
    Recompute the tally and write it onto the player_stats row.

    Vote counts are stored denormalised so the UI can render them without a
    second query.
    """
    result = tally(stat_id)
    db.update_document(DB_ID, PLAYER_STATS, stat_id, {
        "validation_status": result["status"],
        "confirm_votes": result["confirms"],
        "partial_votes": result["partials"],
        "dispute_votes": result["disputes"],
        "updated_at": now_iso(),
    })
    return {"stat_id": stat_id, **result}
