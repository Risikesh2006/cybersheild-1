import os
import secrets
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).with_name(".env"))

DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if DEMO_MODE:
    ANTHROPIC_API_KEY = ""
    GEMINI_API_KEY = ""

# Scenario generation (Gemini); override if a model is unavailable in your region
GEMINI_SCENARIO_MODEL = os.getenv("GEMINI_SCENARIO_MODEL", "gemini-2.0-flash")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
SECRET_KEY = os.getenv("SECRET_KEY", "")
if ENVIRONMENT == "production" and (len(SECRET_KEY) < 32 or SECRET_KEY.lower().startswith(("changeme", "replace", "your_"))):
    raise RuntimeError("Set a private random SECRET_KEY of at least 32 characters in production")
SECRET_KEY = SECRET_KEY or secrets.token_urlsafe(48)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cybershield.db")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_OAUTH_REDIRECT = os.getenv("GOOGLE_OAUTH_REDIRECT", "http://localhost:8000/auth/google/callback")

# AI Model
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-haiku-4-5-20251001")

# XP Level thresholds
LEVEL_THRESHOLDS = {
    "Beginner": (0, 79),
    "Intermediate": (80, 199),
    "Advanced": (200, float("inf")),
}

def get_level_from_xp(xp: float) -> str:
    if xp < 80:
        return "Beginner"
    elif xp < 200:
        return "Intermediate"
    else:
        return "Advanced"

# Scoring map for verdicts
VERDICT_SCORES = {
    "Optimal": 10,
    "Suboptimal": 5,
    "Risky": -5,
    "Critical": -10,
}

# Verdict values for profile score calculation
VERDICT_VALUES = {
    "Optimal": 1.0,
    "Suboptimal": 0.6,
    "Risky": 0.3,
    "Critical": 0.0,
}

CORS_ORIGINS = list(dict.fromkeys([
    "http://localhost:3000",
    "http://localhost:5173",
    "https://cybershield-azure-delta.vercel.app",
    FRONTEND_URL.rstrip("/"),
    *[v.strip().rstrip("/") for v in os.getenv("CORS_ORIGINS", "").split(",") if v.strip()],
]))
if ENVIRONMENT != "production":
    CORS_ORIGINS += [f"http://{host}:{port}" for host in ("localhost", "127.0.0.1") for port in (3000, 3001, 3002, 5173)]
