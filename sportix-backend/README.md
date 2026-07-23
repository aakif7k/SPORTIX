# SPORTiX FastAPI Backend

A fully-featured, production-ready FastAPI backend for the SPORTiX sports social platform.
Powered by **Appwrite** for authentication, database, and file storage.

---

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.11+
- An Appwrite project at `https://sgp.cloud.appwrite.io`

### 2. Setup

```bash
cd sportix-backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
```

### 3. Configure Environment

Copy `.env.example` → `.env` and fill in your values:

```bash
copy .env.example .env
```

Required variables:
| Variable | Description |
|---|---|
| `APPWRITE_PROJECT_ID` | Your Appwrite project ID |
| `APPWRITE_API_KEY` | API key with **all scopes** enabled |
| `APPWRITE_DATABASE_ID` | Database ID (create one in Appwrite Console) |
| `APPWRITE_STORAGE_BUCKET_ID` | Storage bucket ID for media uploads |

### 4. Seed the Database (first time only)

```bash
python -m app.utils.seed
```

This creates badge definitions and daily mission templates in Appwrite.

### 5. Run the Server

```bash
uvicorn main:app --reload --port 8000
```

API docs: **http://localhost:8000/docs**

---

## 📦 Architecture

```
sportix-backend/
├── main.py              ← FastAPI app, CORS, routers, rate limiting
├── app/
│   ├── core/            ← config, appwrite client, JWT auth, exceptions
│   ├── routers/         ← 19 routers (one per feature area)
│   ├── services/        ← business logic + Appwrite calls
│   ├── schemas/         ← Pydantic request/response models
│   ├── models/          ← Appwrite collection field references
│   └── utils/           ← pagination, validators, formatters, seed
```

## 🔐 Authentication

The backend uses **Appwrite JWT validation** for all protected endpoints.

**Flow:**
1. Frontend calls `account.createEmailPasswordSession()` → gets a session
2. Frontend calls `account.createJWT()` → gets a short-lived JWT
3. Frontend sends JWT as `Authorization: Bearer <token>` on every API request
4. Backend validates the JWT against Appwrite on every request

## 📡 API Endpoints

| Prefix | Description |
|---|---|
| `POST /api/auth/register` | Create new account |
| `POST /api/auth/login` | Email/password login |
| `GET  /api/auth/me` | Get current user |
| `GET  /api/users/search` | Search users |
| `GET  /api/posts/feed` | Home feed |
| `POST /api/posts/` | Create post |
| `GET  /api/stories/` | Active stories |
| `GET  /api/events/` | Browse events |
| `POST /api/events/{id}/join` | Join event |
| `GET  /api/squads/me` | My squads |
| `POST /api/autosquad/generate` | AI squad suggestion |
| `GET  /api/pulse/me` | My SPORTiX score |
| `GET  /api/missions/today` | Today's missions |
| `GET  /api/coins/balance` | Coin balance |
| `GET  /api/leaderboard/global` | Global leaderboard |
| `GET  /api/search/` | Global search |
| `POST /api/upload/avatar` | Upload profile picture |

Full interactive docs: `http://localhost:8000/docs`

## 🧪 Tests

```bash
pytest tests/ -v
```

## 📋 Required Appwrite Collections

Create these collections in your Appwrite database (`sportix_db`):

- `profiles` — user profiles
- `posts`, `comments`, `post_likes`
- `stories`, `story_views`
- `reels`, `reel_likes`
- `events`, `event_participants`
- `squads`, `squad_members`
- `matches`, `player_stats`, `stat_validations`, `retention_votes`
- `pulse_scores`, `pulse_history`
- `user_levels`, `level_history`
- `user_coins`, `coin_transactions`
- `daily_missions`, `user_missions`, `user_streaks`
- `badges`, `user_badges`
- `notifications`
- `followers`
- `generated_squads`, `autosquad_requests`
- `leaderboard`

## 🗂 Storage Bucket

Create one bucket: `sportix-media` (or match `APPWRITE_STORAGE_BUCKET_ID`).
Set permissions to allow authenticated uploads.
