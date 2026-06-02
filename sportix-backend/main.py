import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.routers import (
    auth,
    users,
    posts,
    events,
    squads,
    matches,
    pulse,
    level,
    missions,
    coins,
    badges,
    messages,
    uploads,
    tournaments
)
from app.websockets import chat, notifications

# Initialize FastAPI App with metadata
app = FastAPI(
    title="SPORTiX Backend API",
    description="Premium AI-powered sports networking and squad ecosystem progression backend",
    version="1.0.0"
)

# Configure CORS Middleware
origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory structure exists on startup
for category in ["avatars", "posts", "events"]:
    dir_path = os.path.join(settings.UPLOAD_DIR, category)
    os.makedirs(dir_path, exist_ok=True)

# Mount Static Files serving for uploads folder
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Register REST Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(posts.router)
app.include_router(events.router)
app.include_router(squads.router)
app.include_router(matches.router)
app.include_router(pulse.router)
app.include_router(level.router)
app.include_router(missions.router)
app.include_router(coins.router)
app.include_router(badges.router)
app.include_router(messages.router)
app.include_router(uploads.router)
app.include_router(tournaments.router)

# Register WebSocket Routers
app.include_router(chat.router)
app.include_router(notifications.router)

@app.get("/")
async def root():
    return {
        "status": "healthy",
        "service": "SPORTiX Premium Core API",
        "version": "1.0.0"
    }
