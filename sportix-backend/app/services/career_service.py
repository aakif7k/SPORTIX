"""
An athlete's own match history and career aggregates.

useMatchReport and useCareerStats did this in the browser, reading
matchReportStore: filtering match history, summing wins and losses, totalling
Pulse, and computing an SSR rating and its trend. The server owns that maths
everywhere else, and the store persisted nothing, so a refresh emptied an
athlete's whole career.

Two decisions worth recording.

**Only validated stats count.** A submission needs three teammate confirmations
to become `validated`; counting unconfirmed numbers in a career record would let
anyone type themselves a hat-trick and have it stick. Pending rows are returned in
the history so an athlete can see what is awaiting confirmation, flagged with
is_pending, but they are excluded from every aggregate.

**SSR has a stated baseline.** There is no stored SSR column — only a per-match
`ssr_delta` — and the client computed `8.4 + sum(deltas)`, which handed every
brand-new athlete an 8.4/10 career rating before they had played once. The
baseline here is the neutral midpoint of the 0-10 scale, an athlete with no
validated matches has no SSR at all rather than a flattering one, and the running
total is clamped to the scale.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta, timezone

from appwrite.query import Query as Q

from app.core.appwrite import db, DB_ID
from app.core.config import settings

logger = logging.getLogger(__name__)

STATS = settings.collection_player_stats
MATCHES = settings.collection_matches
EVENTS = settings.collection_events

# The neutral midpoint of the 0-10 SSR scale. Deliberately not the client's 8.4,
# which described nobody.
SSR_BASELINE = 5.0
SSR_MIN, SSR_MAX = 0.0, 10.0

# Which stat keys to surface per sport, in display order. The blob holds whatever
# the sport form collected; a history row shows the two or three that matter.
SUMMARY_KEYS: dict[str, list[str]] = {
    "football": ["goals", "assists", "passes", "tackles", "saves"],
    "cricket": ["runs", "wickets", "catches", "balls_faced", "strike_rate"],
    "basketball": ["points", "assists", "rebounds", "steals", "blocks"],
    "running": ["distance_km", "finish_time_seconds", "position_finished"],
    "generic": ["contribution", "team_impact"],
}


def _parse_stats(raw: str | None) -> dict:
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        logger.warning("unreadable stats_data blob")
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _summary(sport: str, stats: dict) -> dict:
    """Display-ready stat line: the sport's headline keys that are actually set."""
    keys = SUMMARY_KEYS.get(sport, [])
    out: dict[str, object] = {}
    for key in keys:
        if key in stats and stats[key] not in (None, "", 0):
            out[key.replace("_", " ").title()] = stats[key]
    # A sport with no mapping, or a blob using unexpected keys, still shows
    # something rather than an empty row.
    if not out:
        for key, value in list(stats.items())[:3]:
            if isinstance(value, (int, float, str)) and value not in (None, "", 0):
                out[str(key).replace("_", " ").title()] = value
    return out


def _num(value) -> float:
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0


def _match_of(match_id: str, cache: dict[str, dict]) -> dict:
    if match_id in cache:
        return cache[match_id]
    try:
        match = db.get_document(DB_ID, MATCHES, match_id)
    except Exception:
        match = {}
    cache[match_id] = match
    return match


def _event_name(match: dict, cache: dict[str, str]) -> str:
    """
    What the match is called. Matches carry an optional event_id and an
    opponent_name; the history row wants one human label, so an event title wins
    and an opponent is the fallback.
    """
    event_id = match.get("event_id")
    if event_id:
        if event_id in cache:
            return cache[event_id]
        try:
            title = db.get_document(DB_ID, EVENTS, event_id).get("title", "")
        except Exception:
            title = ""
        cache[event_id] = title
        if title:
            return title
    opponent = match.get("opponent_name")
    return f"vs {opponent}" if opponent else "Friendly match"


async def get_history(user_id: str, sport: str | None = None,
                      result: str | None = None, period: str | None = None,
                      page: int = 0, limit: int = 50) -> dict:
    """
    The athlete's own reports, newest first, each flattened for display.

    Filtering happens here rather than in the browser so a long career is not
    downloaded in full to render one filtered page.
    """
    queries = [Q.equal("user_id", user_id), Q.limit(limit), Q.offset(page * limit),
               Q.order_desc("$createdAt")]
    if sport and sport != "generic":
        queries.append(Q.equal("sport", sport))

    res = db.list_documents(DB_ID, STATS, queries=queries)
    rows = res.get("documents", [])

    match_cache: dict[str, dict] = {}
    event_cache: dict[str, str] = {}

    items = []
    for row in rows:
        match = _match_of(row.get("match_id", ""), match_cache)
        match_result = match.get("result", "pending")

        if result and result != "all" and match_result != result:
            continue

        stats = _parse_stats(row.get("stats_data"))
        played = match.get("played_at") or row.get("submitted_at") or row.get("created_at")

        if period == "month" and played:
            cutoff = datetime.now(timezone.utc) - timedelta(days=30)
            try:
                when = datetime.fromisoformat(str(played).replace("Z", "+00:00"))
                if when.tzinfo is None:
                    when = when.replace(tzinfo=timezone.utc)
                if when < cutoff:
                    continue
            except ValueError:
                pass

        items.append({
            "id": row["$id"],
            "match_id": row.get("match_id"),
            "event_name": _event_name(match, event_cache),
            "sport": row.get("sport", "generic"),
            "match_result": match_result,
            "date": played,
            "pulse_earned": _num(row.get("pulse_earned")),
            "ssr_delta": _num(row.get("ssr_delta")),
            "match_rating": _num(row.get("match_rating")),
            "is_mvp": bool(row.get("is_mvp")),
            "validation_status": row.get("validation_status", "pending"),
            # Anything not yet confirmed by three teammates is shown but marked,
            # and is excluded from every career aggregate.
            "is_pending": row.get("validation_status") != "validated",
            "stat_summary": _summary(row.get("sport", "generic"), stats),
            "confirm_votes": int(row.get("confirm_votes") or 0),
            "dispute_votes": int(row.get("dispute_votes") or 0),
        })

    return {
        "items": items,
        "total": res.get("total", len(items)),
        "page": page,
        "limit": limit,
        "has_more": (page + 1) * limit < res.get("total", 0),
    }


async def get_career(user_id: str, sport: str | None = None) -> dict:
    """
    Career totals across validated matches, with the per-sport breakdowns the
    PerformanceTracker renders.
    """
    queries = [Q.equal("user_id", user_id), Q.equal("validation_status", "validated"),
               Q.limit(200), Q.order_asc("$createdAt")]
    rows = db.list_documents(DB_ID, STATS, queries=queries).get("documents", [])

    match_cache: dict[str, dict] = {}
    enriched = []
    for row in rows:
        match = _match_of(row.get("match_id", ""), match_cache)
        enriched.append({
            "sport": row.get("sport", "generic"),
            "result": match.get("result", "pending"),
            "pulse": _num(row.get("pulse_earned")),
            "ssr_delta": _num(row.get("ssr_delta")),
            "rating": _num(row.get("match_rating")),
            "is_mvp": bool(row.get("is_mvp")),
            "stats": _parse_stats(row.get("stats_data")),
        })

    # SSR accumulates over the whole career regardless of the sport filter: it is
    # one rating for the athlete, not one per sport.
    ssr_deltas = [e["ssr_delta"] for e in enriched]
    current_ssr = (max(SSR_MIN, min(SSR_MAX, SSR_BASELINE + sum(ssr_deltas)))
                   if enriched else None)
    recent = sum(ssr_deltas[-5:])
    ssr_trend = "up" if recent > 0.2 else "down" if recent < -0.2 else "stable"

    scoped = [e for e in enriched
              if not sport or sport == "generic" or e["sport"] == sport]

    wins = sum(1 for e in scoped if e["result"] == "win")
    losses = sum(1 for e in scoped if e["result"] == "loss")
    draws = sum(1 for e in scoped if e["result"] == "draw")
    total = len(scoped)

    def total_of(sport_name: str, *keys: str) -> float:
        return sum(_num(e["stats"].get(k))
                   for e in enriched if e["sport"] == sport_name for k in keys)

    def matches_of(sport_name: str) -> list[dict]:
        return [e for e in enriched if e["sport"] == sport_name]

    football = matches_of("football")
    cricket = matches_of("cricket")
    basketball = matches_of("basketball")

    career = {
        "sport": sport or "generic",
        "total_matches": total,
        "wins": wins,
        "losses": losses,
        "draws": draws,
        # Decided against counting draws in the denominator's favour: win rate is
        # wins over matches played, which is what the label says.
        "win_rate": round(wins / total * 100) if total else 0,
        "total_pulse_earned": round(sum(e["pulse"] for e in scoped), 1),
        "current_ssr": round(current_ssr, 1) if current_ssr is not None else None,
        "ssr_trend": ssr_trend,
        "mvp_count": sum(1 for e in scoped if e["is_mvp"]),
        # How many submissions are still waiting on teammates, so a thin career
        # record is explainable rather than just looking empty.
        "pending_count": _pending_count(user_id),
    }

    if football:
        career["football"] = {
            "total_goals": total_of("football", "goals"),
            "total_assists": total_of("football", "assists"),
            "avg_rating": round(sum(e["rating"] for e in football) / len(football), 1),
            "mvp_count": sum(1 for e in football if e["is_mvp"]),
        }
    if cricket:
        rates = [_num(e["stats"].get("strike_rate")) for e in cricket]
        scores = [_num(e["stats"].get("runs")) for e in cricket]
        career["cricket"] = {
            "total_runs": total_of("cricket", "runs"),
            "total_wickets": total_of("cricket", "wickets"),
            "avg_strike_rate": round(sum(rates) / len(rates), 1) if rates else 0,
            "best_score": max(scores) if scores else 0,
        }
    if basketball:
        rebounds = [_num(e["stats"].get("rebounds")) for e in basketball]
        career["basketball"] = {
            "total_points": total_of("basketball", "points"),
            "total_assists": total_of("basketball", "assists"),
            "avg_rebounds": round(sum(rebounds) / len(rebounds), 1) if rebounds else 0,
        }

    return career


def _pending_count(user_id: str) -> int:
    try:
        return db.list_documents(DB_ID, STATS, queries=[
            Q.equal("user_id", user_id), Q.equal("validation_status", "pending"),
            Q.limit(1),
        ]).get("total", 0)
    except Exception:
        logger.warning("could not count pending stats for %s", user_id, exc_info=True)
        return 0
