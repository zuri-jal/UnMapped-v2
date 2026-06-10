# Unmapped — CLAUDE.md

AI-powered travel discovery, planning, and booking platform.

## Project structure

```
UnMapped v2/
├── backend/               # Python FastAPI
│   ├── main.py            # App entry point — CORS, router mounts
│   ├── requirements.txt
│   ├── .env.example       # All required env vars documented here
│   ├── routes/            # One file per endpoint group
│   │   ├── plan.py        # POST /plan
│   │   ├── update.py      # POST /update
│   │   ├── confirm.py     # POST /confirm
│   │   └── discover.py    # POST /discover
│   ├── services/          # External integrations — one file per provider
│   │   ├── openai_service.py
│   │   ├── amadeus_service.py
│   │   ├── discovery_service.py   # Reddit, YouTube, Google Trends
│   │   ├── nlp_service.py         # spaCy + VADER
│   │   ├── email_service.py       # SendGrid + PDF attachment
│   │   └── supabase_service.py
│   ├── utils/
│   │   ├── cache.py        # Supabase cache table helpers
│   │   ├── pdf_generator.py
│   │   └── helpers.py
│   └── models/
│       ├── request_models.py   # Pydantic v2 request schemas
│       └── response_models.py  # Pydantic v2 response schemas
└── frontend/              # React 18, Vite 5, Tailwind CSS 3
    ├── src/
    │   ├── pages/         # Landing, Plan, Profile
    │   ├── components/    # All UI components
    │   ├── services/
    │   │   ├── api.js     # All FastAPI calls (axios)
    │   │   └── supabase.js
    │   └── store/
    │       └── tripStore.js   # Zustand global state
    ├── tailwind.config.js
    └── vite.config.js
```

## Running the project

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
python -m spacy download en_core_web_sm
cp .env.example .env           # then fill in real keys
uvicorn main:app --reload      # runs on http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env           # then fill in Supabase keys
npm run dev                    # runs on http://localhost:5173
```

## Environment variables

All secrets live in `.env` files — never hardcoded.

| File | Purpose |
|---|---|
| `backend/.env` | OpenAI, Amadeus, Supabase service role key, SendGrid, Reddit, YouTube |
| `frontend/.env` | `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |

See `backend/.env.example` and `frontend/.env.example` for the full list.

## Architecture

### Data flow (happy path)
1. User types a message in `ChatPanel` → `InputForm` calls `api.js:planTrip()`
2. `POST /plan` → `nlp_service` extracts intent → `openai_service` generates itinerary → `amadeus_service` fetches flights + hotels → `supabase_service` persists draft → returns `PlanResponse`
3. Frontend stores the response in Zustand (`tripStore`) → `Dashboard` renders map + tabs
4. User selects a flight + hotel → clicks "Confirm & Book" → `ConfirmScreen` → `POST /confirm`
5. Backend books via Amadeus, generates PDF via `pdf_generator`, emails via `email_service`

### State management
All trip UI state lives in `src/store/tripStore.js` (Zustand). Key fields:
- `trip` — the current `PlanResponse` object (null before first plan)
- `messages` — chat history array `[{ role, content }]`
- `selectedFlightId` / `selectedHotelId` — the user's chosen offers
- `isLoading` / `isConfirming` — UI overlay flags

### API conventions
- All routes return Pydantic models defined in `models/response_models.py`
- All routes accept Pydantic models from `models/request_models.py`
- Services are async throughout — use `await` everywhere
- Discovery results are cached in a Supabase `cache` table via `utils/cache.py` — TTLs: YouTube 48 h, Reddit 12 h, Google Trends 24 h

## Brand

| Token | Value |
|---|---|
| Rose gold accent | `#B07050` |
| Warm white background | `#FDFAF8` |
| Warm gray (borders/cards) | `#F5F0EE` |
| Tailwind class | `text-rose-gold`, `bg-warm-white`, `border-warm-gray` |

Tailwind component classes defined in `src/index.css`: `btn-primary`, `btn-secondary`, `card`, `input-field`.

## Key dependencies

### Backend
| Package | Role |
|---|---|
| `fastapi` + `uvicorn` | API server |
| `supabase` | Database + auth (server-side) |
| `openai` | GPT itinerary generation |
| `httpx` | Async HTTP for Amadeus |
| `spacy` + `vaderSentiment` | NLP entity extraction + sentiment |
| `sendgrid` + `fpdf2` | Email + PDF generation |
| `praw` | Reddit API |
| `pytrends` | Google Trends (sync — wrap in `asyncio.to_thread`) |
| `supabase` | Database, auth, and discovery result caching |

### Frontend
| Package | Role |
|---|---|
| `react` + `react-dom` | UI framework |
| `vite` + `@vitejs/plugin-react` | Build tool |
| `tailwindcss` | Styling |
| `react-router-dom` | Client-side routing |
| `zustand` | Global state |
| `axios` | HTTP client |
| `@supabase/supabase-js` | Auth + realtime |
| `leaflet` + `react-leaflet` | Interactive map |

## Coding conventions

- **Async everywhere** in the backend — every route handler and service function uses `async def` / `await`
- **No hardcoded secrets** — always read from `os.getenv()`
- **Pydantic models** for all route inputs and outputs — no raw dicts crossing the API boundary
- **Single responsibility** — one service file per external provider, one component file per UI concern
- **`// TODO` comments** mark all unimplemented logic — implement by filling in the function body described in the docstring above each TODO

## Supabase schema (planned)

Tables to create in the Supabase dashboard:

```sql
-- Users are managed by Supabase Auth (auth.users)

create table trips (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id),
  destination    text not null,
  departure_date date,
  return_date    date,
  itinerary      jsonb,    -- DayModel[] blob
  flights        jsonb,    -- FlightOffer[] blob
  hotels         jsonb,    -- HotelOffer[] blob
  status         text default 'draft',   -- draft | confirmed | cancelled
  currency       text default 'USD',
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  deleted_at     timestamptz             -- soft delete
);

-- Discovery result cache (replaces Redis)
-- TTLs enforced in application code: YouTube 48 h, Reddit 12 h, Google Trends 24 h
create table cache (
  id          uuid primary key default gen_random_uuid(),
  destination text not null,
  source      text not null,            -- 'youtube' | 'reddit' | 'google_trends'
  results     jsonb not null,
  timestamp   timestamptz default now(),
  expires_at  timestamptz not null
);

create index on cache (destination, source);
create index on cache (expires_at);
```
