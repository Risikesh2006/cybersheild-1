"""
Progress routes — dashboard stats, session history, narrative, and comparison.
"""
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session as DBSession

from database import get_db
from models.user import UserProfile
from models.session import Session, TopicSelection
from models.scenario import Scenario, Response, Evaluation
from models.progress import ProgressSnapshot
from routes.auth import get_current_user_id

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("/dashboard")
def get_dashboard(
    user_id: int = Depends(get_current_user_id),
    db: DBSession = Depends(get_db),
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile_dict = json.loads(profile.profile_json or "{}")
    skill_scores = profile_dict.get("skill_scores", {})

    # Build topic mastery list
    topic_mastery = []
    for topic, data in skill_scores.items():
        topic_mastery.append({
            "topic": topic,
            "score": round(data.get("score", 0.0) * 100, 1),
            "attempts": data.get("attempts", 0),
            "trend": data.get("trend", "untested"),
            "last_verdict": data.get("last_verdict"),
            "completion_percentage": min(100.0, data.get("attempts", 0) * 20.0),
        })

    return {
        "xp": profile.xp,
        "level": profile.level,
        "total_sessions": profile.total_sessions,
        "total_scenarios": profile.total_scenarios,
        "overall_accuracy": round(profile.overall_accuracy * 100, 1),
        "current_streak": profile.current_streak,
        "topic_mastery_list": topic_mastery,
        "weak_areas": profile_dict.get("weak_areas", []),
        "strong_areas": profile_dict.get("strong_areas", []),
        "decision_patterns": profile_dict.get("decision_patterns", []),
    }


@router.get("/history")
def get_history(
    user_id: int = Depends(get_current_user_id),
    db: DBSession = Depends(get_db),
):
    sessions = (
        db.query(Session)
        .filter(Session.user_id == user_id)
        .order_by(Session.started_at.desc())
        .all()
    )

    result = []
    for sess in sessions:
        # Get all responses for this session
        resp_list = (
            db.query(Response)
            .join(Scenario, Scenario.id == Response.scenario_id)
            .filter(Scenario.session_id == sess.id)
            .all()
        )
        session_score = sum(r.score_delta for r in resp_list)

        # Verdict counts
        verdict_counts = {"Optimal": 0, "Suboptimal": 0, "Risky": 0, "Critical": 0}
        for r in resp_list:
            ev = db.query(Evaluation).filter(Evaluation.response_id == r.id).first()
            if ev and ev.verdict in verdict_counts:
                verdict_counts[ev.verdict] += 1

        # Topics covered
        topics_covered = list({
            db.query(Scenario).filter(Scenario.id == r.scenario_id).first().topic_id
            for r in resp_list
        })

        # Accuracy
        positive = sum(1 for v, c in verdict_counts.items() if v in ("Optimal", "Suboptimal") for _ in range(c))
        total = len(resp_list)
        accuracy = round(positive / total * 100, 1) if total > 0 else 0.0

        # Duration
        duration = None
        if sess.ended_at and sess.started_at:
            duration = int((sess.ended_at - sess.started_at).total_seconds() // 60)

        result.append({
            "session_id": sess.id,
            "started_at": sess.started_at.isoformat(),
            "ended_at": sess.ended_at.isoformat() if sess.ended_at else None,
            "status": sess.status,
            "topics_covered": topics_covered,
            "session_score": session_score,
            "accuracy": accuracy,
            "verdict_counts": verdict_counts,
            "duration_minutes": duration,
        })

    return result


@router.get("/narrative")
def get_narrative(
    session_id: int = Query(...),
    user_id: int = Depends(get_current_user_id),
    db: DBSession = Depends(get_db),
):
    snapshot = (
        db.query(ProgressSnapshot)
        .filter(
            ProgressSnapshot.user_id == user_id,
            ProgressSnapshot.session_id == session_id,
        )
        .first()
    )
    if not snapshot:
        raise HTTPException(status_code=404, detail="No narrative found for this session")

    comparison = json.loads(snapshot.comparison_json or "{}")
    return {
        "session_id": session_id,
        "headline": comparison.get("headline", ""),
        "narrative": snapshot.narrative_text,
        "improved_topics": json.loads(snapshot.improved_topics or "[]"),
        "regressed_topics": json.loads(snapshot.regressed_topics or "[]"),
        "stable_topics": comparison.get("stable_topics", []),
        "pattern_observed": comparison.get("pattern_observed", ""),
        "next_session_recommendation": comparison.get("next_session_recommendation", ""),
        "xp_before": snapshot.xp_before,
        "xp_after": snapshot.xp_after,
        "session_score": snapshot.session_score,
        "taken_at": snapshot.taken_at.isoformat(),
    }


@router.get("/comparison")
def get_comparison(
    user_id: int = Depends(get_current_user_id),
    db: DBSession = Depends(get_db),
):
    snapshots = (
        db.query(ProgressSnapshot)
        .filter(ProgressSnapshot.user_id == user_id)
        .order_by(ProgressSnapshot.taken_at.desc())
        .limit(2)
        .all()
    )

    if not snapshots:
        return {"current_session_score": 0, "previous_session_score": None, "delta": None,
                "improved_topics": [], "regressed_topics": []}

    current = snapshots[0]
    previous = snapshots[1] if len(snapshots) > 1 else None

    delta = None
    if previous:
        delta = current.session_score - previous.session_score

    return {
        "current_session_score": current.session_score,
        "previous_session_score": previous.session_score if previous else None,
        "delta": delta,
        "improved_topics": json.loads(current.improved_topics or "[]"),
        "regressed_topics": json.loads(current.regressed_topics or "[]"),
    }
