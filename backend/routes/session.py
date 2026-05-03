"""
Session routes — start, pause, resume, calloff, and active session check.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from pydantic import BaseModel
from typing import Optional

from database import get_db
from models.session import Session
from routes.auth import get_current_user_id
from agents.orchestrator import OrchestratorAgent

router = APIRouter(prefix="/session", tags=["session"])
orchestrator = OrchestratorAgent()


class PauseBody(BaseModel):
    session_id: int
    reason: Optional[str] = None


class ResumeBody(BaseModel):
    session_id: int


class CalloffBody(BaseModel):
    session_id: int


@router.post("/start")
def start_session(
    user_id: int = Depends(get_current_user_id),
    db: DBSession = Depends(get_db),
):
    """Start a new training session. Orchestrator builds the plan and first scenario."""
    # Check for existing active session
    active = db.query(Session).filter(
        Session.user_id == user_id,
        Session.status.in_(["active", "paused"]),
    ).first()
    if active:
        raise HTTPException(
            status_code=400,
            detail=f"You already have an {active.status} session (id={active.id}). Resume or end it first.",
        )

    result = orchestrator.begin_session(db=db, user_id=user_id)
    return result


@router.post("/pause")
def pause_session(
    body: PauseBody,
    user_id: int = Depends(get_current_user_id),
    db: DBSession = Depends(get_db),
):
    session_obj = db.query(Session).filter(
        Session.id == body.session_id,
        Session.user_id == user_id,
    ).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found")
    if session_obj.status != "active":
        raise HTTPException(status_code=400, detail="Only active sessions can be paused")

    return orchestrator.pause_session(db=db, session_id=body.session_id, reason=body.reason)


@router.post("/resume")
def resume_session(
    body: ResumeBody,
    user_id: int = Depends(get_current_user_id),
    db: DBSession = Depends(get_db),
):
    session_obj = db.query(Session).filter(
        Session.id == body.session_id,
        Session.user_id == user_id,
    ).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found")
    if session_obj.status != "paused":
        raise HTTPException(status_code=400, detail="Session is not paused")

    return orchestrator.resume_session(db=db, session_id=body.session_id)


@router.post("/calloff")
def calloff_session(
    body: CalloffBody,
    user_id: int = Depends(get_current_user_id),
    db: DBSession = Depends(get_db),
):
    session_obj = db.query(Session).filter(
        Session.id == body.session_id,
        Session.user_id == user_id,
    ).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found")
    if session_obj.status not in ("active", "paused"):
        raise HTTPException(status_code=400, detail="Session is already ended")

    return orchestrator.calloff_session(db=db, session_id=body.session_id)


@router.get("/active")
def get_active_session(
    user_id: int = Depends(get_current_user_id),
    db: DBSession = Depends(get_db),
):
    """Return active/paused session with enough state to continue or end without /start."""
    detail = orchestrator.get_active_session_detail(db=db, user_id=user_id)
    if not detail:
        return {"session": None}
    return {"session": detail}
