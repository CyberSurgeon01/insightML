"""
backend/main.py

Application entry point for the InsightML FastAPI backend.

Run with:
    uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import datasets, export, readiness

# ── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="InsightML API",
    description="Backend API for dataset upload and analysis.",
    version="0.2.0",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
# Allow the Next.js dev server to call the API.
# In production, replace the wildcard with your real domain.

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(datasets.router)
app.include_router(export.router)
app.include_router(readiness.router)


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health", tags=["meta"])
def health() -> dict[str, str]:
    """Simple liveness probe."""
    return {"status": "ok", "service": "InsightML API"}

