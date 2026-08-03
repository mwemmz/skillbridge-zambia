from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import Base, SessionLocal, engine
from .routers import admin, auth, requests, workers, ws
from .seed import seed_demo_data

FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SkillBridge Zambia API",
    description="Verified skills. Trusted services. Anywhere.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(workers.router, prefix="/api")
app.include_router(requests.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(ws.router)


@app.on_event("startup")
def on_startup():
    with SessionLocal() as db:
        seed_demo_data(db)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "SkillBridge Zambia API"}


# Single-service setup: serve the built React app from the same FastAPI server.
# Build it with `npm run build` in frontend/ (or run start.cmd, which does this).
# NOTE: this catch-all must stay the LAST route so /api and /docs keep priority.
if FRONTEND_DIST.is_dir():
    app.mount(
        "/assets",
        StaticFiles(directory=FRONTEND_DIST / "assets"),
        name="assets",
    )

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        root = FRONTEND_DIST.resolve()
        candidate = (root / full_path).resolve()
        if (
            full_path
            and candidate.is_file()
            and candidate.is_relative_to(root)
        ):
            return FileResponse(candidate)
        return FileResponse(root / "index.html")
