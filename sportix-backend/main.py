import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging_config import configure_logging, new_request_id, request_id_ctx
from app.routers import (
    auth, users, posts, stories, reels,
    events, squads, matches, pulse,
    missions, coins, badges, notifications,
    leaderboard, autosquad, search,
    upload, settings as settings_router, admin,
)

configure_logging()
logger = logging.getLogger("sportix")

# ── Rate limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="SPORTiX API",
    description="AI-powered sports networking & squad ecosystem backend — powered by Appwrite",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Origins come from the ALLOWED_ORIGINS env var (comma-separated) so a new
# deployment target does not need a code change.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)


# ── Request correlation ───────────────────────────────────────────────────────
@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    """
    Stamp every request with an id, echo it on the response, and log one line
    per request. An inbound X-Request-ID is honoured so a trace can span the
    proxy and the SPA.
    """
    incoming = request.headers.get("X-Request-ID", "").strip()
    rid = incoming[:64] if incoming else new_request_id()
    token = request_id_ctx.set(rid)
    started = time.perf_counter()
    # Both log calls must happen before the ContextVar is reset, or the line
    # describing the request is emitted without the request's own id.
    try:
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - started) * 1000
        response.headers["X-Request-ID"] = rid
        logger.info(
            "%s %s -> %s in %.1fms",
            request.method, request.url.path, response.status_code, elapsed_ms,
        )
        return response
    except Exception:
        # The exception handlers build the body; this only records timing, since
        # call_next re-raises before a response exists.
        logger.exception(
            "%s %s failed after %.1fms",
            request.method, request.url.path, (time.perf_counter() - started) * 1000,
        )
        raise
    finally:
        request_id_ctx.reset(token)

# All uploads live in Appwrite Storage, so there is no local static mount.

# ── Exception handlers ────────────────────────────────────────────────────────
register_exception_handlers(app)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,             prefix="/api/auth",          tags=["Authentication"])
app.include_router(users.router,            prefix="/api/users",         tags=["Users"])
app.include_router(posts.router,            prefix="/api/posts",         tags=["Posts"])
app.include_router(stories.router,          prefix="/api/stories",       tags=["Stories"])
app.include_router(reels.router,            prefix="/api/reels",         tags=["Reels"])
app.include_router(events.router,           prefix="/api/events",        tags=["Events"])
app.include_router(squads.router,           prefix="/api/squads",        tags=["Squads"])
app.include_router(matches.router,          prefix="/api/matches",       tags=["Matches"])
app.include_router(pulse.router,            prefix="/api/pulse",         tags=["SPORTiX Pulse"])
app.include_router(missions.router,         prefix="/api/missions",      tags=["Daily Missions"])
app.include_router(coins.router,            prefix="/api/coins",         tags=["SPORTiX Coins"])
app.include_router(badges.router,           prefix="/api/badges",        tags=["Badges"])
app.include_router(notifications.router,    prefix="/api/notifications", tags=["Notifications"])
app.include_router(leaderboard.router,      prefix="/api/leaderboard",   tags=["Leaderboard"])
app.include_router(autosquad.router,        prefix="/api/autosquad",     tags=["AutoSquad AI"])
app.include_router(search.router,           prefix="/api/search",        tags=["Search"])
app.include_router(upload.router,           prefix="/api/upload",        tags=["File Upload"])
app.include_router(settings_router.router,  prefix="/api/settings",      tags=["Settings"])
app.include_router(admin.router,            prefix="/api/admin",         tags=["Admin"])


@app.get("/", tags=["Health"])
async def root():
    return {"name": "SPORTiX API", "version": "1.0.0", "status": "online", "docs": "/docs"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy", "environment": settings.environment}
