"""
Authentication routes — signup, login, Google OAuth, and me.
JWT is issued on signup, login, and Google OAuth.
"""
from datetime import datetime, timedelta
import json
import secrets
import urllib.parse
import urllib.request
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session as DBSession
import bcrypt

from database import get_db
from models.user import User, UserProfile
from schemas.auth import SignupRequest, LoginRequest, TokenResponse, UserOut, UserProfileOut
from agents.profiler_agent import ProfilerAgent
from config import (
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    FRONTEND_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_OAUTH_REDIRECT,
)
from jose import jwt, JWTError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter(prefix="/auth", tags=["auth"])

bearer_scheme = HTTPBearer()
profiler = ProfilerAgent()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(data: dict) -> str:
    payload = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload["exp"] = expire
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_google_state(next_path: str) -> str:
    payload = {
        "nonce": secrets.token_urlsafe(24),
        "next": next_path or "/onboarding",
        "exp": datetime.utcnow() + timedelta(minutes=10),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_google_state(state: str) -> dict:
    try:
        return jwt.decode(state, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid Google OAuth state")


def exchange_google_code(code: str) -> dict:
    data = urllib.parse.urlencode({
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_OAUTH_REDIRECT,
        "grant_type": "authorization_code",
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://oauth2.googleapis.com/token",
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_google_userinfo(access_token: str) -> dict:
    req = urllib.request.Request(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))


def build_google_display_name(info: dict) -> str:
    name = (info.get("name") or "").strip()
    if name:
      return name
    pieces = [info.get("given_name", "").strip(), info.get("family_name", "").strip()]
    return " ".join([p for p in pieces if p]).strip() or "Google User"


def ensure_profile_for_user(user: User, db: DBSession) -> UserProfile:
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    if profile:
        return profile

    initial_profile_data = profiler.build_initial_profile(
        user_type=user.user_type,
        topic_selections=[],
    )
    profile = UserProfile(
        user_id=user.id,
        xp=0.0,
        level="Beginner",
        profile_json=json.dumps(initial_profile_data),
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: DBSession = Depends(get_db),
) -> int:
    """Dependency: extract and validate JWT, return user_id."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return int(user_id)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@router.post("/signup", response_model=TokenResponse, status_code=201)
def signup(body: SignupRequest, db: DBSession = Depends(get_db)):
    # Check email uniqueness
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=body.name,
        email=body.email,
        hashed_password=hash_password(body.password),
        user_type=body.user_type,
        created_at=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Build initial empty profile
    initial_profile_data = profiler.build_initial_profile(
        user_type=body.user_type,
        topic_selections=[],
    )
    import json
    profile = UserProfile(
        user_id=user.id,
        xp=0.0,
        level="Beginner",
        profile_json=json.dumps(initial_profile_data),
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user=UserOut.model_validate(user),
        profile=UserProfileOut.model_validate(profile),
    )


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: DBSession = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user.last_active = datetime.utcnow()
    db.commit()

    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user=UserOut.model_validate(user),
        profile=UserProfileOut.model_validate(profile) if profile else None,
    )


@router.get("/google/start")
def google_start(next: str = "/onboarding"):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth is not configured")

    state = create_google_state(next)
    params = urllib.parse.urlencode({
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_OAUTH_REDIRECT,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "select_account",
    })
    return RedirectResponse(url=f"https://accounts.google.com/o/oauth2/v2/auth?{params}", status_code=302)


@router.get("/google/callback")
def google_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: DBSession = Depends(get_db),
):
    if error:
        raise HTTPException(status_code=400, detail=f"Google OAuth error: {error}")
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing Google OAuth code or state")
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Google OAuth is not configured")

    state_payload = verify_google_state(state)
    token_data = exchange_google_code(code)
    userinfo = fetch_google_userinfo(token_data.get("access_token", ""))

    email = (userinfo.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Google account did not return an email address")

    display_name = build_google_display_name(userinfo)
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        user = existing
        if not user.name:
            user.name = display_name
        if not user.user_type:
            user.user_type = "student"
    else:
        user = User(
            name=display_name,
            email=email,
            hashed_password=hash_password(secrets.token_urlsafe(24)),
            user_type="student",
            created_at=datetime.utcnow(),
            onboarding_done=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    ensure_profile_for_user(user, db)
    user.last_active = datetime.utcnow()
    db.commit()

    jwt_token = create_access_token({"sub": str(user.id)})
    next_path = state_payload.get("next") or "/onboarding"
    redirect_url = f"{FRONTEND_URL}/auth?token={urllib.parse.quote(jwt_token)}&next={urllib.parse.quote(next_path)}"
    return RedirectResponse(url=redirect_url, status_code=302)


@router.get("/me", response_model=TokenResponse)
def get_me(
    user_id: int = Depends(get_current_user_id),
    db: DBSession = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    # Return a dummy token (me endpoint doesn't re-issue token)
    return TokenResponse(
        access_token="",
        user=UserOut.model_validate(user),
        profile=UserProfileOut.model_validate(profile) if profile else None,
    )
