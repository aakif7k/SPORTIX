from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.pulse import PulseHistory
from app.schemas.pulse import PulseScoreResponse, PulseHistoryResponse
from app.services.pulse_service import get_or_create_pulse_score

router = APIRouter(prefix="/api/pulse", tags=["pulse"])

@router.get("/me", response_model=PulseScoreResponse)
async def get_my_pulse_score(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await get_or_create_pulse_score(db, current_user.id)

@router.get("/history", response_model=List[PulseHistoryResponse])
async def get_my_pulse_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PulseHistory)
        .where(PulseHistory.user_id == current_user.id)
        .order_by(PulseHistory.created_at.desc())
    )
    return list(result.scalars().all())
