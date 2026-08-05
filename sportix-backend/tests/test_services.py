"""
Business rules, tested directly against the services.

The endpoint suite proves every route is wired and cannot 500. It deliberately
says nothing about whether the answers are right, because Appwrite is mocked and
almost anything returns a plausible shape. These tests cover the rules that
actually decide what a user sees: consensus weighting, leadership majorities,
chemistry, coin balances, mission claiming and streaks.
"""
from __future__ import annotations

import json

import pytest

from app.services import (
    chemistry_service, coins_service, level_service,
    mission_service, squad_service, validation_service,
)

pytestmark = pytest.mark.asyncio


# ── Chemistry ─────────────────────────────────────────────────────────────────
@pytest.mark.parametrize("trust,coord,comm,expected", [
    (90, 90, 90, 90),
    (94, 90, 92, 92),      # the one internally consistent mock sample
    (0, 0, 0, 0),
    (100, 100, 100, 100),
    (86, 83, 85, 85),      # 84.67 -> 85, JS rounding
    (150, 100, 100, 100),  # clamped
    (-50, 0, 0, 0),        # clamped
])
async def test_chemistry_overall_is_the_equal_mean(trust, coord, comm, expected):
    assert chemistry_service.composite_overall(trust, coord, comm) == expected


@pytest.mark.parametrize("is_mvp,result,rating,expected", [
    (False, "loss", 0, 0),
    (False, "win", 10, 4),      # 2 + 2
    (True, "win", 10, 7),       # 2 + 2 + 3
    (True, "draw", 5, 4),       # 1 + 3
])
async def test_chemistry_delta_matches_the_ported_formula(is_mvp, result, rating, expected):
    assert chemistry_service.calculate_delta(is_mvp, result, rating) == expected


async def test_apply_match_delta_clamps_and_recomputes_overall(appwrite):
    appwrite.when(r"/(?:collections|tables)/squads/(?:documents|rows)/", {
        "$id": "squad1", "trust": 99.0, "coordination": 50.0,
        "communication": 50.0, "chemistry_score": 50.0,
    })
    out = await chemistry_service.apply_match_delta("squad1", 5)
    assert out["trust"] == 100.0                      # clamped, not 104
    assert out["coordination"] == 55.0
    assert out["overall"] == chemistry_service.composite_overall(100.0, 55.0, 55.0)


# ── Validation consensus ──────────────────────────────────────────────────────
async def test_a_validator_cannot_vote_on_their_own_stats(appwrite):
    appwrite.when(r"/(?:collections|tables)/player_stats/(?:documents|rows)/", {
        "$id": "stat1", "user_id": "user123",
    })
    with pytest.raises(PermissionError):
        await validation_service.record_vote("stat1", "user123", "confirm")


async def test_an_unknown_vote_is_rejected(appwrite):
    with pytest.raises(ValueError):
        await validation_service.record_vote("stat1", "other", "sabotage")


@pytest.mark.parametrize("votes,status", [
    (["confirm", "confirm", "confirm"], "validated"),
    (["confirm", "partial"], "partial"),
    (["dispute", "dispute"], "disputed"),
])
async def test_consensus_status_follows_the_vote_mix(appwrite, votes, status):
    appwrite.when(r"/(?:collections|tables)/stat_validations/(?:documents|rows)$",
                  {"documents": [{"$id": f"v{i}", "vote": v} for i, v in enumerate(votes)],
                   "total": len(votes)})
    result = await validation_service.apply_consensus("stat1")
    assert result["status"] == status


async def test_consensus_counts_each_kind(appwrite):
    appwrite.when(r"/(?:collections|tables)/stat_validations/(?:documents|rows)$",
                  {"documents": [{"vote": "confirm"}, {"vote": "confirm"},
                                 {"vote": "partial"}, {"vote": "dispute"}], "total": 4})
    r = await validation_service.apply_consensus("stat1")
    assert (r["confirms"], r["partials"], r["disputes"]) == (2, 1, 1)
    assert r["weight"] == 0.7          # score 0.625 -> partial


# ── Coins ─────────────────────────────────────────────────────────────────────
async def test_spending_more_than_the_balance_is_refused(appwrite):
    appwrite.when(r"/(?:collections|tables)/user_coins/(?:documents|rows)$",
                  {"documents": [{"$id": "w1", "user_id": "u1", "balance": 10}], "total": 1})
    with pytest.raises(ValueError, match="Insufficient"):
        await coins_service.spend("u1", 50, "too expensive")


async def test_awarding_credits_the_wallet(appwrite):
    appwrite.when(r"/(?:collections|tables)/user_coins/(?:documents|rows)$",
                  {"documents": [{"$id": "w1", "user_id": "u1", "balance": 10}], "total": 1})
    out = await coins_service.award("u1", 15, "mission reward")
    assert out["balance"] == 25


async def test_spending_debits_the_wallet(appwrite):
    appwrite.when(r"/(?:collections|tables)/user_coins/(?:documents|rows)$",
                  {"documents": [{"$id": "w1", "user_id": "u1", "balance": 40}], "total": 1})
    out = await coins_service.spend("u1", 15, "a purchase")
    assert out["balance"] == 25


# ── Squad leadership (B5) ─────────────────────────────────────────────────────
def _members(*ids):
    return {"documents": [{"$id": f"m_{i}", "user_id": i, "squad_id": "sq1"} for i in ids],
            "total": len(ids)}


async def test_only_members_may_vote_on_leadership(appwrite):
    appwrite.when(r"/(?:collections|tables)/squad_members/(?:documents|rows)$", _members("a", "b", "c"))
    with pytest.raises(PermissionError):
        await squad_service.vote_leadership("sq1", "a", "outsider", "approve")


async def test_the_candidate_must_be_a_member(appwrite):
    appwrite.when(r"/(?:collections|tables)/squad_members/(?:documents|rows)$", _members("a", "b", "c"))
    with pytest.raises(ValueError):
        await squad_service.vote_leadership("sq1", "stranger", "a", "approve")


async def test_a_minority_does_not_promote(appwrite):
    appwrite.when(r"/(?:collections|tables)/squad_members/(?:documents|rows)$", _members("a", "b", "c", "d"))
    appwrite.when(r"/(?:collections|tables)/leadership_votes/(?:documents|rows)$",
                  {"documents": [{"$id": "v1", "candidate_id": "b", "voter_id": "a",
                                  "vote": "approve"}], "total": 1})
    out = await squad_service.vote_leadership("sq1", "b", "a", "approve")
    assert out["new_captain_id"] is None
    assert out["votes_needed"] == 3          # 4 members -> strict majority is 3


async def test_a_strict_majority_promotes_the_candidate(appwrite):
    appwrite.when(r"/(?:collections|tables)/squad_members/(?:documents|rows)$", _members("a", "b", "c"))
    appwrite.when(r"/(?:collections|tables)/leadership_votes/(?:documents|rows)$",
                  {"documents": [
                      {"$id": "v1", "candidate_id": "b", "voter_id": "a", "vote": "approve"},
                      {"$id": "v2", "candidate_id": "b", "voter_id": "c", "vote": "approve"},
                  ], "total": 2})
    appwrite.when(r"/(?:collections|tables)/squads/(?:documents|rows)/", {"$id": "sq1", "captain_id": "a"})
    out = await squad_service.vote_leadership("sq1", "b", "a", "approve")
    assert out["new_captain_id"] == "b"
    assert out["previous_captain_id"] == "a"


async def test_leadership_votes_never_touch_squad_members(appwrite):
    """B5 regression: these rows used to be written into squad_members."""
    appwrite.when(r"/(?:collections|tables)/squad_members/(?:documents|rows)$", _members("a", "b", "c"))
    appwrite.when(r"/(?:collections|tables)/leadership_votes/(?:documents|rows)$", {"documents": [], "total": 0})
    await squad_service.vote_leadership("sq1", "b", "a", "approve")
    writes = [(m, p) for m, p in appwrite.requests
              if m == "post" and p.endswith("/squad_members/documents")]
    assert not writes, f"a leadership vote was written into squad_members: {writes}"


# ── Levels ────────────────────────────────────────────────────────────────────
async def test_sync_level_reports_a_promotion(appwrite):
    appwrite.when(r"/(?:collections|tables)/user_levels/(?:documents|rows)$",
                  {"documents": [{"$id": "l1", "user_id": "u1", "current_level": 2,
                                  "total_pulse_ever": 150.0, "level_ups_count": 1}], "total": 1})
    out = await level_service.sync_level("u1", 350.0, 350.0)
    assert (out["previous_level"], out["level"], out["leveled_up"]) == (2, 4, True)


async def test_sync_level_is_silent_when_nothing_changed(appwrite):
    appwrite.when(r"/(?:collections|tables)/user_levels/(?:documents|rows)$",
                  {"documents": [{"$id": "l1", "user_id": "u1", "current_level": 2,
                                  "total_pulse_ever": 150.0}], "total": 1})
    out = await level_service.sync_level("u1", 150.0, 150.0)
    assert out["leveled_up"] is False


async def test_lifetime_pulse_defaults_to_zero_for_a_new_account(appwrite):
    appwrite.when(r"/(?:collections|tables)/user_levels/(?:documents|rows)$", {"documents": [], "total": 0})
    assert await level_service.get_lifetime_pulse("nobody") == 0.0


# ── Missions ──────────────────────────────────────────────────────────────────
async def test_claiming_an_incomplete_mission_is_refused(appwrite):
    appwrite.when(r"/(?:collections|tables)/user_missions/(?:documents|rows)/",
                  {"$id": "m1", "user_id": "user123", "progress": 0, "target": 3,
                   "is_claimed": False, "mission_key": "view_feed"})
    with pytest.raises(ValueError, match="not yet completed"):
        await mission_service.claim("m1", "user123")


async def test_claiming_someone_elses_mission_is_refused(appwrite):
    appwrite.when(r"/(?:collections|tables)/user_missions/(?:documents|rows)/",
                  {"$id": "m1", "user_id": "someone_else", "progress": 3, "target": 3})
    with pytest.raises(PermissionError):
        await mission_service.claim("m1", "user123")


async def test_a_mission_cannot_be_claimed_twice(appwrite):
    appwrite.when(r"/(?:collections|tables)/user_missions/(?:documents|rows)/",
                  {"$id": "m1", "user_id": "user123", "progress": 1, "target": 1,
                   "is_claimed": True, "mission_key": "post_update"})
    with pytest.raises(ValueError, match="Already claimed"):
        await mission_service.claim("m1", "user123")


async def test_completion_is_derived_not_stored(appwrite):
    done = mission_service._decorate({"progress": 3, "target": 3}, {"title": "t"})
    part = mission_service._decorate({"progress": 1, "target": 3}, {"title": "t"})
    assert done["is_completed"] is True
    assert part["is_completed"] is False


async def test_streak_resets_after_a_missed_day(appwrite):
    from datetime import date, timedelta
    long_ago = (date.today() - timedelta(days=10)).isoformat()
    appwrite.when(r"/(?:collections|tables)/user_streaks/(?:documents|rows)$",
                  {"documents": [{"$id": "s1", "user_id": "u1", "current_streak": 9,
                                  "longest_streak": 9, "last_active_date": long_ago}],
                   "total": 1})
    await mission_service._update_streak("u1")
    patches = [p for m, p in appwrite.requests if m == "patch"]
    assert patches, "the streak row was never updated"


async def test_streak_continues_from_yesterday(appwrite):
    from datetime import date, timedelta
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    appwrite.when(r"/(?:collections|tables)/user_streaks/(?:documents|rows)$",
                  {"documents": [{"$id": "s1", "user_id": "u1", "current_streak": 4,
                                  "longest_streak": 7, "last_active_date": yesterday}],
                   "total": 1})
    await mission_service._update_streak("u1")
    assert any(m == "patch" for m, _ in appwrite.requests)


async def test_streak_is_not_double_counted_on_the_same_day(appwrite):
    from datetime import date
    appwrite.when(r"/(?:collections|tables)/user_streaks/(?:documents|rows)$",
                  {"documents": [{"$id": "s1", "user_id": "u1", "current_streak": 4,
                                  "last_active_date": date.today().isoformat()}], "total": 1})
    await mission_service._update_streak("u1")
    assert not [m for m, _ in appwrite.requests if m == "patch"]
