"""
Pure Pulse / SSR / chemistry / level arithmetic, ported from the frontend.

This module has no I/O so it can be tested for exact parity with the TypeScript
it replaces. Sources:

  src/services/performanceService.ts  calculatePulse, getPulseBreakdown,
                                      calculateSSRDelta, calculateChemistryDelta
  src/store/gamificationStore.ts      LEVELS, getLevelTitle, getLevelInfo,
                                      getLevelProgress
  src/store/pulseStore.ts             tier thresholds, the 0..1000 clamp
  src/services/validationService.ts   validateTeammateStats

The per-sport coefficients are product decisions, not placeholders. Do not
"simplify" them.

Three faithfulness notes
------------------------
1. JavaScript's Math.round rounds half away from zero (Math.round(0.5) === 1);
   Python's round() uses banker's rounding (round(0.5) == 0). js_round below
   reproduces the JavaScript behaviour, and is used everywhere the original
   called Math.round.
2. calculate_pulse accumulates in floating point and rounds once at the end,
   while get_pulse_breakdown rounds each row and then sums. Those two can differ
   by a point or so. That is how the TypeScript behaves, and the breakdown is a
   display aid, so calculate_pulse remains the authority for what is awarded.
3. `Number(stats.x ?? 0)` in JS yields NaN for an unparseable string, which then
   poisons the whole total into NaN. Here an unparseable value is treated as 0
   instead: propagating NaN into a stored score is strictly worse than ignoring
   one bad field. This is the only deliberate divergence.
"""
from __future__ import annotations

import math
from typing import Any, Mapping

# pulseStore clamps the score to this range, and the tier thresholds below only
# make sense on that scale.
MIN_PULSE = 0.0
MAX_PULSE = 1000.0

Stats = Mapping[str, Any]


def js_round(x: float) -> int:
    """Math.round semantics: halves go away from zero for positives, up for negatives."""
    return math.floor(x + 0.5)


def _num(stats: Stats, key: str, default: float = 0.0) -> float:
    """
    `Number(stats[key] ?? default)`.

    The JS nullish coalescing operator only substitutes for null/undefined, so a
    present-but-zero or present-but-empty value is NOT replaced by the default.
    """
    if key not in stats:
        return float(default)
    raw = stats[key]
    if raw is None:
        return float(default)
    if isinstance(raw, bool):
        return 1.0 if raw else 0.0
    if isinstance(raw, (int, float)):
        return float(raw)
    text = str(raw).strip()
    if text == "":
        return 0.0          # Number("") === 0
    try:
        return float(text)
    except ValueError:
        return 0.0          # see faithfulness note 3


def _truthy(stats: Stats, key: str) -> bool:
    """JS truthiness for the value at `key` (0, "", None, False are falsy)."""
    v = stats.get(key)
    if isinstance(v, str):
        return v != ""
    if isinstance(v, (int, float)) and not isinstance(v, bool):
        return v != 0
    return bool(v)


# ── Pulse ─────────────────────────────────────────────────────────────────────
def calculate_pulse(
    sport: str,
    stats: Stats,
    match_rating: float,
    is_mvp: bool,
    result: str,
) -> int:
    """Port of performanceService.calculatePulse. Returns the points awarded."""
    sport = (sport or "").lower()
    pulse = 0.0

    if sport == "football":
        pulse += _num(stats, "goals") * 25
        pulse += _num(stats, "assists") * 15
        pulse += min(_num(stats, "passes") / 10, 10)     # max +10
        pulse += min(_num(stats, "tackles") / 3, 10)     # max +10
        pulse += _num(stats, "saves") * 8
        pulse += (match_rating / 10) * 20

    elif sport == "cricket":
        pulse += min(_num(stats, "runs") * 0.5, 50)      # max +50
        pulse += _num(stats, "wickets") * 20
        pulse += _num(stats, "catches") * 10
        pulse += (match_rating / 10) * 20

    elif sport == "basketball":
        pulse += min(_num(stats, "points"), 40)
        pulse += _num(stats, "assists") * 8
        pulse += _num(stats, "rebounds") * 5
        pulse += _num(stats, "steals") * 8
        pulse += _num(stats, "blocks") * 6
        pulse += (match_rating / 10) * 15                # note: 15, not 20

    elif sport == "running":
        pulse += 30                                       # base for completing
        if _truthy(stats, "personalBest"):
            pulse += 50
        if _num(stats, "positionFinished", 99) <= 3:
            pulse += 40
        pulse += (match_rating / 10) * 15

    else:
        pulse += _num(stats, "contribution", 5) * 5
        pulse += (match_rating / 10) * 20

    if is_mvp:
        pulse += 40
    if result == "win":
        pulse += 15
    elif result == "draw":
        pulse += 5

    return max(0, js_round(pulse))


def get_pulse_breakdown(
    sport: str,
    stats: Stats,
    match_rating: float,
    is_mvp: bool,
    result: str,
) -> dict:
    """
    Port of performanceService.getPulseBreakdown — the itemised view shown to a
    user before they submit. Rows are rounded individually, so `total` here may
    differ slightly from calculate_pulse; that one governs what is awarded.
    """
    sport = (sport or "").lower()
    rows: list[dict] = []

    def row(label: str, value: float) -> None:
        rows.append({"label": label, "value": value})

    if sport == "football":
        goals, assists = _num(stats, "goals"), _num(stats, "assists")
        passes, tackles = _num(stats, "passes"), _num(stats, "tackles")
        saves = _num(stats, "saves")
        if goals:
            row(f"Goals ({_i(goals)} x 25)", goals * 25)
        if assists:
            row(f"Assists ({_i(assists)} x 15)", assists * 15)
        passes_pts = js_round(min(passes / 10, 10))
        if passes_pts:
            row("Passes bonus", passes_pts)
        tackles_pts = js_round(min(tackles / 3, 10))
        if tackles_pts:
            row("Tackles bonus", tackles_pts)
        if saves:
            row(f"Saves ({_i(saves)} x 8)", saves * 8)

    elif sport == "cricket":
        runs, wickets, catches = _num(stats, "runs"), _num(stats, "wickets"), _num(stats, "catches")
        if runs:
            row("Runs (x0.5, max 50)", js_round(min(runs * 0.5, 50)))
        if wickets:
            row(f"Wickets ({_i(wickets)} x 20)", wickets * 20)
        if catches:
            row(f"Catches ({_i(catches)} x 10)", catches * 10)

    elif sport == "basketball":
        points, assists = _num(stats, "points"), _num(stats, "assists")
        rebounds, steals, blocks = _num(stats, "rebounds"), _num(stats, "steals"), _num(stats, "blocks")
        if points:
            row("Points (max 40)", min(points, 40))
        if assists:
            row(f"Assists ({_i(assists)} x 8)", assists * 8)
        if rebounds:
            row(f"Rebounds ({_i(rebounds)} x 5)", rebounds * 5)
        if steals:
            row(f"Steals ({_i(steals)} x 8)", steals * 8)
        if blocks:
            row(f"Blocks ({_i(blocks)} x 6)", blocks * 6)

    elif sport == "running":
        row("Race completion", 30)
        if _truthy(stats, "personalBest"):
            row("Personal Best!", 50)
        if _num(stats, "positionFinished", 99) <= 3:
            row("Top 3 finish", 40)

    else:
        contribution = _num(stats, "contribution", 5)
        row(f"Contribution ({_i(contribution)} x 5)", contribution * 5)

    rating_pts = js_round((match_rating / 10) * (15 if sport == "basketball" else 20))
    row(f"Rating bonus ({_i(match_rating)}/10)", rating_pts)

    if is_mvp:
        row("MVP bonus", 40)

    if result == "win":
        row("Win bonus", 15)
    elif result == "draw":
        row("Draw bonus", 5)

    total = sum(r["value"] for r in rows)
    return {"rows": rows, "total": max(0, total)}


def _i(v: float):
    """Render 3.0 as 3 so labels read like the JS template literals."""
    return int(v) if float(v).is_integer() else v


# ── SSR ───────────────────────────────────────────────────────────────────────
def calculate_ssr_delta(sport: str, stats: Stats, match_rating: float, result: str) -> float:
    """Port of performanceService.calculateSSRDelta. Sport is unused, as in the original."""
    delta = (match_rating / 10) * 0.5
    if result == "win":
        delta += 0.2
    # Nullish chain: goals ?? points ?? runs ?? 0
    goals = 0.0
    for key in ("goals", "points", "runs"):
        if key in stats and stats[key] is not None:
            goals = _num(stats, key)
            break
    if goals >= 3:
        delta += 0.1
    return js_round(delta * 10) / 10


# ── Chemistry ─────────────────────────────────────────────────────────────────
def calculate_chemistry_delta(is_mvp: bool, result: str, match_rating: float) -> int:
    """Port of performanceService.calculateChemistryDelta."""
    base = (match_rating / 10) * 2
    if result == "win":
        base += 2
    if is_mvp:
        base += 3
    return js_round(base)


# ── Tier ──────────────────────────────────────────────────────────────────────
# pulseStore.addScoreDelta and PulseRing.getTier both use 800/900. squadAI.ts
# uses 700/850 instead, but that is a mock squad generator rather than a Pulse
# code path, so the two agreeing definitions win.
TIER_ELITE = 800
TIER_PULSE_ELITE = 900


def tier_for(total_pulse: float) -> str:
    if total_pulse >= TIER_PULSE_ELITE:
        return "pulse_elite"
    if total_pulse >= TIER_ELITE:
        return "elite"
    return "contender"


def clamp_pulse(value: float) -> float:
    return max(MIN_PULSE, min(MAX_PULSE, value))


# ── Levels ────────────────────────────────────────────────────────────────────
MAX_LEVEL = 150
PULSE_PER_LEVEL = 100


def level_title(level: int) -> str:
    """Port of gamificationStore.getLevelTitle."""
    if level <= 10:  return "Rookie"
    if level <= 20:  return "Challenger"
    if level <= 30:  return "Contender"
    if level <= 40:  return "Striker"
    if level <= 50:  return "Elite"
    if level <= 60:  return "Dominator"
    if level <= 70:  return "Champion"
    if level <= 80:  return "Titan"
    if level <= 90:  return "Apex"
    if level <= 100: return "Legend"
    if level <= 110: return "Grandmaster X"
    if level <= 120: return "HyperNova"
    if level <= 130: return "Phantom Overdrive"
    if level <= 140: return "Immortal Zenith"
    return "Supreme GOAT"


def level_for_pulse(pulse: float) -> int:
    """Port of gamificationStore.getLevelInfo: min(150, floor(pulse/100) + 1)."""
    return min(MAX_LEVEL, math.floor(pulse / PULSE_PER_LEVEL) + 1)


def level_progress(pulse: float) -> dict:
    """
    Port of gamificationStore.getLevelProgress.

    Every level spans exactly 100 Pulse, so `required` is always 100 and
    `percentage` equals the points earned inside the current level.
    """
    level = level_for_pulse(pulse)
    min_pulse = (level - 1) * PULSE_PER_LEVEL
    max_pulse = level * PULSE_PER_LEVEL
    rng = max_pulse - min_pulse
    current = pulse - min_pulse
    return {
        "level": level,
        "title": level_title(level),
        "min_pulse": float(min_pulse),
        "max_pulse": float(max_pulse),
        "current": float(current),
        "required": float(rng),
        "remaining": float(rng - current),
        "progress_percent": min(100, js_round((current / rng) * 100)),
    }


# ── Stat validation consensus ─────────────────────────────────────────────────
def validate_stat_votes(votes: list[str]) -> dict:
    """
    Port of validationService.validateTeammateStats.

    score = (confirms * 1.0 + partials * 0.5) / total
      >= 0.8  -> accepted, weight 1.0
      >= 0.5  -> weighted, weight 0.7
      else    -> flagged,  weight 0.3

    With no votes yet the submission is treated as accepted at full weight,
    matching the original.
    """
    if not votes:
        return {"status": "validated", "weight": 1.0, "score": 1.0,
                "confirms": 0, "partials": 0, "disputes": 0, "total": 0}

    confirms = sum(1 for v in votes if v == "confirm")
    partials = sum(1 for v in votes if v == "partial")
    disputes = sum(1 for v in votes if v == "dispute")
    total = len(votes)
    score = (confirms * 1.0 + partials * 0.5) / total

    if score >= 0.8:
        status, weight = "validated", 1.0
    elif score >= 0.5:
        status, weight = "partial", 0.7
    else:
        status, weight = "disputed", 0.3

    return {"status": status, "weight": weight, "score": score,
            "confirms": confirms, "partials": partials,
            "disputes": disputes, "total": total}
