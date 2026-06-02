from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from typing import List, Optional

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.match import MatchCreate, MatchResponse, PlayerStatSubmit, PlayerStatResponse, StatValidationSubmit, RetentionVoteSubmit
from app.services.match_service import create_new_match, update_match_result, list_matches
from app.services.validation_service import submit_player_stats, submit_stat_validation
from app.services.chemistry_service import add_retention_vote

router = APIRouter(prefix="/api/matches", tags=["matches"])

@router.post("", response_model=MatchResponse, status_code=status.HTTP_201_CREATED)
async def create_match(
    match_in: MatchCreate,
    db: AsyncSession = Depends(get_db)
):
    return await create_new_match(db, match_in)

@router.get("", response_model=List[MatchResponse])
async def get_matches(
    squad_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db)
):
    return await list_matches(db, squad_id)

@router.put("/{match_id}/result", response_model=MatchResponse)
async def set_result(
    match_id: uuid.UUID,
    result: str,  # win | loss | draw | pending
    top_performer_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db)
):
    return await update_match_result(db, match_id, result, top_performer_id)

@router.post("/{match_id}/stats", response_model=PlayerStatResponse, status_code=status.HTTP_201_CREATED)
async def upload_stats(
    match_id: uuid.UUID,
    stat_in: PlayerStatSubmit,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await submit_player_stats(
        db,
        match_id,
        current_user.id,
        stat_in.sport,
        stat_in.stats_data,
        stat_in.media_proof_url
    )

@router.post("/stats/{player_stat_id}/validate")
async def validate_stats(
    player_stat_id: uuid.UUID,
    validation_in: StatValidationSubmit,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await submit_stat_validation(
        db,
        player_stat_id,
        current_user.id,
        validation_in.vote,
        validation_in.reason
    )

@router.post("/{match_id}/retention")
async def vote_retention(
    match_id: uuid.UUID,
    squad_id: uuid.UUID,
    vote_in: RetentionVoteSubmit,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await add_retention_vote(
        db,
        match_id,
        current_user.id,
        squad_id,
        vote_in.vote
    )
