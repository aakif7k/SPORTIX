from fastapi import APIRouter, Depends
from typing import Optional
from app.core.dependencies import get_current_user
from app.schemas.match import MatchResultUpdate, StatsSubmission, StatValidate, SquadRetentionVote, MatchCreate
from app.services import match_service

router = APIRouter()


@router.post("/", status_code=201)
async def create_match(payload: MatchCreate, user=Depends(get_current_user)):
    """
    Record a match.

    The four fields were query parameters, so every caller that posted them as
    JSON -- all of them -- created a match with no sport and no squad, and a
    squad's match history could never find it.
    """
    data = await match_service.create(
        event_id=payload.event_id,
        home_squad_id=payload.home_squad_id,
        away_squad_id=payload.away_squad_id,
        sport=payload.sport,
        opponent_name=payload.opponent_name,
    )
    return {"success": True, "data": data}


@router.get("/pending-report/check")
async def check_pending_report(user=Depends(get_current_user)):
    """Check if user has a pending (unsubmitted) match report."""
    data = await match_service.check_pending_report(user["id"])
    return {"success": True, "data": data}


@router.get("/{match_id}")
async def get_match(match_id: str, user=Depends(get_current_user)):
    data = await match_service.get_by_id(match_id)
    return {"success": True, "data": data}


@router.patch("/{match_id}/result")
async def update_result(
    match_id: str,
    payload: MatchResultUpdate,
    user=Depends(get_current_user),
):
    data = await match_service.update_result(
        match_id, payload.result.value, payload.score_home, payload.score_away
    )
    return {"success": True, "data": data}


@router.post("/{match_id}/stats", status_code=201)
async def submit_stats(match_id: str, payload: StatsSubmission, user=Depends(get_current_user)):
    data = await match_service.submit_stats(match_id, user["id"], payload)
    return {"success": True, "data": data}


@router.get("/{match_id}/stats")
async def get_all_stats(match_id: str, user=Depends(get_current_user)):
    data = await match_service.get_stats(match_id)
    return {"success": True, "data": data}


@router.post("/{match_id}/validate/{stat_id}")
async def validate_stat(match_id: str, stat_id: str, payload: StatValidate, user=Depends(get_current_user)):
    data = await match_service.validate_stat(stat_id, user["id"], payload)
    return {"success": True, "data": data}


@router.post("/{match_id}/retention")
async def retention_vote(match_id: str, payload: SquadRetentionVote, user=Depends(get_current_user)):
    data = await match_service.retention_vote(match_id, user["id"], payload.target_id, payload.vote.value)
    return {"success": True, "data": data}
