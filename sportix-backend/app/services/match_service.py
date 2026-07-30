from appwrite.query import Query as Q
from appwrite.id import ID
from app.core.appwrite import db, DB_ID
from app.core.config import settings
from app.schemas.match import StatsSubmission, StatValidate
from app.utils.formatters import now_iso
from typing import Optional


async def create(
    event_id: Optional[str],
    home_squad_id: Optional[str],
    away_squad_id: Optional[str],
    sport: str,
) -> dict:
    return db.create_document(
        DB_ID, settings.collection_matches, ID.unique(),
        data={
            "event_id": event_id,
            "home_squad_id": home_squad_id,
            "away_squad_id": away_squad_id,
            "sport": sport,
            "result": "pending",
            "score_home": None,
            "score_away": None,
            "status": "active",
        },
    )


async def get_by_id(match_id: str) -> dict:
    return db.get_document(DB_ID, settings.collection_matches, match_id)


async def update_result(
    match_id: str,
    result: str,
    score_home: Optional[int],
    score_away: Optional[int],
) -> dict:
    return db.update_document(
        DB_ID, settings.collection_matches, match_id,
        {"result": result, "score_home": score_home, "score_away": score_away, "status": "completed"},
    )


async def submit_stats(match_id: str, user_id: str, payload: StatsSubmission) -> dict:
    # Create the stats document
    stat = db.create_document(
        DB_ID, settings.collection_player_stats, ID.unique(),
        data={
            "match_id": match_id,
            "user_id": user_id,
            "sport": payload.sport,
            "stats_data": str(payload.stats_data),
            "match_rating": payload.match_rating,
            "is_mvp": payload.is_mvp,
            "media_proof_url": payload.media_proof_url,
            "validation_status": "pending",
            "confirm_votes": 0,
            "dispute_votes": 0,
        },
    )
    # Update pulse score based on match rating
    _update_pulse_from_match(user_id, payload.match_rating)
    return stat


async def get_stats(match_id: str) -> dict:
    return db.list_documents(
        DB_ID, settings.collection_player_stats,
        queries=[Q.equal("match_id", match_id), Q.limit(50)],
    )


async def validate_stat(stat_id: str, validator_id: str, payload: StatValidate) -> dict:
    db.create_document(
        DB_ID, settings.collection_stat_validations, ID.unique(),
        data={
            "stat_id": stat_id,
            "validator_id": validator_id,
            "vote": payload.vote.value,
            "reason": payload.reason,
        },
    )
    # Update vote counts on the stat document
    stat = db.get_document(DB_ID, settings.collection_player_stats, stat_id)
    if payload.vote.value == "confirm":
        db.update_document(DB_ID, settings.collection_player_stats, stat_id,
                           {"confirm_votes": stat.get("confirm_votes", 0) + 1})
    elif payload.vote.value == "dispute":
        db.update_document(DB_ID, settings.collection_player_stats, stat_id,
                           {"dispute_votes": stat.get("dispute_votes", 0) + 1})
    # Auto-validate if 3+ confirms with no disputes
    confirm_count = stat.get("confirm_votes", 0) + (1 if payload.vote.value == "confirm" else 0)
    if confirm_count >= 3:
        db.update_document(DB_ID, settings.collection_player_stats, stat_id,
                           {"validation_status": "validated"})
        _award_pulse_for_validation(stat.get("user_id", ""))
    return db.get_document(DB_ID, settings.collection_player_stats, stat_id)


async def retention_vote(match_id: str, voter_id: str, target_id: str, vote: str) -> dict:
    """
    Record one voter's verdict on one teammate.

    Re-voting updates the existing row: unique(match_id, voter_id, target_id)
    would otherwise reject the second write.
    """
    if voter_id == target_id:
        raise ValueError("You cannot cast a retention vote on yourself")

    existing = db.list_documents(
        DB_ID, settings.collection_retention_votes,
        queries=[
            Q.equal("match_id", match_id), Q.equal("voter_id", voter_id),
            Q.equal("target_id", target_id), Q.limit(1),
        ],
    ).get("documents", [])

    now = now_iso()
    if existing:
        return db.update_document(
            DB_ID, settings.collection_retention_votes, existing[0]["$id"],
            {"vote": vote, "updated_at": now},
        )
    return db.create_document(
        DB_ID, settings.collection_retention_votes, ID.unique(),
        data={
            "match_id": match_id, "voter_id": voter_id, "target_id": target_id,
            "vote": vote, "created_at": now,
        },
    )


async def check_pending_report(user_id: str) -> dict:
    """Check if user has any pending (unvalidated) stat submissions."""
    res = db.list_documents(
        DB_ID, settings.collection_player_stats,
        queries=[Q.equal("user_id", user_id), Q.equal("validation_status", "pending"), Q.limit(5)],
    )
    return {
        "has_pending": len(res.get("documents", [])) > 0,
        "pending_count": len(res.get("documents", [])),
        "pending": res.get("documents", []),
    }


def _update_pulse_from_match(user_id: str, rating: float):
    """Award pulse points based on match rating (1-10 → 0-20 pulse)."""
    pulse_award = (rating / 10) * 20
    try:
        res = db.list_documents(
            DB_ID, settings.collection_pulse_scores,
            queries=[Q.equal("user_id", user_id), Q.limit(1)],
        )
        if res.get("documents"):
            doc = res["documents"][0]
            current = doc.get("total_pulse", 100.0)
            new_total = min(1000, current + pulse_award)
            db.update_document(DB_ID, settings.collection_pulse_scores, doc["$id"],
                               {"total_pulse": new_total, "match_performance": doc.get("match_performance", 0) + pulse_award})
    except Exception:
        pass


def _award_pulse_for_validation(user_id: str):
    """Small pulse bonus for having stats validated."""
    try:
        res = db.list_documents(
            DB_ID, settings.collection_pulse_scores,
            queries=[Q.equal("user_id", user_id), Q.limit(1)],
        )
        if res.get("documents"):
            doc = res["documents"][0]
            db.update_document(DB_ID, settings.collection_pulse_scores, doc["$id"],
                               {"total_pulse": doc.get("total_pulse", 100) + 5,
                                "reliability": doc.get("reliability", 0) + 2})
    except Exception:
        pass
