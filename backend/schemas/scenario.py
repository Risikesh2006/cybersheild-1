from typing import Optional, Any, Dict, List
from pydantic import BaseModel


class ScenarioOut(BaseModel):
    id: int
    session_id: int
    user_id: int
    scenario_json: str
    topic_id: str
    difficulty_tier: str

    model_config = {"from_attributes": True}


class SubmitRequest(BaseModel):
    session_id: int
    scenario_id: int
    chosen_key: str
    time_taken_sec: int


class EvaluationOut(BaseModel):
    verdict: str
    score: int
    chosen_key: str
    optimal_key: str
    explanation: str
    optimal_explanation: str
    tip: str
    skills_demonstrated: List[str]
    skills_missed: List[str]


class SubmitResponse(BaseModel):
    evaluation: EvaluationOut
    next_scenario: Optional[Dict[str, Any]] = None
    session_score: float
    is_last: bool
    narrative: Optional[Dict[str, Any]] = None  # only present on last scenario
