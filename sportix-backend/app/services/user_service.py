import uuid
from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.user import User, Follower
from app.models.badge import UserBadge
from app.services.mission_service import update_mission_progress

async def get_user_by_username(db: AsyncSession, username: str) -> User:
    result = await db.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()

async def get_user_profile_data(db: AsyncSession, user_id: uuid.UUID) -> dict:
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    # Get level, coins, pulse score
    await db.refresh(user, ["level", "coins", "streak", "pulse_score"])
    
    # Get featured badges
    badges_result = await db.execute(
        select(UserBadge)
        .where(UserBadge.user_id == user_id, UserBadge.is_featured == True)
    )
    featured_badges = badges_result.scalars().all()
    
    # Get follower counts
    followers_count_res = await db.execute(
        select(Follower).where(Follower.following_id == user_id)
    )
    followers_count = len(followers_count_res.scalars().all())
    
    following_count_res = await db.execute(
        select(Follower).where(Follower.follower_id == user_id)
    )
    following_count = len(following_count_res.scalars().all())
    
    return {
        "user": user,
        "followers_count": followers_count,
        "following_count": following_count,
        "featured_badges": featured_badges
    }

async def update_profile(db: AsyncSession, user_id: uuid.UUID, user_update) -> User:
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    update_data = user_update.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(user, key, val)
        
    user.updated_at = datetime.utcnow()
    await db.flush()
    return user

async def follow_user(db: AsyncSession, follower_id: uuid.UUID, following_id: uuid.UUID) -> dict:
    if follower_id == following_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot follow yourself")
        
    # Check if target user exists
    target = await db.get(User, following_id)
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User to follow not found")
        
    # Check if already following
    result = await db.execute(
        select(Follower).where(
            Follower.follower_id == follower_id,
            Follower.following_id == following_id
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        return {"success": True, "message": "Already following"}
        
    follower_rel = Follower(
        id=uuid.uuid4(),
        follower_id=follower_id,
        following_id=following_id,
        created_at=datetime.utcnow()
    )
    db.add(follower_rel)
    await db.flush()
    
    # Update Daily Mission Progress
    await update_mission_progress(db, follower_id, "follow_athlete")
    
    return {"success": True, "message": "Successfully followed athlete"}

async def unfollow_user(db: AsyncSession, follower_id: uuid.UUID, following_id: uuid.UUID) -> dict:
    result = await db.execute(
        select(Follower).where(
            Follower.follower_id == follower_id,
            Follower.following_id == following_id
        )
    )
    follower_rel = result.scalar_one_or_none()
    if not follower_rel:
        return {"success": True, "message": "Not following"}
        
    await db.delete(follower_rel)
    await db.flush()
    
    return {"success": True, "message": "Successfully unfollowed athlete"}
