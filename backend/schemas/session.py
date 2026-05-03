from datetime import datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel


class SessionOut(BaseModel):
    id: int
    user_id: int
    status: str
    topic_focus: Optional[str] = None
    difficulty_tier: Optional[str] = None
    session_plan_json: str
    pause_state_json: Optional[str] = None
    started_at: datetime
    ended_at: Optional[datetime] = None
    pause_reason: Optional[str] = None

    model_config = {"from_attributes": True}


class StartSessionResponse(BaseModel):
    session_id: int
    scenario: Dict[str, Any]
    plan_summary: Dict[str, Any]


class PauseRequest(BaseModel):
    session_id: int
    reason: Optional[str] = None


class PauseResponse(BaseModel):
    message: str
    session_id: int


class ResumeRequest(BaseModel):
    session_id: int


class ResumeResponse(BaseModel):
    session_id: int
    current_scenario: Dict[str, Any]
    session_score: float
    scenarios_completed: int
    scenarios_remaining: int


class CalloffResponse(BaseModel):
    message: str
    partial_score: float
    narrative: Optional[Dict[str, Any]] = None
