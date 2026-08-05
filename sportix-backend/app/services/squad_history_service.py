"""
A squad's match history.

MatchHistory rendered squad.matchHistory from the zustand store: a fixture with
opponent names, scores, chemistry deltas and a top performer per match. The
matches collection holds everything except the top performer, which has to be
derived from the player_stats rows for that match — so there was no endpoint that
could serve the page, and every squad showed the same invented three matches.

Two shaping notes.

Only home_squad_id is indexed, not away_squad_id, so an away fixture cannot be
found by index. Matches are created with the squad as home and an opponent_name
string in the current flow, which is what this reads; away_squad_id is included
in the response so a future two-squad fixture is not silently dropped, but it
cannot be queried on until it has an index.

The top performer is whoever has the highest match_rating among validated stats,
falling back to the highest rating overall when nothing has been validated yet —
with is_mvp breaking a tie. Unvalidated numbers are still shown because a squad
looking at last night's match should not see a blank until three teammates have
voted, but the flag says which it is.
"""
from __future__ import annotations

import json
import logging

from appwrite.query import Query as Q

from app.core.appwrite import db, DB_ID
from app.core.config import settings

logger = logging.getLogger(__name__)

MATCHES = settings.collection_matches
STATS = settings.collection_player_stats
MEMBERS = settings.collection_squad_members
PROFILES = settings.collection_users


def _require_member(squad_id: str, user_id: str) -> None:
    rows = db.list_documents(DB_ID, MEMBERS, queries=[
        Q.equal("squad_id", squad_id), Q.equal("user_id", user_id), Q.limit(1),
    ]).get("documents", [])
    if not rows:
        raise PermissionError("Only squad members can see this history")


def _summarise(stats_data: str, sport: str) -> str:
    """
    A one-line stat summary, e.g. "2 goals, 1 assist".

    stats_data is a JSON blob whose keys differ per sport, so this reads whatever
    is there rather than assuming a shape, and puts the largest numbers first so
    the line leads with what stood out.
    """
    try:
        parsed = json.loads(stats_data) if stats_data else {}
    except json.JSONDecodeError:
        return sport
    if not isinstance(parsed, dict):
        return sport

    numeric = [(k, v) for k, v in parsed.items() if isinstance(v, (int, float)) and v]
    numeric.sort(key=lambda kv: kv[1], reverse=True)

    parts = []
    for key, value in numeric[:3]:
        label = key.replace("_", " ")
        # "1 goals" reads badly; the keys are plural in the fixtures.
        if value == 1 and label.endswith("s"):
            label = label[:-1]
        shown = int(value) if float(value).is_integer() else round(float(value), 1)
        parts.append(f"{shown} {label}")
    return ", ".join(parts) or sport


def _top_performer(match_id: str, sport: str) -> dict | None:
    try:
        rows = db.list_documents(DB_ID, STATS, queries=[
            Q.equal("match_id", match_id), Q.limit(50),
        ]).get("documents", [])
    except Exception:
        logger.warning("could not read stats for match %s", match_id, exc_info=True)
        return None
    if not rows:
        return None

    validated = [r for r in rows if r.get("validation_status") == "validated"]
    pool = validated or rows
    best = max(pool, key=lambda r: (float(r.get("match_rating") or 0), bool(r.get("is_mvp"))))

    profile = {}
    try:
        profile = db.get_document(DB_ID, PROFILES, best.get("user_id", ""))
    except Exception:
        logger.warning("top performer %s has no profile", best.get("user_id"))

    return {
        "user_id": best.get("user_id"),
        "full_name": profile.get("full_name", ""),
        "username": profile.get("username", ""),
        "avatar_url": profile.get("avatar_url"),
        "match_rating": float(best.get("match_rating") or 0),
        "is_mvp": bool(best.get("is_mvp")),
        "stats_summary": _summarise(best.get("stats_data", ""), sport),
        # False means three teammates have not confirmed these numbers yet.
        "is_validated": best.get("validation_status") == "validated",
    }


async def list_matches(squad_id: str, user_id: str,
                       page: int = 0, limit: int = 20) -> dict:
    _require_member(squad_id, user_id)

    res = db.list_documents(DB_ID, MATCHES, queries=[
        Q.equal("home_squad_id", squad_id),
        Q.limit(limit), Q.offset(page * limit), Q.order_desc("$createdAt"),
    ])
    matches = res.get("documents", [])

    items = []
    for match in matches:
        score_home = match.get("score_home")
        score_away = match.get("score_away")
        items.append({
            **match,
            # W / L / D, which is what the outcome badge renders. "pending" has
            # no letter: a match whose result was never entered shows as such
            # rather than being counted as a draw.
            "outcome": {"win": "W", "loss": "L", "draw": "D"}.get(match.get("result"), None),
            "score": (f"{score_home} - {score_away}"
                      if score_home is not None and score_away is not None else None),
            "top_performer": _top_performer(match["$id"], match.get("sport", "")),
        })

    return {
        "items": items,
        "total": res.get("total", len(items)),
        "page": page,
        "limit": limit,
        "has_more": (page + 1) * limit < res.get("total", 0),
    }
