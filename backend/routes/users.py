"""
User-related routes: public user listing / leaderboard etc.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DBSession

from database import get_db
from models.user import User, UserProfile
from routes.auth import get_current_user_id

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/leaderboard")
def get_leaderboard(
    user_id: int = Depends(get_current_user_id),
    db: DBSession = Depends(get_db),
):
    # Return all users ordered by XP desc
    rows = (
        db.query(User, UserProfile)
        .join(UserProfile, UserProfile.user_id == User.id)
        .order_by(UserProfile.xp.desc())
        .all()
    )

    result = []
    for pos, (user, profile) in enumerate(rows, start=1):
        # derive initials
        parts = (user.name or "").split()
        initials = "".join([p[0].upper() for p in parts[:2]]) if parts else "?"
        result.append({
            "rank": pos,
            "id": user.id,
            "name": user.name,
            "role": user.user_type,
            "xp": profile.xp,
            "initials": initials,
        })

    return result
