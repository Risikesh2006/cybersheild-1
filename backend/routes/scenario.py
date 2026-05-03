"""
Scenario routes — submit a response to a scenario.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from pydantic import BaseModel

from database import get_db
from models.session import Session
from models.scenario import Scenario
from routes.auth import get_current_user_id
from agents.orchestrator import OrchestratorAgent

router = APIRouter(prefix="/scenario", tags=["scenario"])
orchestrator = OrchestratorAgent()


class SubmitBody(BaseModel):
    session_id: int
    scenario_id: int
    chosen_key: str
    time_taken_sec: int


@router.post("/submit")
def submit_response(
    body: SubmitBody,
    user_id: int = Depends(get_current_user_id),
    db: DBSession = Depends(get_db),
):
    """Submit a scenario response. Returns evaluation and next scenario (or narrative if last)."""
    # Validate session ownership
    session_obj = db.query(Session).filter(
        Session.id == body.session_id,
        Session.user_id == user_id,
    ).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found")
    if session_obj.status not in ("active",):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot submit to a {session_obj.status} session",
        )

    # Validate scenario ownership
    scenario_obj = db.query(Scenario).filter(
        Scenario.id == body.scenario_id,
        Scenario.session_id == body.session_id,
    ).first()
    if not scenario_obj:
        raise HTTPException(status_code=404, detail="Scenario not found in this session")

    # Validate chosen_key
    import json
    scenario_data = json.loads(scenario_obj.scenario_json)
    valid_keys = [opt["key"] for opt in scenario_data.get("options", [])]
    if body.chosen_key not in valid_keys:
        raise HTTPException(status_code=400, detail=f"Invalid option key: {body.chosen_key}")

    result = orchestrator.handle_submission(
        db=db,
        session_id=body.session_id,
        scenario_id=body.scenario_id,
        chosen_key=body.chosen_key,
        time_taken_sec=body.time_taken_sec,
    )
    return result
