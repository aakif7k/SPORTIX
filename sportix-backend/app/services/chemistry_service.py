"""
Squad chemistry.

calculate_delta is a straight port of performanceService.calculateChemistryDelta.

The composite `overall` score is NOT a port: the frontend never computed one.
Every ChemistryData in the codebase carries hardcoded mock numbers (87, 92, 88),
so there was no formula to carry over.

It is an equal-weighted mean of the three pillars named in the ChemistryData
interface. Equal weighting is deliberate: any other split would assert a product
claim -- that trust matters some specific amount more than communication -- which
nothing in the codebase or the data supports, and it would be unexplainable to a
user. "The average of your three chemistry pillars" needs no justification. It
also reproduces the one internally consistent mock sample exactly
(trust 94, coordination 90, communication 92 -> 92).

Isolated in composite_overall so it can be retuned in one place once there is
real match data to calibrate against.
"""
from __future__ import annotations

import logging

from appwrite.query import Query as Q

from app.core.appwrite import db, DB_ID
from app.core.config import settings
from app.services import pulse_math
from app.utils.formatters import now_iso

logger = logging.getLogger(__name__)

SQUADS = settings.collection_squads
MEMBERS = settings.collection_squad_members

# The three pillars contribute equally -- see the module docstring for why no
# other split is defensible without data.
PILLARS = ("trust", "coordination", "communication")


def calculate_delta(is_mvp: bool, result: str, match_rating: float) -> int:
    """Port of performanceService.calculateChemistryDelta."""
    return pulse_math.calculate_chemistry_delta(is_mvp, result, match_rating)


def composite_overall(trust: float, coordination: float, communication: float) -> int:
    """Equal-weighted mean of the three pillars, clamped to 0..100."""
    raw = (trust + coordination + communication) / len(PILLARS)
    return int(max(0, min(100, pulse_math.js_round(raw))))


async def get_squad_chemistry(squad_id: str) -> dict:
    """
    Chemistry for a squad, with `overall` recomputed from the stored pillars so a
    stale or hand-edited overall cannot drift away from its components.
    """
    squad = db.get_document(DB_ID, SQUADS, squad_id)
    trust = float(squad.get("trust", 0.0))
    coordination = float(squad.get("coordination", 0.0))
    communication = float(squad.get("communication", 0.0))

    members = db.list_documents(DB_ID, MEMBERS, queries=[
        Q.equal("squad_id", squad_id), Q.limit(100),
    ]).get("documents", [])

    return {
        "squad_id": squad_id,
        "overall": composite_overall(trust, coordination, communication),
        "trust": trust,
        "coordination": coordination,
        "communication": communication,
        "chemistry_score": float(squad.get("chemistry_score", 0.0)),
        "pulse_avg": float(squad.get("pulse_avg", 0.0)),
        "members_count": len(members),
        "matches_played": int(squad.get("matches_played", 0)),
    }


async def apply_match_delta(squad_id: str, delta: float) -> dict:
    """
    Move a squad's chemistry after a match.

    The delta is applied to all three pillars and to chemistry_score, each
    clamped to 0..100, then overall is recomputed from the new pillars.
    """
    squad = db.get_document(DB_ID, SQUADS, squad_id)

    def shift(key: str) -> float:
        return max(0.0, min(100.0, float(squad.get(key, 0.0)) + delta))

    trust, coordination = shift("trust"), shift("coordination")
    communication, score = shift("communication"), shift("chemistry_score")

    db.update_document(DB_ID, SQUADS, squad_id, {
        "trust": trust,
        "coordination": coordination,
        "communication": communication,
        "chemistry_score": score,
        "updated_at": now_iso(),
    })

    return {
        "squad_id": squad_id,
        "delta": delta,
        "overall": composite_overall(trust, coordination, communication),
        "trust": trust,
        "coordination": coordination,
        "communication": communication,
        "chemistry_score": score,
    }


async def calculate_squad_chemistry(squad_id: str) -> dict:
    """Backwards-compatible alias for the previous entry point."""
    return await get_squad_chemistry(squad_id)
