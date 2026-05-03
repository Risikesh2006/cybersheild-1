"""
Enterprise admin routes — team management and topic assignment.
Only accessible by users with user_type=enterprise AND is_admin=True.
"""
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession
from pydantic import BaseModel
from typing import List
from datetime import datetime

from database import get_db
from models.user import User, UserProfile
from models.session import TopicSelection
from routes.auth import get_current_user_id

router = APIRouter(prefix="/enterprise", tags=["enterprise"])


def require_enterprise_admin(
    user_id: int = Depends(get_current_user_id),
    db: DBSession = Depends(get_db),
) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.user_type != "enterprise" or not user.is_admin:
        raise HTTPException(status_code=403, detail="Enterprise admin access required")
    return user


class AssignBody(BaseModel):
    user_ids: List[int]
    topics: List[str]


@router.get("/team")
def get_team(
    admin: User = Depends(require_enterprise_admin),
    db: DBSession = Depends(get_db),
):
    """Return all enterprise team members with their profiles."""
    members = db.query(User).filter(
        User.user_type == "enterprise",
        User.id != admin.id,
    ).all()

    result = []
    for member in members:
        profile = db.query(UserProfile).filter(UserProfile.user_id == member.id).first()
        topic_rows = db.query(TopicSelection).filter(TopicSelection.user_id == member.id).all()
        profile_dict = json.loads(profile.profile_json or "{}") if profile else {}

        result.append({
            "id": member.id,
            "name": member.name,
            "email": member.email,
            "level": profile.level if profile else "Beginner",
            "xp": profile.xp if profile else 0,
            "topics_assigned": [t.topic_id for t in topic_rows],
            "last_active": member.last_active.isoformat() if member.last_active else None,
            "total_scenarios": profile.total_scenarios if profile else 0,
            "total_sessions": profile.total_sessions if profile else 0,
            "overall_accuracy": profile.overall_accuracy if profile else 0,
            "weak_areas": profile_dict.get("weak_areas", []),
            "strong_areas": profile_dict.get("strong_areas", []),
            "readiness_level": profile_dict.get("readiness_level", "Beginner"),
            "skill_scores": profile_dict.get("skill_scores", {}),
        })

    return result


@router.post("/assign")
def assign_topics(
    body: AssignBody,
    admin: User = Depends(require_enterprise_admin),
    db: DBSession = Depends(get_db),
):
    """Assign topic selections to multiple team members."""
    if not body.user_ids or not body.topics:
        raise HTTPException(status_code=400, detail="user_ids and topics are required")

    updated = []
    for uid in body.user_ids:
        user = db.query(User).filter(User.id == uid).first()
        if not user or user.user_type != "enterprise":
            continue

        # Merge topics — don't remove existing ones, add new ones
        existing = {t.topic_id for t in db.query(TopicSelection).filter(TopicSelection.user_id == uid).all()}
        for topic_id in body.topics:
            if topic_id not in existing:
                db.add(TopicSelection(
                    user_id=uid,
                    topic_id=topic_id,
                    selected_at=datetime.utcnow(),
                ))

        # Update profile to include new topics
        profile = db.query(UserProfile).filter(UserProfile.user_id == uid).first()
        if profile:
            profile_dict = json.loads(profile.profile_json or "{}")
            all_topics = list(existing | set(body.topics))
            profile_dict["topics_selected"] = all_topics
            skill_scores = profile_dict.get("skill_scores", {})
            for topic in body.topics:
                if topic not in skill_scores:
                    skill_scores[topic] = {
                        "score": 0.0, "attempts": 0, "last_verdict": None, "trend": "untested"
                    }
            profile_dict["skill_scores"] = skill_scores
            profile.profile_json = json.dumps(profile_dict)
            if not user.onboarding_done:
                user.onboarding_done = True

        updated.append(uid)

    db.commit()
    return {"message": f"Topics assigned to {len(updated)} members", "updated_user_ids": updated}
