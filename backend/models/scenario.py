from datetime import datetime
from sqlalchemy import Integer, String, DateTime, Text, Float, ForeignKey
from sqlalchemy.orm import mapped_column, relationship, Mapped
from database import Base


class Scenario(Base):
    __tablename__ = "scenarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(Integer, ForeignKey("sessions.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    scenario_json: Mapped[str] = mapped_column(Text, nullable=False)  # full generated scenario
    topic_id: Mapped[str] = mapped_column(String, nullable=False)
    difficulty_tier: Mapped[str] = mapped_column(String, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    session: Mapped["Session"] = relationship("Session", back_populates="scenarios")
    responses: Mapped[list["Response"]] = relationship("Response", back_populates="scenario")


class Response(Base):
    __tablename__ = "responses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    scenario_id: Mapped[int] = mapped_column(Integer, ForeignKey("scenarios.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    chosen_key: Mapped[str] = mapped_column(String, nullable=False)
    score_delta: Mapped[float] = mapped_column(Float, nullable=False)
    time_taken_sec: Mapped[int] = mapped_column(Integer, nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    scenario: Mapped["Scenario"] = relationship("Scenario", back_populates="responses")
    user: Mapped["User"] = relationship("User", back_populates="responses")
    evaluation: Mapped["Evaluation"] = relationship("Evaluation", back_populates="response", uselist=False)


class Evaluation(Base):
    __tablename__ = "evaluations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    response_id: Mapped[int] = mapped_column(Integer, ForeignKey("responses.id"), nullable=False)
    verdict: Mapped[str] = mapped_column(String, nullable=False)  # Optimal/Suboptimal/Risky/Critical
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    optimal_explanation: Mapped[str] = mapped_column(Text, nullable=True)
    tip: Mapped[str] = mapped_column(Text, nullable=True)
    skills_demonstrated: Mapped[str] = mapped_column(Text, default="[]")  # JSON string
    skills_missed: Mapped[str] = mapped_column(Text, default="[]")        # JSON string

    response: Mapped["Response"] = relationship("Response", back_populates="evaluation")
