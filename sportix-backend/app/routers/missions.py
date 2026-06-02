from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from typing import List

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.mission import UserMissionResponse, ClaimResponse
from app.services.mission_service import get_or_generate_daily_missions, claim_mission_reward, get_weekly_mission_progress, claim_weekly_bonus

router = APIRouter(prefix="/api/missions", tags=["missions"])

@router.get("/daily", response_model=List[UserMissionResponse])
async def get_daily_missions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await get_or_generate_daily_missions(db, current_user.id)

@router.post("/daily/{user_mission_id}/claim", response_model=ClaimResponse)
async def claim_mission(
    user_mission_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await claim_mission_reward(db, current_user.id, user_mission_id)

@router.get("/weekly")
async def get_weekly_progress(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await get_weekly_mission_progress(db, current_user.id)

@router.post("/weekly/claim", response_model=ClaimResponse)
async def claim_weekly(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await claim_weekly_bonus(db, current_user.id)
