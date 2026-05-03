from datetime import datetime
from sqlalchemy import Integer, String, DateTime, Text, Float, ForeignKey
from sqlalchemy.orm import mapped_column, relationship, Mapped
from database import Base


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String, default="active")  # active/paused/completed/called_off
    topic_focus: Mapped[str] = mapped_column(String, nullable=True)
    difficulty_tier: Mapped[str] = mapped_column(String, nullable=True)
    session_plan_json: Mapped[str] = mapped_column(Text, default="{}")
    # Full session state serialized when paused — restored on resume
    pause_state_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    pause_reason: Mapped[str | None] = mapped_column(String, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="sessions")
    scenarios: Mapped[list["Scenario"]] = relationship("Scenario", back_populates="session")


class TopicSelection(Base):
    __tablename__ = "topic_selections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    topic_id: Mapped[str] = mapped_column(String, nullable=False)
    selected_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completion_percentage: Mapped[float] = mapped_column(Float, default=0.0)
    mastery_level: Mapped[str] = mapped_column(String, default="untested")
