from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from typing import Optional

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.squad import SquadCreate, SquadResponse
from app.services.squad_service import create_squad_profile, join_squad_group, leave_squad_group, update_tactics, assign_member_role
from app.services.ai_squad_service import match_ai_squad

router = APIRouter(prefix="/api/squads", tags=["squads"])

@router.post("", response_model=SquadResponse, status_code=status.HTTP_201_CREATED)
async def create_squad(
    squad_in: SquadCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await create_squad_profile(db, current_user.id, squad_in)

@router.post("/matchmake")
async def auto_squad_matchmake(
    sport: str = Query(..., description="Sport tag for matchmaking"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await match_ai_squad(db, current_user.id, sport)

@router.post("/{squad_id}/join")
async def join_squad(
    squad_id: uuid.UUID,
    position: str = "Any",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await join_squad_group(db, current_user.id, squad_id, position)

@router.delete("/{squad_id}/leave")
async def leave_squad(
    squad_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await leave_squad_group(db, current_user.id, squad_id)

@router.put("/{squad_id}/tactics", response_model=SquadResponse)
async def adjust_tactics(
    squad_id: uuid.UUID,
    formation: str,
    tactical_notes: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await update_tactics(db, current_user.id, squad_id, formation, tactical_notes)

@router.put("/{squad_id}/members/{user_id}/role")
async def set_role(
    squad_id: uuid.UUID,
    user_id: uuid.UUID,
    role: str,  # captain | vice_captain | member | strategist etc.
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await assign_member_role(db, current_user.id, squad_id, user_id, role)
