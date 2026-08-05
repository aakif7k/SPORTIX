"""
The server-side AI proxy.

Gemini was called from the browser with `VITE_GEMINI_API_KEY`, which ships the key
to every visitor: anyone could read it out of the bundle and spend the quota. Two
pages depended on that — AITeamBuilder and SquadFormation — and neither could be
wired without cementing the leak, so both were left alone until this existed.

Three things this proxy is responsible for beyond forwarding a prompt.

**The key stays here.** It is read from GEMINI_API_KEY in the gitignored backend
env, never a VITE_ name. If it is absent the endpoints report that AI is
unconfigured rather than failing obscurely, so the app degrades to "insights
unavailable" instead of erroring.

**Candidates come from the database, not the model.** A language model asked to
"build a squad" will happily invent athletes. The candidate list is selected here by
the same Pulse-based query AutoSquad uses, and the model is only asked to assign
roles and explain its reasoning over athletes that exist. Anything it returns that
is not in the candidate list is dropped.

**Rate limiting is per user.** The AI tier is the strictest one (3/hour), because
this is the only endpoint family that costs money per call.
"""
from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "{model}:generateContent"
)
DEFAULT_MODEL = "gemini-2.0-flash"
TIMEOUT_SECONDS = 30.0


class AIUnavailable(RuntimeError):
    """No API key configured. Distinct from a call that failed."""


def is_configured() -> bool:
    return bool((settings.gemini_api_key or "").strip())


async def _generate(prompt: str, *, json_output: bool = False,
                    model: str | None = None) -> str:
    """
    One Gemini call. Returns the model's text.

    Errors are deliberately not swallowed: a caller that needs a fallback can
    catch, but a silent empty string would let a page render an "insight" that the
    model never produced.
    """
    if not is_configured():
        raise AIUnavailable("The AI service is not configured on this server")

    body: dict[str, Any] = {"contents": [{"parts": [{"text": prompt}]}]}
    if json_output:
        # Ask for JSON rather than parsing prose out of a paragraph.
        body["generationConfig"] = {"response_mime_type": "application/json"}

    url = GEMINI_URL.format(model=model or DEFAULT_MODEL)
    async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as http:
        res = await http.post(
            url,
            params={"key": settings.gemini_api_key},
            json=body,
            headers={"Content-Type": "application/json"},
        )

    if res.status_code >= 400:
        # The key must never reach a log or an error envelope.
        logger.warning("Gemini returned %s: %s", res.status_code, res.text[:300])
        raise RuntimeError(f"The AI service returned {res.status_code}")

    payload = res.json()
    try:
        return payload["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        # A blocked or empty completion is a real outcome, not a crash.
        logger.warning("Gemini returned no usable candidate: %s", str(payload)[:300])
        raise RuntimeError("The AI service returned no answer")


def _parse_json(text: str) -> Any:
    """Gemini sometimes fences JSON in a markdown block even when asked not to."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[-1]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise RuntimeError("The AI service returned malformed JSON") from exc


# ─── Health ───────────────────────────────────────────────────────────────────
async def check() -> dict:
    """
    Whether the AI service is reachable. Backs the diagnostic in Settings, which
    used to call Gemini from the browser with the exposed key.
    """
    if not is_configured():
        return {"ok": False, "configured": False,
                "message": "No AI key is configured on the server."}
    try:
        await _generate("Reply with the single word: ok")
    except Exception as exc:
        return {"ok": False, "configured": True, "message": str(exc)}
    return {"ok": True, "configured": True, "model": DEFAULT_MODEL,
            "message": "The AI service is reachable."}


# ─── Squad building ───────────────────────────────────────────────────────────
async def suggest_squad(candidates: list[dict], sport: str, skill_level: str,
                        size: int) -> dict:
    """
    Assign roles to real athletes and explain the choice.

    `candidates` are rows already selected from the database. The model is given
    only their ids, positions, levels and Pulse, and anything it names that is not
    among them is discarded — a model asked to build a team will otherwise invent
    plausible athletes.
    """
    if not candidates:
        return {"selected": [], "reasoning": "No athletes match that sport and level yet.",
                "ai_used": False}

    roster = [
        {
            "id": c["$id"],
            "position": c.get("position") or "unspecified",
            "level": int(c.get("level") or 1),
            "pulse": round(float(c.get("pulse_score") or 0)),
        }
        for c in candidates
    ]

    prompt = (
        f"You are assembling a {sport} squad of {size} from the athletes below.\n"
        f"Skill band: {skill_level}.\n\n"
        f"Athletes (JSON): {json.dumps(roster)}\n\n"
        "Choose exactly the best {size} by balancing positions and Pulse. Reply with "
        "JSON only, shaped: "
        '{"selected": [{"id": "...", "assigned_role": "...", "why": "one short sentence"}], '
        '"reasoning": "two sentences about the balance of the squad"}. '
        "Use only ids from the list. Do not invent athletes."
    ).replace("{size}", str(size))

    allowed = {c["$id"] for c in candidates}
    try:
        parsed = _parse_json(await _generate(prompt, json_output=True))
    except AIUnavailable:
        raise
    except Exception:
        logger.warning("squad suggestion failed; falling back to Pulse order",
                       exc_info=True)
        # A failed AI call must not fail the feature: the Pulse-ordered list is a
        # perfectly good squad, just without the commentary.
        return {
            "selected": [{"id": c["$id"], "assigned_role": c.get("position") or "member",
                          "why": ""} for c in candidates[:size]],
            "reasoning": "Selected by Pulse score; the AI commentary was unavailable.",
            "ai_used": False,
        }

    selected = [
        {
            "id": str(item.get("id", "")),
            "assigned_role": str(item.get("assigned_role", "member")),
            "why": str(item.get("why", "")),
        }
        for item in (parsed.get("selected") or [])
        if str(item.get("id", "")) in allowed
    ][:size]

    return {
        "selected": selected,
        "reasoning": str(parsed.get("reasoning", "")),
        "ai_used": True,
        # Visible when the model named athletes that do not exist, rather than
        # those silently becoming part of the squad.
        "discarded": max(0, len(parsed.get("selected") or []) - len(selected)),
    }


# ─── Performance insight ──────────────────────────────────────────────────────
async def performance_insight(career: dict, history: list[dict]) -> dict:
    """
    Observations about an athlete's own record, for the PerformanceTracker tab that
    previously displayed three hardcoded "insights" asserting specifics about
    everybody's play.
    """
    if not history:
        return {"insights": [], "ai_used": False,
                "message": "There are no validated matches to analyse yet."}

    facts = {
        "matches": career.get("total_matches"),
        "wins": career.get("wins"),
        "losses": career.get("losses"),
        "draws": career.get("draws"),
        "win_rate": career.get("win_rate"),
        "total_pulse": career.get("total_pulse_earned"),
        "ssr": career.get("current_ssr"),
        "mvp_count": career.get("mvp_count"),
        "recent": [
            {
                "sport": h.get("sport"),
                "result": h.get("match_result"),
                "rating": h.get("match_rating"),
                "pulse": h.get("pulse_earned"),
                "stats": h.get("stat_summary"),
            }
            for h in history[:10]
        ],
    }

    prompt = (
        "You are a performance analyst. Using ONLY the figures below, write two or "
        "three short observations about this athlete's record. Never invent a "
        "statistic, a comparison to other players, or a trend the data does not "
        "show. If the sample is too small to support a claim, say so.\n\n"
        f"Data (JSON): {json.dumps(facts)}\n\n"
        'Reply with JSON only: {"insights": [{"title": "...", "detail": "..."}]}'
    )

    try:
        parsed = _parse_json(await _generate(prompt, json_output=True))
    except AIUnavailable:
        raise
    except Exception as exc:
        logger.warning("performance insight failed", exc_info=True)
        return {"insights": [], "ai_used": False, "message": str(exc)}

    insights = [
        {"title": str(i.get("title", "")), "detail": str(i.get("detail", ""))}
        for i in (parsed.get("insights") or [])
        if i.get("title") or i.get("detail")
    ][:4]
    return {"insights": insights, "ai_used": True}
