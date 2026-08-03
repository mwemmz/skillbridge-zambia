# SkillBridge Zambia

> **Verified skills. Trusted services. Anywhere.**

A semester entrepreneurship MVP: a location-based skilled labour marketplace that
connects customers with **verified** skilled workers (electricians, plumbers,
welders, mechanics, carpenters, solar installers) — inspired by Yango/Uber-style
location matching, applied to TEVET skills.

This is a **proof-of-concept** built to demonstrate a business idea, not a
production system.

---

## Quick start

Prerequisites: **Python 3.11+**, **Node.js 18+**.

```bat
setup.cmd              REM one-time: venv + backend + frontend dependencies
start.cmd              REM ONE command = builds the app AND serves it all on http://localhost:8000
```

Open **http://localhost:8000** and log in with a demo account.

> **Single service:** `start.cmd` builds the React app (`frontend/dist`) and the
> FastAPI server serves both the API **and** the app from one window on port 8000.
> For development (auto-reload of both sides), use the two-window option instead:
> `start-backend.cmd` (API on :8000) + `start-frontend.cmd` (app on :5173).

### Demo accounts

| Role | Email | Password |
| ---- | ----- | -------- |
| Customer | `customer@skillbridge.com` | `demo123` |
| Worker | `worker1@skillbridge.com` | `demo123` |
| Admin | `admin@skillbridge.com` | `admin123` |

The database seeds automatically on first launch with 7 workers around Lusaka
(Moses Banda, Peter Mwansa, Chanda Phiri, Grace Tembo, Joseph Zulu, Natasha
Mwale, Brian Sakala) plus 6 skill categories.

---

## Tech stack

- **Frontend:** React + Vite, Tailwind CSS, React Router, Axios, Leaflet + OpenStreetMap
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL (ORM: SQLAlchemy) — *see note below*
- **Auth:** JWT (bcrypt password hashing)
- **Validation:** Pydantic schemas
- **Real-time:** FastAPI WebSockets

> **Database note:** PostgreSQL isn't required for the demo. The app defaults to a
> local SQLite file (`backend/skillbridge.db`) so it runs anywhere with zero setup.
> To use PostgreSQL, create a `.env` file in `backend/`:
> `DATABASE_URL=postgresql://user:pass@localhost:5432/skillbridge`
> To use Turso, point `DATABASE_URL` at your `sqlite+libsql://` URL and set
> `TURSO_AUTH_TOKEN` to the Turso auth token.

---

## Deploy to Render (free public link)

1. Rebuild the frontend so the hosted app is up to date:
   `cd frontend` → `npm run build` → commit & push (must include `frontend/dist`).
2. Create a free account at **https://render.com** (sign in with GitHub).
3. Dashboard → **New** → **Blueprint** → connect the `mwemmz/skillbridge-zambia`
   repository. Render reads `render.yaml` and creates the web service.
4. In the service → **Environment**, add two vars (values from your Turso dashboard):
   - `DATABASE_URL` → `sqlite+libsql://<db-name>-<org>.turso.io?...`
   - `TURSO_AUTH_TOKEN` → your Turso auth token
5. Redeploy if needed, then open the service URL (`https://skillbridge-zambia.onrender.com`).

Getting a free Turso database (no card): sign up at **https://turso.tech** →
create a database, then run `turso db tokens create <db>` to generate an auth
token, and `turso db show <db>` to see the URL.

Free-tier caveats: the service sleeps after 15 min idle (first visit takes ~30–60 s
to wake up). The Turso free database stays around (no 30-day expiry).

---

## How the demo works (10-step pitch scenario)

1. Customer logs in → opens the **map**.
2. Nearby **verified workers** appear as map markers (name, skill, rating, badges).
3. Customer filters by skill (e.g. **Electrician**) → nearest first.
4. Customer taps a worker → **verified profile** (identity ✓, certificate ✓, compliance ✓).
5. Customer sends a **service request** with a description.
6. Worker (open in a second browser window) **accepts** the request.
7. Worker presses **Start trip** → status becomes **ON_THE_WAY**.
8. Worker presses **Simulate travel** → marker moves toward the customer.
9. Customer's dashboard shows the worker **moving live** on the map via WebSocket.
10. Worker completes the job → status **COMPLETED**.

---

## Features

**Customer**
- Map of nearby workers with markers (name, skill, rating, verification)
- Search/filter by 6 skill categories
- Worker profile page with distance, experience, verification badges
- Request service with a problem description
- Live request tracking + worker movement on the map (WebSocket)

**Worker**
- Online / offline availability toggle
- Incoming requests (accept / decline)
- Job status flow: `REQUESTED → ACCEPTED → ON_THE_WAY → COMPLETED`
- Simulated live movement broadcast to the customer's map

**Admin**
- Stats overview (customers, workers, requests, online, pending verification)
- Approve/reject verification badges (identity, certificate, compliance)
- Manage skill categories
- View all service requests

**Location**
- Worker lat/lng stored and shown on Leaflet/OSM map
- Haversine distance, nearest workers first
- Simplified Yango-style tracking (simulated for the demo)

---

## API endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/api/auth/register` | Register (role: customer/worker/admin) |
| POST | `/api/auth/login` | Login → JWT |
| GET | `/api/auth/me` | Current user |
| GET | `/api/workers` | List workers |
| GET | `/api/workers/nearby?lat=&lng=&skill=` | Nearby, nearest first |
| GET | `/api/workers/me` / `PUT /api/workers/me` | Worker profile / update |
| GET | `/api/workers/{id}` | Worker detail + verification |
| GET | `/api/workers/skills` | Skill categories |
| POST | `/api/requests` | Customer creates a request |
| GET | `/api/requests/my` | Customer's requests |
| GET | `/api/requests/for-me` | Worker's inbox |
| GET | `/api/requests/{id}` | Request detail |
| PUT | `/api/requests/{id}/status` | Update status |
| GET | `/api/admin/stats` | Admin stats |
| GET | `/api/admin/workers` | All workers |
| PUT | `/api/admin/workers/{id}/verification` | Toggle verification badges |
| GET | `/api/admin/requests` | All requests |
| GET/POST | `/api/admin/skills` | Skill management |
| WS | `/ws/location/{worker_id}?token=` | Live location broadcast |

Interactive API docs: **http://localhost:8000/docs**

---

## Project structure

```
skills bridge/
├── backend/
│   ├── run.py                  # uvicorn entry
│   ├── requirements.txt
│   └── app/
│       ├── main.py             # FastAPI app, CORS, startup seed
│       ├── config.py           # settings (DATABASE_URL, JWT)
│       ├── database.py         # SQLAlchemy engine/session
│       ├── models.py           # users, workers, skills, verifications, requests
│       ├── schemas.py          # Pydantic schemas
│       ├── security.py         # bcrypt + JWT
│       ├── deps.py             # auth dependencies
│       ├── serializers.py      # worker serialization + haversine
│       ├── seed.py             # demo data
│       └── routers/            # auth, workers, requests, admin, ws
└── frontend/
    └── src/
        ├── context/AuthContext.jsx
        ├── components/         # Navbar, MapView, WorkerCard, ui helpers
        └── pages/              # Landing, Login, Register, Customer/Worker/Admin dashboards, WorkerProfile
```

---

## Business pitch in one slide

- **Problem:** finding trusted, verified skilled labour in Zambia is unreliable and slow.
- **Solution:** on-demand, location-matched, **verified** workers with live tracking.
- **Tech feasibility:** demonstrated end-to-end (map, matching, verification, real-time).
- **Revenue potential:** commission per job / subscription for workers / premium listing.
- **Social impact:** formalises informal TEVET talent, generates income, builds trust.
