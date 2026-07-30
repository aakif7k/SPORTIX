"""
Parity between app/services/pulse_math.py and the TypeScript it replaces.

The expected values in tests/fixtures/pulse_reference.json are produced by
actually executing src/services/performanceService.ts:

    node --experimental-strip-types scripts/gen_pulse_reference.ts

They are not hand-derived, so this test cannot pass by making the same
arithmetic mistake twice. Regenerate the fixture whenever performanceService.ts
changes; a drift there should break this test, which is the point.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.services import pulse_math as pm

FIXTURE = Path(__file__).parent / "fixtures" / "pulse_reference.json"

SPORTS = ("football", "cricket", "basketball", "running")


def _load() -> list[dict]:
    assert FIXTURE.exists(), (
        f"{FIXTURE} is missing. Generate it with:\n"
        "  node --experimental-strip-types scripts/gen_pulse_reference.ts"
    )
    return json.loads(FIXTURE.read_text())["cases"]


CASES = _load()


def _label(c: dict) -> str:
    return f"{c['sport']}-r{c['match_rating']}-{'mvp' if c['is_mvp'] else 'nomvp'}-{c['result']}"


def _bucket(sport: str) -> str:
    return sport if sport in SPORTS else "generic"


def test_fixture_covers_at_least_eight_cases_per_sport():
    counts: dict[str, int] = {}
    for c in CASES:
        counts[_bucket(c["sport"])] = counts.get(_bucket(c["sport"]), 0) + 1
    for bucket in (*SPORTS, "generic"):
        assert counts.get(bucket, 0) >= 8, f"{bucket}: only {counts.get(bucket, 0)} cases, need >= 8"


@pytest.mark.parametrize("case", CASES, ids=[_label(c) for c in CASES])
def test_calculate_pulse_matches_typescript(case):
    got = pm.calculate_pulse(
        case["sport"], case["stats"], case["match_rating"], case["is_mvp"], case["result"]
    )
    assert got == case["expected"]["pulse"], (
        f"{_label(case)}: python={got} typescript={case['expected']['pulse']} "
        f"stats={case['stats']}"
    )
    assert isinstance(got, int)


@pytest.mark.parametrize("case", CASES, ids=[_label(c) for c in CASES])
def test_pulse_breakdown_rows_match_typescript(case):
    got = pm.get_pulse_breakdown(
        case["sport"], case["stats"], case["match_rating"], case["is_mvp"], case["result"]
    )
    assert [r["value"] for r in got["rows"]] == case["expected"]["breakdown_rows"], (
        f"{_label(case)}: row values diverge"
    )
    assert got["total"] == pytest.approx(case["expected"]["breakdown_total"])


@pytest.mark.parametrize("case", CASES, ids=[_label(c) for c in CASES])
def test_ssr_delta_matches_typescript(case):
    got = pm.calculate_ssr_delta(
        case["sport"], case["stats"], case["match_rating"], case["result"]
    )
    assert got == pytest.approx(case["expected"]["ssr_delta"]), (
        f"{_label(case)}: python={got} typescript={case['expected']['ssr_delta']}"
    )


@pytest.mark.parametrize("case", CASES, ids=[_label(c) for c in CASES])
def test_chemistry_delta_matches_typescript(case):
    got = pm.calculate_chemistry_delta(case["is_mvp"], case["result"], case["match_rating"])
    assert got == case["expected"]["chemistry_delta"], (
        f"{_label(case)}: python={got} typescript={case['expected']['chemistry_delta']}"
    )


# ── Rounding semantics ────────────────────────────────────────────────────────
@pytest.mark.parametrize("value,expected", [
    (0.5, 1), (1.5, 2), (2.5, 3),          # JS rounds halves away from zero...
    (-0.5, 0), (-1.5, -1), (-2.5, -2),     # ...which for negatives means upward
    (0.49, 0), (0.51, 1), (10.0, 10),
])
def test_js_round_differs_from_python_round(value, expected):
    assert pm.js_round(value) == expected


def test_python_round_would_have_been_wrong():
    """Guards the reason js_round exists: banker's rounding disagrees on halves."""
    assert round(0.5) == 0 and pm.js_round(0.5) == 1
    assert round(2.5) == 2 and pm.js_round(2.5) == 3


# ── Tier thresholds ───────────────────────────────────────────────────────────
@pytest.mark.parametrize("pulse,tier", [
    (0, "contender"), (100, "contender"), (799.99, "contender"),
    (800, "elite"), (899.99, "elite"),
    (900, "pulse_elite"), (1000, "pulse_elite"),
])
def test_tier_thresholds(pulse, tier):
    assert pm.tier_for(pulse) == tier


def test_pulse_is_clamped_to_zero_thousand():
    assert pm.clamp_pulse(-50) == 0
    assert pm.clamp_pulse(1500) == 1000
    assert pm.clamp_pulse(450) == 450


# ── Level curve (input is LIFETIME earned Pulse, not the current score) ───────
@pytest.mark.parametrize("lifetime,level", [
    (0, 1), (99, 1), (100, 2), (199, 2), (250, 3),
    (1000, 11), (14900, 150), (15000, 150), (99999, 150),
    (-50, 1),   # a negative can never be produced, but must not underflow
])
def test_level_for_lifetime_pulse(lifetime, level):
    assert pm.level_for_pulse(lifetime) == level


def test_new_account_starts_at_level_one():
    """
    A user who has earned nothing is level 1 at 0%.

    Feeding the *current* score here instead of lifetime earned was the bug: the
    starting score of 100 sits exactly on the level-2 boundary, so every new
    account displayed as level 2.
    """
    p = pm.level_progress(0)
    assert p["level"] == 1
    assert p["progress_percent"] == 0
    assert p["title"] == "Rookie"


def test_all_levels_and_titles_are_reachable_on_the_lifetime_scale():
    """
    Regression for the scale conflation: when level came off the 0..1000 current
    score, only 11 of 150 levels and 2 of 15 titles could ever be reached.
    """
    titles = {pm.level_title(lvl) for lvl in range(1, pm.MAX_LEVEL + 1)}
    assert len(titles) == 15
    assert pm.level_for_pulse(pm.MAX_LEVEL * pm.PULSE_PER_LEVEL) == pm.MAX_LEVEL
    assert pm.level_title(pm.MAX_LEVEL) == "Supreme GOAT"


@pytest.mark.parametrize("level,title", [
    (1, "Rookie"), (10, "Rookie"), (11, "Challenger"), (30, "Contender"),
    (50, "Elite"), (100, "Legend"), (101, "Grandmaster X"), (150, "Supreme GOAT"),
])
def test_level_titles(level, title):
    assert pm.level_title(level) == title


def test_level_progress_is_a_real_number_not_zero():
    """Regression: get_level previously always reported 0 progress."""
    p = pm.level_progress(250)
    assert p["level"] == 3
    assert p["current"] == 50 and p["required"] == 100
    assert p["remaining"] == 50
    assert p["progress_percent"] == 50


def test_level_progress_caps_at_hundred_past_max_level():
    p = pm.level_progress(20000)
    assert p["level"] == 150
    assert p["progress_percent"] == 100


# ── Validation consensus ──────────────────────────────────────────────────────
@pytest.mark.parametrize("votes,status,weight", [
    ([], "validated", 1.0),
    (["confirm"], "validated", 1.0),
    (["confirm", "confirm", "confirm"], "validated", 1.0),
    (["confirm", "confirm", "confirm", "confirm", "partial"], "validated", 1.0),  # 0.9
    (["confirm", "confirm", "partial", "partial"], "partial", 0.7),               # 0.75
    (["confirm", "partial"], "partial", 0.7),                                     # 0.75
    (["confirm", "dispute"], "partial", 0.7),                                     # 0.5 boundary
    (["partial", "partial"], "partial", 0.7),                                     # 0.5 boundary
    (["dispute", "dispute"], "disputed", 0.3),                                    # 0.0
    (["confirm", "dispute", "dispute", "dispute"], "disputed", 0.3),              # 0.25
])
def test_validate_stat_votes(votes, status, weight):
    got = pm.validate_stat_votes(votes)
    assert got["status"] == status
    assert got["weight"] == weight


def test_validate_counts_each_vote_kind():
    got = pm.validate_stat_votes(["confirm", "confirm", "partial", "dispute"])
    assert (got["confirms"], got["partials"], got["disputes"], got["total"]) == (2, 1, 1, 4)
    assert got["score"] == pytest.approx((2 + 0.5) / 4)
