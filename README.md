# SPORTiX

AI-powered sports networking and squad ecosystem — a React SPA backed by a FastAPI service on top of
Appwrite Cloud.

## Architecture

```
React SPA (Vite)  ──HTTP──▶  FastAPI  ──server SDK──▶  Appwrite Cloud
      │                                                     ▲
      └──────── Appwrite browser SDK ───────────────────────┘
                (auth session + read-only realtime only)
```

The browser SDK is used for exactly two things: the auth session (`account.*`) and read-only realtime
subscriptions. **Every data read and write goes through FastAPI**, which owns all denormalization,
counters, and Pulse/SSR/chemistry/coin/level math. Appwrite collection permissions grant no
create/update/delete to any client role — the server API key bypasses permissions.

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite 8, TypeScript 6, Tailwind 3.4, react-router-dom 7, zustand 5, framer-motion 12, TanStack Query 5, recharts, three.js (landing page) |
| Backend | FastAPI, Python 3.11+, Appwrite server SDK, pydantic 2, slowapi |
| BaaS | Appwrite Cloud |
| Deploy | Vercel for the SPA (`vercel.json` holds the SPA rewrite) |

## Prerequisites

- **Node.js 20+** and npm
- **Python 3.11+**
- An **Appwrite Cloud** project, and an API key with full scopes

## Setup

### 1. Environment files

Both `.env` files are gitignored and must be created from their templates:

```bash
cp .env.example .env                              # frontend
cp sportix-backend/.env.example sportix-backend/.env   # backend
```

Fill in real values. Two rules that matter:

- Every `VITE_`-prefixed variable is **inlined into the client bundle** and is therefore public.
  Never put a server secret in the root `.env`.
- `APPWRITE_API_KEY` and `GEMINI_API_KEY` are server-only and belong solely in
  `sportix-backend/.env`.

### 2. Install dependencies

```bash
npm install

cd sportix-backend
python -m venv .venv
# Windows:  .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

## Running

The app needs both processes up. Use two terminals.

```bash
# terminal 1 — API on http://localhost:8000  (docs at /docs)
cd sportix-backend
uvicorn main:app --reload --port 8000

# terminal 2 — SPA on http://localhost:5173
npm run dev
```

`VITE_API_URL` in the root `.env` must point at the API (`http://localhost:8000` for local dev).

## Tests and checks

```bash
npm run build     # tsc -b && vite build — the primary correctness gate, see below
npm run lint      # eslint

cd sportix-backend
pytest -q                                  # test suite
pytest --cov=app --cov-report=term-missing # with coverage
```

### `npm run build` is a strict gate — keep it that way

`tsconfig.app.json` enables `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, and
`erasableSyntaxOnly`. The build therefore **fails on unused imports and variables** and on
non-type-only imports of types (use `import type { Foo }`). This is deliberate: it is the main
mechanism that catches dead code and bad imports before they ship. Do not relax these flags.

## Conventions

- **Field casing is snake_case everywhere** — Appwrite attribute keys, FastAPI request/response
  bodies, and frontend TypeScript interfaces. The only exceptions are Appwrite's own system fields
  (`$id`, `$createdAt`, `$updatedAt`, `$permissions`, `$collectionId`, `$databaseId`), which pass
  through untouched.
- **A `profiles` document ID is the Appwrite auth user `$id`.** Always fetch a profile by document
  ID; there is no `auth_uid` attribute.
- **Import with the `@/` alias** (`@/components/...`), configured in both `vite.config.ts` and
  `tsconfig.app.json`.
- **Never hardcode a hex color in a component.** The design system lives in `src/index.css` as CSS
  custom properties, surfaced as Tailwind tokens (`volt`, `accent`, `base`, `surface`, `elevated`,
  `text-primary`, `border-muted`, …) in `tailwind.config.js`. Use those tokens or `var(--…)`.
- **Every list surface needs three states**: skeleton loading, empty, and error-with-retry.
- Respect `prefers-reduced-motion` in any new animation.

## Layout

```
src/
├── components/   ui/ layout/ social/ pulse/ performance/ gamification/ profile/
├── pages/        landing, auth, feed, profile, discover, messages, events,
│                 clashhub, pulse, social, settings, notifications
├── hooks/        data-fetching hooks
├── store/        zustand stores
├── services/     domain logic + API-facing services
├── lib/          api.ts (FastAPI client), appwrite.ts (browser SDK), authService.ts
├── context/      AuthContext
└── types/        shared TypeScript types

sportix-backend/
├── main.py       app factory, CORS, rate limiting, router mounting
├── app/
│   ├── core/     appwrite client singletons, config, dependencies, exceptions
│   ├── routers/  19 routers mounted under /api/*
│   ├── services/ business logic
│   ├── schemas/  pydantic request/response models
│   └── utils/    formatters, pagination, seed
├── scripts/      Appwrite provisioning / schema verification / smoke tests
└── tests/
```

## ESLint

To move to type-aware lint rules, swap `tseslint.configs.recommended` for
`tseslint.configs.recommendedTypeChecked` (or `strictTypeChecked`) in `eslint.config.js` and add
`parserOptions.project: ['./tsconfig.node.json', './tsconfig.app.json']`.
