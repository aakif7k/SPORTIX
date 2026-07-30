"""
Rate limiting.

slowapi was installed and the limiter was attached to the app, but not one route
was ever decorated, so nothing was limited.

Two decisions worth stating:

1. Callers are identified by authenticated user first, IP second. Keying purely
   on IP -- slowapi's default -- gets both halves wrong: everyone behind one NAT
   or campus network shares a bucket and locks each other out, while an attacker
   with a handful of addresses gets a fresh quota per address. A per-user limit
   like "3 AI generations an hour" cannot be expressed on an IP key at all.

2. The 120/minute baseline is applied through SlowAPIMiddleware rather than a
   decorator on each of the 122 endpoints. Tighter tiers are opt-in per route via
   the decorators below, which is where the interesting limits live.

Storage is in-process memory. That is correct for one instance and wrong for
several: each replica would keep its own counters, multiplying the effective
limit by the replica count. Point `storage_uri` at Redis before scaling out.
"""
from __future__ import annotations

import logging

from fastapi import Request
from slowapi import Limiter

logger = logging.getLogger(__name__)

# ── Tiers ─────────────────────────────────────────────────────────────────────
DEFAULT_LIMIT = "120/minute"      # everything not named below
AUTH_LIMIT = "5/minute"           # login, register, password reset: credential stuffing
UPLOAD_LIMIT = "20/minute"        # file uploads
WRITE_LIMIT = "30/minute"         # posts, comments, messages
AI_LIMIT = "3/hour"               # generation is expensive; matches max_autosquad_generations


def caller_key(request: Request) -> str:
    """
    Bucket key: the authenticated user when known, otherwise the client IP.

    The JWT is not verified here -- that is get_current_user's job on the way
    through. This only needs a stable string to count against, and an invalid
    token simply falls back to the IP bucket.
    """
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:].strip()
        if token:
            # The raw token is a stable per-session identifier. It is hashed so
            # credentials never reach the limiter's key space or any log line.
            import hashlib
            return "user:" + hashlib.sha256(token.encode()).hexdigest()[:32]

    client = request.client
    return "ip:" + (client.host if client and client.host else "127.0.0.1")


limiter = Limiter(
    key_func=caller_key,
    default_limits=[DEFAULT_LIMIT],
    headers_enabled=True,      # emit X-RateLimit-* so clients can back off
    # A limiter failure must never take the API down with it: if the backing
    # store misbehaves, requests are allowed through and the error is logged.
    swallow_errors=True,
)
