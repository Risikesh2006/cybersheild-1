from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    user_type: str  # student / professional / enterprise

    @field_validator("user_type")
    @classmethod
    def validate_user_type(cls, v: str) -> str:
        allowed = {"student", "professional", "enterprise"}
        if v not in allowed:
            raise ValueError(f"user_type must be one of {allowed}")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    user_type: str
    is_admin: bool
    onboarding_done: bool
    created_at: datetime
    last_active: Optional[datetime] = None

    model_config = {"from_attributes": True}


class UserProfileOut(BaseModel):
    id: int
    user_id: int
    xp: float
    level: str
    total_sessions: int
    total_scenarios: int
    overall_accuracy: float
    current_streak: int
    profile_json: str  # raw JSON string

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
    profile: Optional[UserProfileOut] = None
