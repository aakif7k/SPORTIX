"""
Tournaments: listing, standings, brackets and squad registration.

The tournaments and tournament_matches collections were provisioned in phase 2,
and app/utils/seed.py even writes demo tournaments into them — but no service or
router ever read either one. TournamentHub was entirely literal: a featured
championship written into the markup, a five-row standings table with invented
records, a bracket with hardcoded squad names and scores, two "upcoming cups", and
a registration button that appended a squad id to component state so the page said
"Registered" until it unmounted.

Standings are derived, not stored. There is no standings table and there does not
need to be one: a squad's record is the completed tournament_matches it appears
in. Points are 3 for a win and 1 for a draw, which is the convention the table's
PTS column implies, and ordering is points, then score difference, then squad
Pulse — so a tie is broken by something the squad earned rather than by document
order. Deriving it means a match result recorded once is reflected everywhere,
and there is no second copy of the truth to fall out of step.

Registration is captain-only, matching what the page already told the user
("select an active squad under your captaincy"). Capacity is enforced against
max_squads, and the tournament flips to `full` on the write that fills it.
"""
from __future__ import annotations

import logging

from appwrite.exception import AppwriteException
from appwrite.query import Query as Q

from app.core.appwrite import db, DB_ID
from app.core.config import settings
from app.utils.formatters import now_iso

logger = logging.getLogger(__name__)

TOURNAMENTS = settings.collection_tournaments
TOURNAMENT_MATCHES = settings.collection_tournament_matches
SQUADS = settings.collection_squads
MEMBERS = settings.collection_squad_members

WIN_POINTS = 3
DRAW_POINTS = 1


def _squad(squad_id: str) -> dict:
    try:
        s = db.get_document(DB_ID, SQUADS, squad_id)
    except AppwriteException:
        return {"squad_id": squad_id, "name": "Unknown squad", "sport": "",
                "logo_url": None, "pulse_avg": 0.0, "chemistry_score": 0.0}
    return {
        "squad_id": squad_id,
        "name": s.get("name", ""),
        "sport": s.get("sport", ""),
        "logo_url": s.get("logo_url"),
        "pulse_avg": float(s.get("pulse_avg") or 0),
        "chemistry_score": float(s.get("chemistry_score") or 0),
    }


def _matches(tournament_id: str) -> list[dict]:
    try:
        return db.list_documents(DB_ID, TOURNAMENT_MATCHES, queries=[
            Q.equal("tournament_id", tournament_id), Q.limit(100), Q.order_asc("round"),
        ]).get("documents", [])
    except AppwriteException:
        logger.warning("could not read matches for tournament %s",
                       tournament_id, exc_info=True)
        return []


def _standings(tournament: dict, matches: list[dict]) -> list[dict]:
    """
    A row per registered squad, ordered by points then score difference then
    Pulse. Squads with no completed match yet appear with a zeroed record rather
    than being left out — a registered squad that has not played is still in the
    tournament.
    """
    squad_ids = list(tournament.get("squad_ids") or [])
    table: dict[str, dict] = {
        sid: {**_squad(sid), "wins": 0, "losses": 0, "draws": 0,
              "scored": 0, "conceded": 0, "played": 0, "points": 0}
        for sid in squad_ids
    }

    for match in matches:
        if match.get("status") != "completed":
            continue
        a, b = match.get("squad_a_id"), match.get("squad_b_id")
        sa, sb = match.get("squad_a_score"), match.get("squad_b_score")
        if not a or not b or sa is None or sb is None:
            continue

        for sid in (a, b):
            # A squad that played but is not in squad_ids still belongs in the
            # table; dropping it would silently lose results.
            if sid not in table:
                table[sid] = {**_squad(sid), "wins": 0, "losses": 0, "draws": 0,
                              "scored": 0, "conceded": 0, "played": 0, "points": 0}

        table[a]["played"] += 1
        table[b]["played"] += 1
        table[a]["scored"] += int(sa)
        table[a]["conceded"] += int(sb)
        table[b]["scored"] += int(sb)
        table[b]["conceded"] += int(sa)

        if sa > sb:
            table[a]["wins"] += 1
            table[b]["losses"] += 1
        elif sb > sa:
            table[b]["wins"] += 1
            table[a]["losses"] += 1
        else:
            table[a]["draws"] += 1
            table[b]["draws"] += 1

    rows = []
    for row in table.values():
        row["points"] = row["wins"] * WIN_POINTS + row["draws"] * DRAW_POINTS
        row["difference"] = row["scored"] - row["conceded"]
        rows.append(row)

    rows.sort(key=lambda r: (r["points"], r["difference"], r["pulse_avg"]), reverse=True)
    for position, row in enumerate(rows, start=1):
        row["position"] = position
    return rows


def _bracket(matches: list[dict]) -> list[dict]:
    """Matches grouped by round, oldest round first, for the bracket view."""
    rounds: dict[int, dict] = {}
    for match in matches:
        number = int(match.get("round") or 0)
        bucket = rounds.setdefault(number, {
            "round": number,
            "name": match.get("round_name") or f"Round {number}",
            "matches": [],
        })
        bucket["matches"].append({
            "$id": match["$id"],
            "squad_a_id": match.get("squad_a_id"),
            "squad_a_name": match.get("squad_a_name"),
            "squad_a_score": match.get("squad_a_score"),
            "squad_b_id": match.get("squad_b_id"),
            "squad_b_name": match.get("squad_b_name"),
            "squad_b_score": match.get("squad_b_score"),
            "winner_id": match.get("winner_id"),
            "status": match.get("status", "tbd"),
            "scheduled_at": match.get("scheduled_at"),
        })
    return [rounds[key] for key in sorted(rounds)]


def _shape(tournament: dict, my_squad_ids: set[str]) -> dict:
    squad_ids = list(tournament.get("squad_ids") or [])
    max_squads = int(tournament.get("max_squads") or 0)
    return {
        **tournament,
        "squads_count": len(squad_ids),
        "slots_left": max(0, max_squads - len(squad_ids)) if max_squads else None,
        # Which of the caller's own squads is in this tournament, so the page can
        # show "Registered" without a second request.
        "my_registered_squad_ids": sorted(my_squad_ids & set(squad_ids)),
        "is_registered": bool(my_squad_ids & set(squad_ids)),
    }


async def _my_squad_ids(user_id: str) -> set[str]:
    rows = db.list_documents(DB_ID, MEMBERS, queries=[
        Q.equal("user_id", user_id), Q.limit(100),
    ]).get("documents", [])
    return {r["squad_id"] for r in rows if r.get("squad_id")}


# ─── Reads ────────────────────────────────────────────────────────────────────
async def browse(user_id: str, status: str | None = None, sport: str | None = None,
                 page: int = 0, limit: int = 20) -> dict:
    """
    Tournaments, soonest first. The page shows a featured championship and a list
    of upcoming cups, both from this.
    """
    queries = [Q.limit(limit), Q.offset(page * limit), Q.order_asc("starts_at")]
    if status:
        queries.append(Q.equal("status", status))
    if sport:
        queries.append(Q.equal("sport", sport))

    res = db.list_documents(DB_ID, TOURNAMENTS, queries=queries)
    mine = await _my_squad_ids(user_id)

    return {
        "items": [_shape(t, mine) for t in res.get("documents", [])],
        "total": res.get("total", 0),
        "page": page,
        "limit": limit,
        "has_more": (page + 1) * limit < res.get("total", 0),
    }


async def get_detail(tournament_id: str, user_id: str) -> dict:
    try:
        tournament = db.get_document(DB_ID, TOURNAMENTS, tournament_id)
    except AppwriteException as exc:
        raise FileNotFoundError("That tournament does not exist") from exc

    matches = _matches(tournament_id)
    mine = await _my_squad_ids(user_id)

    return {
        **_shape(tournament, mine),
        "standings": _standings(tournament, matches),
        "bracket": _bracket(matches),
    }


# ─── Writes ───────────────────────────────────────────────────────────────────
async def register_squad(tournament_id: str, squad_id: str, user_id: str) -> dict:
    """
    Enter a squad. Captain-only, which is what the page already claimed.

    squad_ids is an array attribute and Appwrite cannot index arrays, so this
    reads the tournament and rewrites the list. Two captains registering in the
    same instant could therefore have one write land on a stale list; the
    capacity check runs on the value just read, and the loser is corrected by the
    next read rather than being silently dropped, since the write includes the
    full list.
    """
    try:
        tournament = db.get_document(DB_ID, TOURNAMENTS, tournament_id)
    except AppwriteException as exc:
        raise FileNotFoundError("That tournament does not exist") from exc

    try:
        squad = db.get_document(DB_ID, SQUADS, squad_id)
    except AppwriteException as exc:
        raise FileNotFoundError("That squad does not exist") from exc

    if squad.get("captain_id") != user_id:
        raise PermissionError("Only the squad's captain can enter a tournament")

    if tournament.get("status") not in ("registering", "full"):
        raise ValueError("This tournament is no longer accepting entries")

    if squad.get("sport") and tournament.get("sport") \
            and squad["sport"] != tournament["sport"]:
        raise ValueError(
            f"This is a {tournament['sport']} tournament and that squad plays "
            f"{squad['sport']}")

    squad_ids = list(tournament.get("squad_ids") or [])
    if squad_id in squad_ids:
        # Idempotent: pressing Register twice is not an error.
        return _shape(tournament, {squad_id})

    max_squads = int(tournament.get("max_squads") or 0)
    if max_squads and len(squad_ids) >= max_squads:
        raise ValueError("This tournament is full")

    squad_ids.append(squad_id)
    now = now_iso()
    updates = {"squad_ids": squad_ids, "updated_at": now}
    if max_squads and len(squad_ids) >= max_squads:
        updates["status"] = "full"

    updated = db.update_document(DB_ID, TOURNAMENTS, tournament_id, updates)
    return _shape(updated, {squad_id})


async def withdraw_squad(tournament_id: str, squad_id: str, user_id: str) -> dict:
    """Pull a squad out, while the tournament has not started."""
    try:
        tournament = db.get_document(DB_ID, TOURNAMENTS, tournament_id)
        squad = db.get_document(DB_ID, SQUADS, squad_id)
    except AppwriteException as exc:
        raise FileNotFoundError("That tournament or squad does not exist") from exc

    if squad.get("captain_id") != user_id:
        raise PermissionError("Only the squad's captain can withdraw it")
    if tournament.get("status") not in ("registering", "full"):
        raise ValueError("A tournament in progress cannot be withdrawn from")

    squad_ids = [sid for sid in (tournament.get("squad_ids") or []) if sid != squad_id]
    updates = {"squad_ids": squad_ids, "updated_at": now_iso()}
    # Withdrawing from a full tournament reopens it.
    if tournament.get("status") == "full":
        updates["status"] = "registering"

    updated = db.update_document(DB_ID, TOURNAMENTS, tournament_id, updates)
    return _shape(updated, set())
