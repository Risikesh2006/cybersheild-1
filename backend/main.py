"""
CyberShield FastAPI application entry point.
Run with: python run_server.py  (installs requirements, then Uvicorn)
Or:       python -m uvicorn main:app --reload
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routes import auth, onboarding, session, scenario, progress, enterprise
from routes import users


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the database on startup."""
    init_db()
    yield


app = FastAPI(
    title="CyberShield API",
    description="Agentic AI Cybersecurity Training Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5176",
        "http://localhost:5177",
        "http://127.0.0.1:5177",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(auth.router)
app.include_router(onboarding.router)
app.include_router(session.router)
app.include_router(scenario.router)
app.include_router(progress.router)
app.include_router(enterprise.router)
app.include_router(users.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "CyberShield API"}
