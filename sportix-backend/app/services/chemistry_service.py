"""
Squad chemistry.

calculate_delta is a straight port of performanceService.calculateChemistryDelta.

The composite `overall` score is NOT a port: the frontend never computed one.
Every ChemistryData in the codebase carries hardcoded mock numbers (87, 92, 88),
so there was no formula to carry over. The weighting below is therefore a new
product decision, chosen so that trust dominates and the three pillars named in
the ChemistryData interface are the only inputs. It is isolated here so it can be
retuned in one place once there is real match data to calibrate against.
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

# New product decision, not ported -- see the module docstring.
WEIGHT_TRUST = 0.4
WEIGHT_COORDINATION = 0.3
WEIGHT_COMMUNICATION = 0.3


def calculate_delta(is_mvp: bool, result: str, match_rating: float) -> int:
    """Port of performanceService.calculateChemistryDelta."""
    return pulse_math.calculate_chemistry_delta(is_mvp, result, match_rating)


def composite_overall(trust: float, coordination: float, communication: float) -> int:
    """Weighted mean of the three pillars, clamped to 0..100."""
    raw = (
        trust * WEIGHT_TRUST
        + coordination * WEIGHT_COORDINATION
        + communication * WEIGHT_COMMUNICATION
    )
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
