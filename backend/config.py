import os
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
# Scenario generation (Gemini); override if a model is unavailable in your region
GEMINI_SCENARIO_MODEL = os.getenv("GEMINI_SCENARIO_MODEL", "gemini-2.0-flash")
SECRET_KEY = os.getenv("SECRET_KEY", "changeme_secret_key_minimum_32_characters")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cybershield.db")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_OAUTH_REDIRECT = os.getenv("GOOGLE_OAUTH_REDIRECT", "http://localhost:8000/auth/google/callback")

# AI Model
CLAUDE_MODEL = "claude-3-5-haiku-20241022"

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
