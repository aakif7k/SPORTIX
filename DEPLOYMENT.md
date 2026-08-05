# Deploying SPORTiX

Two deployable units: the FastAPI API and the static frontend bundle. Appwrite Cloud
holds the database, auth and file storage, so there is nothing else to run — no
Postgres, no Redis, no queue.

## What runs where

| Unit | Build | Serve |
|---|---|---|
| API | `docker build -t sportix-api ./sportix-backend` | any container host; listens on `$PORT` |
| Frontend | `npm ci && npx vite build` | any static host, from `dist/` |
| Data | — | Appwrite Cloud |

Nothing here is host-specific on purpose: the API takes its configuration from the
environment and binds `$PORT`, and the frontend is plain static output.

## Environment

### API — `sportix-backend/.env` (never committed; it is gitignored)

Copy `sportix-backend/.env.example` and fill it in. The ones that matter:

| Variable | Required | Notes |
|---|---|---|
| `APPWRITE_ENDPOINT` | yes | e.g. `https://sgp.cloud.appwrite.io/v1` |
| `APPWRITE_PROJECT_ID` | yes | |
| `APPWRITE_API_KEY` | yes | **Server key with full scopes. This is the credential that must never reach the browser.** |
| `APPWRITE_DATABASE_ID` | yes | |
| `SECRET_KEY` | yes | No default. The app refuses to start in production with a placeholder value. |
| `ENVIRONMENT` | yes | `production` enables that refusal. |
| `ALLOWED_ORIGINS` | yes | Comma-separated. Set this to the real frontend origin; the default is localhost only, so CORS will block a deployed frontend until you do. |
| `GEMINI_API_KEY` | no | Absent is valid: `/api/ai` reports `configured: false` and the AI features say they are not enabled rather than erroring. |
| `MAX_AUTOSQUAD_GENERATIONS` | no | Daily AutoSquad quota per user. Defaults to 3. |

### Frontend — `.env`

Copy `.env.example`. Every `VITE_`-prefixed variable is compiled into the bundle and
is therefore **public**; there is deliberately no AI key among them.

| Variable | Notes |
|---|---|
| `VITE_APPWRITE_ENDPOINT` | Browser SDK: auth session and realtime only. |
| `VITE_APPWRITE_PROJECT_ID` | Public by design. |
| `VITE_APPWRITE_DATABASE_ID` | Used only to build realtime channel names. |
| `VITE_API_URL` | The deployed API's origin. Every read and write goes here. |

## First deploy, in order

1. **Provision the database.** From `sportix-backend/`, with the API env set:

   ```
   python -m scripts.provision_appwrite   # idempotent; safe to re-run
   python -m scripts.verify_schema        # asserts live state matches schema.py
   ```

   `verify_schema` must print `SCHEMA OK`. It reads live metadata rather than
   trusting the provisioner's own output.

2. **Deploy the API.** Build the image, set the env, expose it. `GET /health` is
   unauthenticated and touches no external service, so it answers even when
   Appwrite is unreachable — which is what you want a liveness probe to measure.
   Use `GET /` for a readiness check that includes the version.

3. **Deploy the frontend** with `VITE_API_URL` pointing at the API, and set the
   API's `ALLOWED_ORIGINS` to the frontend's origin.

4. **Verify end to end.** From `sportix-backend/`:

   ```
   python -m scripts.smoke
   ```

   This creates four real accounts, drives the whole product against live
   Appwrite — registration through to tournaments — and deletes everything it made.
   It is the only check that proves the schema, the services and the wiring agree.

## Scaling notes

The rate limiter counts **in process**, so N workers or N replicas multiply every
limit by N. The Dockerfile therefore runs a single worker, and the app is IO-bound
against Appwrite so that is rarely the bottleneck. Before scaling horizontally,
move the limiter to shared storage (slowapi supports Redis) or the AI tier's
3-per-hour cap becomes 3-per-hour-per-replica.

Uploads stream to Appwrite Storage, so containers need no writable volume and no
shared filesystem.

## Verification status, honestly

- All static gates, the 620-test backend suite, the 31-test frontend suite, the
  production `vite build`, and the 205-assertion live smoke test — all green.
- **The container is built and verified.** `docker build` succeeds (229 MB), the
  container starts, `/health` answers 200 within two seconds, Docker's own
  healthcheck reports `healthy`, it runs as the non-root `sportix` user, and a real
  registration through the container against live Appwrite succeeds. The test
  account it created was purged afterwards.
- The CI workflow's steps are each verified by running the same commands locally
  with a clean environment. The workflow itself has not been executed by GitHub
  Actions — that happens on the first push.
