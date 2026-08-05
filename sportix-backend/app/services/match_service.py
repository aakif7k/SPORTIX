import json
import logging

from appwrite.query import Query as Q
from appwrite.id import ID
from app.core.appwrite import db, DB_ID
from app.core.config import settings
from app.schemas.match import StatsSubmission, StatValidate
from app.services import pulse_math, pulse_service, validation_service
from app.utils.formatters import now_iso
from typing import Optional

logger = logging.getLogger(__name__)


async def create(
    event_id: Optional[str],
    home_squad_id: Optional[str],
    away_squad_id: Optional[str],
    sport: str,
    opponent_name: Optional[str] = None,
) -> dict:
    return db.create_document(
        DB_ID, settings.collection_matches, ID.unique(),
        data={
            "created_at": now_iso(),
            "event_id": event_id,
            "home_squad_id": home_squad_id,
            "away_squad_id": away_squad_id,
            "sport": sport,
            # The match-history card renders "VS <opponent>", and with no away
            # squad this string is the only thing that names the other side.
            "opponent_name": opponent_name,
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
            "created_at": now_iso(),
            "match_id": match_id,
            "user_id": user_id,
            "sport": payload.sport,
            "stats_data": json.dumps(payload.stats_data),
            "match_rating": payload.match_rating,
            "is_mvp": payload.is_mvp,
            "media_proof_url": payload.media_proof_url,
            "submitted_at": now_iso(),
            "validation_status": "pending",
            "confirm_votes": 0,
            "dispute_votes": 0,
        },
    )
    # Award using the real per-sport formula rather than the old rating/10*20
    # placeholder. Weight starts at 1.0 and is re-applied as teammates validate.
    match = db.get_document(DB_ID, settings.collection_matches, match_id)
    award = await pulse_service.award_from_match(
        user_id=user_id,
        sport=payload.sport,
        stats=payload.stats_data,
        match_rating=payload.match_rating,
        is_mvp=payload.is_mvp,
        result=match.get("result", "pending"),
        weight=1.0,
        match_id=match_id,
    )
    db.update_document(
        DB_ID, settings.collection_player_stats, stat["$id"],
        {
            "pulse_earned": float(award["pulse_earned"]),
            "ssr_delta": float(award["ssr_delta"]),
            "chemistry_delta": float(award["chemistry_delta"]),
            "updated_at": now_iso(),
        },
    )
    # The award already knows the level move and the new tier; picking three keys
    # out of it threw that away, which is why the post-match reward screen showed a
    # hardcoded "level 27 to 28" and a made-up rank.
    return {
        **stat,
        **{k: award[k] for k in (
            "pulse_earned", "ssr_delta", "chemistry_delta",
            "level", "previous_level", "leveled_up", "tier", "total_pulse",
        ) if k in award},
    }


async def get_stats(match_id: str) -> dict:
    return db.list_documents(
        DB_ID, settings.collection_player_stats,
        queries=[Q.equal("match_id", match_id), Q.limit(50)],
    )


async def validate_stat(stat_id: str, validator_id: str, payload: StatValidate) -> dict:
    """
    Record a teammate's vote and re-apply the consensus.

    The previous implementation counted votes by hand, treated 3 confirms as
    validated regardless of how many disputes there were, and never applied the
    weighting. validation_service owns the ported rule; this delegates to it and
    then re-weights the Pulse already awarded.
    """
    result = await validation_service.record_vote(
        stat_id=stat_id,
        validator_id=validator_id,
        vote=payload.vote.value,
        reason=payload.reason,
    )

    stat = db.get_document(DB_ID, settings.collection_player_stats, stat_id)
    match = db.get_document(DB_ID, settings.collection_matches, stat.get("match_id", ""))

    # Re-award at the new consensus weight. The delta is the difference from what
    # was already granted, so repeated votes cannot pay out repeatedly.
    try:
        stats_data = json.loads(stat.get("stats_data") or "{}")
    except json.JSONDecodeError:
        logger.warning("stat %s has unreadable stats_data; skipping re-weight", stat_id)
        return {**stat, "consensus": result}

    full = pulse_math.calculate_pulse(
        stat.get("sport", ""), stats_data, float(stat.get("match_rating", 0)),
        bool(stat.get("is_mvp")), match.get("result", "pending"),
    )
    target = pulse_math.js_round(full * result["weight"])
    already = float(stat.get("pulse_earned", 0.0))
    adjustment = target - already

    if adjustment:
        await pulse_service.award_pulse(
            user_id=stat.get("user_id", ""), source="validation",
            amount=float(adjustment),
            reason=f"consensus {result['status']} ({result['score']:.0%})",
            reference_id=stat_id, component="reliability",
        )
        db.update_document(DB_ID, settings.collection_player_stats, stat_id,
                           {"pulse_earned": float(target), "updated_at": now_iso()})
        stat["pulse_earned"] = float(target)

    return {**stat, "consensus": result}


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
    """
    Matches this athlete played but has not filed a report for.

    This used to return stat submissions **awaiting validation**, which is the
    opposite thing: the banner it feeds says "you have a match to report", so it
    appeared precisely when the athlete had already reported and was waiting on
    teammates, and never when they actually owed a report.

    A match is owed a report when it is completed, one of the athlete's squads
    played it, and they have no player_stats row against it. Only home_squad_id is
    indexed, which is what the current match-creation flow fills, so an away
    fixture cannot be found by index — noted rather than silently missed.

    `awaiting_validation` is still reported, because it is genuinely useful, just
    under a name that says what it is.
    """
    squad_ids = [
        m["squad_id"] for m in db.list_documents(
            DB_ID, settings.collection_squad_members,
            queries=[Q.equal("user_id", user_id), Q.limit(50)],
        ).get("documents", []) if m.get("squad_id")
    ]

    reported = {
        s["match_id"] for s in db.list_documents(
            DB_ID, settings.collection_player_stats,
            queries=[Q.equal("user_id", user_id), Q.limit(200)],
        ).get("documents", []) if s.get("match_id")
    }

    awaiting = db.list_documents(
        DB_ID, settings.collection_player_stats,
        queries=[Q.equal("user_id", user_id),
                 Q.equal("validation_status", "pending"), Q.limit(25)],
    ).get("total", 0)

    owed = []
    for squad_id in squad_ids:
        matches = db.list_documents(
            DB_ID, settings.collection_matches,
            queries=[Q.equal("home_squad_id", squad_id), Q.equal("status", "completed"),
                     Q.limit(25), Q.order_desc("$createdAt")],
        ).get("documents", [])
        for match in matches:
            if match["$id"] in reported:
                continue
            played = match.get("played_at") or match.get("created_at")
            owed.append({
                "match_id": match["$id"],
                "event_name": (f"vs {match['opponent_name']}"
                               if match.get("opponent_name") else "Friendly match"),
                "sport": match.get("sport", "generic"),
                "date": played,
                "days_ago": _days_since(played),
            })

    owed.sort(key=lambda m: m.get("date") or "", reverse=True)
    return {
        "has_pending": bool(owed),
        "pending_count": len(owed),
        "pending": owed,
        # Distinct from the above: reports already filed, waiting on teammates.
        "awaiting_validation": awaiting,
    }


def _days_since(when: Optional[str]) -> int:
    if not when:
        return 0
    from datetime import datetime, timezone
    try:
        parsed = datetime.fromisoformat(str(when).replace("Z", "+00:00"))
    except ValueError:
        return 0
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return max(0, (datetime.now(timezone.utc) - parsed).days)