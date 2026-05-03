from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class TopicMastery(BaseModel):
    topic: str
    score: float
    attempts: int
    trend: str
    last_verdict: Optional[str] = None
    completion_percentage: float = 0.0


class ProgressDashboardOut(BaseModel):
    xp: float
    level: str
    total_sessions: int
    total_scenarios: int
    overall_accuracy: float
    current_streak: int
    topic_mastery_list: List[TopicMastery]


class SessionHistoryItem(BaseModel):
    session_id: int
    started_at: datetime
    ended_at: Optional[datetime] = None
    status: str
    topics_covered: List[str]
    session_score: float
    accuracy: float
    verdict_counts: Dict[str, int]


class NarrativeOut(BaseModel):
    session_id: int
    headline: str
    narrative: str
    improved_topics: List[str]
    regressed_topics: List[str]
    stable_topics: List[str]
    pattern_observed: str
    next_session_recommendation: str
    xp_before: float
    xp_after: float
    session_score: float
    taken_at: datetime


class ComparisonOut(BaseModel):
    current_session_score: float
    previous_session_score: Optional[float] = None
    delta: Optional[float] = None
    improved_topics: List[str]
    regressed_topics: List[str]
