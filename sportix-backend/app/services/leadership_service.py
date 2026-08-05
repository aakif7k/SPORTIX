"""
Leadership standing, the promotion recommendation, and the state of an open vote.

LeadershipApproval had a POST endpoint to cast a vote and nothing at all to read,
so the entire page was a fixture: a captain named in the markup, a leadership
score of 88, five component bars with literal percentages, a recommended
candidate with a hardcoded score and "strengths", a tally of 8 approvals to 2
rejections, two named members with their vote status, and a 48-hour countdown
that restarted from 48 hours every time the component mounted. None of it moved
when anybody voted.

Everything here is derived from rows that already exist. The leadership score has
five components because the UI shows five bars, and each maps to something
recorded:

  attendance          — how the member votes on scheduled practices, and whether
                        they say yes (squad_event_votes)
  communication       — share of the squad's channel messages they send
  reliability         — how much of their submitted match data survives
                        validation (player_stats)
  squad_approval      — the share of current leadership votes backing them
  event_participation — public events they have joined (event_participants)

Each is a percentage, and the overall score is their mean. This is deliberately
not an AI call: the numbers are the squad's own record, so a captain can be told
why the score is what it is, and it costs nothing to compute. The recommendation
is simply the highest-scoring member who is not already captain.

The vote window is derived rather than stored. leadership_votes has no deadline
column, so the window is 48 hours from the first vote cast for the leading
candidate, which is a real timestamp instead of a countdown that resets on
mount. A closed window still reports its tally.
"""
from __future__ import annotations

import logging
from collections import Counter
from datetime import datetime, timedelta, timezone

from appwrite.query import Query as Q

from app.core.appwrite import db, DB_ID
from app.core.config import settings

logger = logging.getLogger(__name__)

MEMBERS = settings.collection_squad_members
SQUADS = settings.collection_squads
VOTES = settings.collection_leadership_votes
SQUAD_EVENTS = settings.collection_squad_events
EVENT_VOTES = settings.collection_squad_event_votes
SQUAD_MESSAGES = settings.collection_squad_messages
STATS = settings.collection_player_stats
EVENT_PARTICIPANTS = settings.collection_event_participants
PROFILES = settings.collection_users

VOTE_WINDOW = timedelta(hours=48)

COMPONENT_LABELS = {
    "attendance": "Attendance",
    "communication": "Communication",
    "reliability": "Reliability",
    "squad_approval": "Squad Approval",
    "event_participation": "Event Participation",
}


def _rows(collection: str, queries: list[str]) -> list[dict]:
    try:
        return db.list_documents(DB_ID, collection, queries=queries).get("documents", [])
    except Exception:
        logger.warning("could not read %s", collection, exc_info=True)
        return []


def _parse(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def _pct(part: float, whole: float) -> int:
    """A percentage, floored into 0..100. Zero denominator means no evidence."""
    if whole <= 0:
        return 0
    return max(0, min(100, int(part / whole * 100)))


def _profile(user_id: str) -> dict:
    try:
        p = db.get_document(DB_ID, PROFILES, user_id)
    except Exception:
        return {"user_id": user_id, "full_name": "", "username": "",
                "avatar_url": None, "level": 1, "pulse_score": 0}
    return {
        "user_id": user_id,
        "full_name": p.get("full_name", ""),
        "username": p.get("username", ""),
        "avatar_url": p.get("avatar_url"),
        "level": int(p.get("level") or 1),
        "pulse_score": float(p.get("pulse_score") or 0),
    }


def _components(user_id: str, squad_id: str, context: dict) -> dict[str, int]:
    """The five inputs to a member's leadership score, each a percentage."""
    scheduled = context["scheduled_events"]
    my_votes = [v for v in context["event_votes"] if v.get("user_id") == user_id]
    # Answering at all is half the signal; saying yes is the other half. A member
    # who replies "no" to every practice is more reliable than one who never
    # replies, and less available than one who turns up.
    replied = _pct(len(my_votes), scheduled)
    said_yes = _pct(sum(1 for v in my_votes if v.get("vote") == "yes"), scheduled)
    attendance = (replied + said_yes) // 2

    messages = context["message_counts"]
    total_messages = sum(messages.values())
    # Measured against an equal share rather than the raw total, so in a squad of
    # five, sending a fifth of the messages is 100.
    fair_share = total_messages / max(1, context["member_count"])
    communication = _pct(messages.get(user_id, 0), fair_share) if fair_share else 0

    my_stats = [s for s in context["stats"] if s.get("user_id") == user_id]
    validated = sum(1 for s in my_stats if s.get("validation_status") == "validated")
    reliability = _pct(validated, len(my_stats))

    approvals = context["approval_counts"]
    squad_approval = _pct(approvals.get(user_id, 0), context["member_count"])

    joined = sum(1 for p in context["event_participation"] if p.get("user_id") == user_id)
    # Ten joined events reads as full engagement; more does not make someone a
    # better captain, so the scale caps there rather than rewarding volume.
    event_participation = _pct(joined, 10)

    return {
        "attendance": attendance,
        "communication": communication,
        "reliability": reliability,
        "squad_approval": squad_approval,
        "event_participation": event_participation,
    }


def _score(components: dict[str, int]) -> int:
    return round(sum(components.values()) / len(components)) if components else 0


def _strengths(components: dict[str, int]) -> list[str]:
    """The two strongest components, named, for the recommendation card."""
    ranked = sorted(components.items(), key=lambda kv: kv[1], reverse=True)
    return [COMPONENT_LABELS[key] for key, value in ranked[:2] if value > 0]


async def get_leadership(squad_id: str, user_id: str) -> dict:
    members = _rows(MEMBERS, [Q.equal("squad_id", squad_id), Q.limit(100)])
    member_ids = [m["user_id"] for m in members if m.get("user_id")]
    if user_id not in member_ids:
        raise PermissionError("Only squad members can see leadership standing")

    try:
        squad = db.get_document(DB_ID, SQUADS, squad_id)
    except Exception as exc:
        raise ValueError("That squad does not exist") from exc

    # ── Everything the five components are computed from, read once ───────────
    scheduled = _rows(SQUAD_EVENTS, [
        Q.equal("squad_id", squad_id), Q.equal("type", "practice"), Q.limit(100),
    ])
    event_votes: list[dict] = []
    for event in scheduled:
        event_votes.extend(_rows(EVENT_VOTES, [
            Q.equal("squad_event_id", event["$id"]), Q.limit(100),
        ]))

    messages = _rows(SQUAD_MESSAGES, [Q.equal("squad_id", squad_id), Q.limit(100)])
    message_counts = Counter(m["sender_id"] for m in messages if m.get("sender_id"))

    stats: list[dict] = []
    for uid in member_ids:
        stats.extend(_rows(STATS, [Q.equal("user_id", uid), Q.limit(50)]))

    participation: list[dict] = []
    for uid in member_ids:
        participation.extend(_rows(EVENT_PARTICIPANTS, [Q.equal("user_id", uid), Q.limit(50)]))

    votes = _rows(VOTES, [Q.equal("squad_id", squad_id), Q.limit(100)])
    approvals = Counter(v["candidate_id"] for v in votes
                        if v.get("vote") == "approve" and v.get("candidate_id"))

    context = {
        "scheduled_events": len(scheduled),
        "event_votes": event_votes,
        "message_counts": message_counts,
        "member_count": len(member_ids),
        "stats": stats,
        "approval_counts": approvals,
        "event_participation": participation,
    }

    # ── Per-member standing ──────────────────────────────────────────────────
    standings = []
    for member in members:
        uid = member.get("user_id")
        if not uid:
            continue
        components = _components(uid, squad_id, context)
        standings.append({
            **_profile(uid),
            "role": member.get("role", "member"),
            "joined_at": member.get("joined_at"),
            "components": components,
            "score": _score(components),
        })
    standings.sort(key=lambda s: s["score"], reverse=True)

    captain_id = squad.get("captain_id")
    captain = next((s for s in standings if s["user_id"] == captain_id), None)

    # ── Recommendation ───────────────────────────────────────────────────────
    # The best-scoring member who is not already captain. Not an AI call: these
    # are the squad's own records, so the reason is inspectable.
    candidate = next((s for s in standings if s["user_id"] != captain_id), None)
    recommendation = None
    if candidate:
        recommendation = {
            **{k: candidate[k] for k in
               ("user_id", "full_name", "username", "avatar_url", "score", "components")},
            "current_role": candidate["role"],
            "strengths": _strengths(candidate["components"]),
            "matches_analysed": len({s.get("match_id") for s in stats if s.get("match_id")}),
        }

    # ── Open vote ────────────────────────────────────────────────────────────
    vote = None
    if votes:
        leading_id, _ = Counter(v["candidate_id"] for v in votes
                                if v.get("candidate_id")).most_common(1)[0]
        for_candidate = [v for v in votes if v.get("candidate_id") == leading_id]
        opened = min((_parse(v.get("created_at")) for v in for_candidate
                      if _parse(v.get("created_at"))), default=None)
        closes = opened + VOTE_WINDOW if opened else None
        mine = next((v for v in votes if v.get("voter_id") == user_id), None)

        vote = {
            "candidate": _profile(leading_id),
            "approve": sum(1 for v in for_candidate if v.get("vote") == "approve"),
            "reject": sum(1 for v in for_candidate if v.get("vote") == "reject"),
            "total_members": len(member_ids),
            # A strict majority, matching squad_service.vote_leadership.
            "votes_needed": len(member_ids) // 2 + 1,
            "my_vote": mine.get("vote") if mine and mine.get("candidate_id") == leading_id else None,
            "opened_at": opened.isoformat() if opened else None,
            "closes_at": closes.isoformat() if closes else None,
            "is_closed": bool(closes and datetime.now(timezone.utc) > closes),
            # Who has and has not weighed in, which the page listed by name.
            "ballots": [
                {
                    **_profile(uid),
                    "vote": next((v.get("vote") for v in for_candidate
                                  if v.get("voter_id") == uid), None),
                }
                for uid in member_ids
            ],
        }

    return {
        "squad_id": squad_id,
        "captain": captain,
        "captain_since": (captain or {}).get("joined_at") or squad.get("created_at"),
        "is_captain": captain_id == user_id,
        "component_labels": COMPONENT_LABELS,
        "standings": standings,
        "recommendation": recommendation,
        "vote": vote,
        # The roles the page lays out as tactical delegations; absent roles come
        # back unfilled rather than being invented.
        "roles": [
            {
                "role": role,
                "member": next((s for s in standings if s["role"] == role), None),
            }
            for role in ("captain", "vice", "strategist", "analyst", "recruiter")
        ],
    }
