from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.level import LevelHistory
from app.schemas.level import UserLevelResponse, LevelHistoryResponse
from app.services.level_service import get_or_create_user_level

router = APIRouter(prefix="/api/level", tags=["level"])

@router.get("/me", response_model=UserLevelResponse)
async def get_my_level(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await get_or_create_user_level(db, current_user.id)

@router.get("/history", response_model=List[LevelHistoryResponse])
async def get_my_level_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(LevelHistory)
        .where(LevelHistory.user_id == current_user.id)
        .order_by(LevelHistory.created_at.desc())
    )
    return list(result.scalars().all())
