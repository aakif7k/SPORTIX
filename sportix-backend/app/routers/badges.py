from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
import uuid

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.badge import Badge, UserBadge
from app.schemas.badge import BadgeResponse, UserBadgeResponse

router = APIRouter(prefix="/api/badges", tags=["badges"])

@router.get("", response_model=List[BadgeResponse])
async def get_all_badges(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Badge).order_by(Badge.badge_type, Badge.tier))
    return list(result.scalars().all())

@router.get("/me", response_model=List[UserBadgeResponse])
async def get_my_badges(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(UserBadge)
        .options(selectinload(UserBadge.badge))
        .where(UserBadge.user_id == current_user.id)
        .order_by(UserBadge.unlocked_at.desc())
    )
    return list(result.scalars().all())

@router.put("/me/featured")
async def update_featured_badges(
    badge_ids: List[uuid.UUID],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Reset all featured badges for user
    await db.execute(
        select(UserBadge)
        .where(UserBadge.user_id == current_user.id)
    )
    # Actually update featured = False for all user's badges
    result = await db.execute(
        select(UserBadge).where(UserBadge.user_id == current_user.id)
    )
    user_badges = result.scalars().all()
    for ub in user_badges:
        ub.is_featured = ub.badge_id in badge_ids
        
    await db.flush()
    return {"success": True, "message": "Featured badges updated successfully"}
