from datetime import datetime
from sqlalchemy import Integer, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import mapped_column, relationship, Mapped
from database import Base


class ProgressSnapshot(Base):
    __tablename__ = "progress_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    session_id: Mapped[int] = mapped_column(Integer, ForeignKey("sessions.id"), nullable=False)
    xp_before: Mapped[float] = mapped_column(Float, default=0.0)
    xp_after: Mapped[float] = mapped_column(Float, default=0.0)
    session_score: Mapped[float] = mapped_column(Float, default=0.0)
    topics_covered: Mapped[str] = mapped_column(Text, default="[]")      # JSON list
    improved_topics: Mapped[str] = mapped_column(Text, default="[]")     # JSON list
    regressed_topics: Mapped[str] = mapped_column(Text, default="[]")    # JSON list
    narrative_text: Mapped[str] = mapped_column(Text, nullable=True)
    comparison_json: Mapped[str] = mapped_column(Text, default="{}")     # JSON object
    taken_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
