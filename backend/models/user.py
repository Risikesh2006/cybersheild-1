from datetime import datetime
from sqlalchemy import Integer, String, Boolean, DateTime, Float, Text, ForeignKey
from sqlalchemy.orm import mapped_column, relationship, Mapped
from database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    user_type: Mapped[str] = mapped_column(String, nullable=False)  # student/professional/enterprise
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    onboarding_done: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_active: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    profile: Mapped["UserProfile"] = relationship("UserProfile", back_populates="user", uselist=False)
    sessions: Mapped[list["Session"]] = relationship("Session", back_populates="user")
    responses: Mapped[list["Response"]] = relationship("Response", back_populates="user")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), unique=True)
    xp: Mapped[float] = mapped_column(Float, default=0.0)
    level: Mapped[str] = mapped_column(String, default="Beginner")
    total_sessions: Mapped[int] = mapped_column(Integer, default=0)
    total_scenarios: Mapped[int] = mapped_column(Integer, default=0)
    overall_accuracy: Mapped[float] = mapped_column(Float, default=0.0)
    current_streak: Mapped[int] = mapped_column(Integer, default=0)
    # JSON string of the full agent-maintained skill map
    profile_json: Mapped[str] = mapped_column(Text, default="{}")

    user: Mapped["User"] = relationship("User", back_populates="profile")
