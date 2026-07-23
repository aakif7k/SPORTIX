import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.routers import (
    auth, users, posts, stories, reels,
    events, squads, matches, pulse,
    missions, coins, badges, notifications,
    leaderboard, autosquad, search,
    upload, settings as settings_router, admin,
)

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
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static uploads ────────────────────────────────────────────────────────────
for folder in ["avatars", "posts", "stories", "reels", "proofs"]:
    os.makedirs(os.path.join(settings.upload_dir, folder), exist_ok=True)

app.mount("/static", StaticFiles(directory=settings.upload_dir), name="static")

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
