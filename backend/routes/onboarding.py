"""
Onboarding routes — topic selection and syllabus retrieval.
"""
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from pydantic import BaseModel
from typing import List

from database import get_db
from models.user import User, UserProfile
from models.session import TopicSelection
from routes.auth import get_current_user_id
from agents.profiler_agent import ProfilerAgent
from agents.curriculum_planner_agent import CurriculumPlannerAgent

router = APIRouter(prefix="/onboarding", tags=["onboarding"])
profiler = ProfilerAgent()
planner = CurriculumPlannerAgent()

# All available topics with descriptions and prerequisite notes
AVAILABLE_TOPICS = [
    {
        "id": "Network Security",
        "name": "Network Security",
        "description": "Firewalls, IDS/IPS, traffic analysis, and network segmentation.",
        "prerequisite": None,
    },
    {
        "id": "Endpoint Security",
        "name": "Endpoint Security",
        "description": "EDR, host-based detection, patch management, and device hardening.",
        "prerequisite": None,
    },
    {
        "id": "Cloud Security",
        "name": "Cloud Security",
        "description": "Cloud misconfigurations, IAM in cloud, storage exposure, and cloud-native threats.",
        "prerequisite": "Network Security",
    },
    {
        "id": "Identity & Access Management",
        "name": "Identity & Access Management",
        "description": "Authentication, authorization, MFA, privilege escalation, and SSO.",
        "prerequisite": None,
    },
    {
        "id": "Incident Response",
        "name": "Incident Response",
        "description": "NIST/SANS IR lifecycle, triage, containment, eradication, and recovery.",
        "prerequisite": None,
    },
    {
        "id": "Threat Intelligence",
        "name": "Threat Intelligence",
        "description": "IoC analysis, threat actor TTPs, MITRE ATT&CK framework, and intel feeds.",
        "prerequisite": "Incident Response",
    },
    {
        "id": "Malware Analysis",
        "name": "Malware Analysis",
        "description": "Static and dynamic analysis, sandboxing, behavioral patterns, and reverse engineering basics.",
        "prerequisite": "Endpoint Security",
    },
    {
        "id": "Social Engineering",
        "name": "Social Engineering",
        "description": "Phishing detection, pretexting, vishing, and employee awareness programs.",
        "prerequisite": None,
    },
    {
        "id": "Secure Coding",
        "name": "Secure Coding",
        "description": "OWASP Top 10, code review, SAST/DAST, and secure SDLC practices.",
        "prerequisite": None,
    },
    {
        "id": "Compliance & GRC",
        "name": "Compliance & GRC",
        "description": "Regulatory frameworks, risk assessments, audit trails, and policy enforcement.",
        "prerequisite": "Incident Response",
    },
]


class TopicsRequest(BaseModel):
    topics: List[str]


@router.post("/topics")
def save_topics(
    body: TopicsRequest,
    user_id: int = Depends(get_current_user_id),
    db: DBSession = Depends(get_db),
):
    if not body.topics:
        raise HTTPException(status_code=400, detail="At least one topic must be selected")

    user = db.query(User).filter(User.id == user_id).first()
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()

    # Validate topic IDs
    valid_ids = {t["id"] for t in AVAILABLE_TOPICS}
    invalid = [t for t in body.topics if t not in valid_ids]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Unknown topics: {invalid}")

    # Replace existing topic selections
    db.query(TopicSelection).filter(TopicSelection.user_id == user_id).delete()
    for topic_id in body.topics:
        db.add(TopicSelection(
            user_id=user_id,
            topic_id=topic_id,
            selected_at=datetime.utcnow(),
        ))

    # Update profile with new topic selections
    profile_dict = json.loads(profile.profile_json or "{}")
    updated_profile = profiler.build_initial_profile(
        user_type=user.user_type,
        topic_selections=body.topics,
    )
    # Preserve existing skill scores for topics already attempted
    for topic, existing in profile_dict.get("skill_scores", {}).items():
        if topic in updated_profile["skill_scores"] and existing.get("attempts", 0) > 0:
            updated_profile["skill_scores"][topic] = existing

    profile.profile_json = json.dumps(updated_profile)

    # Mark onboarding done
    user.onboarding_done = True
    db.commit()

    # Generate initial plan summary
    initial_plan = planner.plan(
        user_type=user.user_type,
        topic_selections=body.topics,
        profile_json=updated_profile,
        completed_scenario_ids=[],
    )

    return {
        "topics_saved": body.topics,
        "initial_plan_summary": {
            "plan_id": initial_plan.get("plan_id"),
            "session_goal": initial_plan.get("session_goal"),
            "total_scenarios": initial_plan.get("total_scenarios"),
            "coverage_percentage": initial_plan.get("coverage_percentage"),
        },
    }


@router.get("/syllabus")
def get_syllabus(
    user_id: int = Depends(get_current_user_id),
    db: DBSession = Depends(get_db),
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    profile_dict = json.loads(profile.profile_json or "{}")
    skill_scores = profile_dict.get("skill_scores", {})

    selected_rows = db.query(TopicSelection).filter(TopicSelection.user_id == user_id).all()
    selected_ids = {r.topic_id for r in selected_rows}
    selected_map = {r.topic_id: r for r in selected_rows}

    result = []
    for topic in AVAILABLE_TOPICS:
        tid = topic["id"]
        score_data = skill_scores.get(tid, {})
        sel_row = selected_map.get(tid)
        result.append({
            **topic,
            "is_selected": tid in selected_ids,
            "completion_percentage": sel_row.completion_percentage if sel_row else 0.0,
            "mastery_level": sel_row.mastery_level if sel_row else "untested",
            "score": score_data.get("score", 0.0),
            "attempts": score_data.get("attempts", 0),
            "trend": score_data.get("trend", "untested"),
            "last_verdict": score_data.get("last_verdict"),
        })
    return result
