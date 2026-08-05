"""
Tournaments.

The collections were provisioned in phase 2 and seeded with demo data, and
nothing ever served them: TournamentHub's featured championship, standings table
and bracket were all written into the markup, and its Register button only
appended to component state.
"""
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request, Response

from app.core.dependencies import get_current_user
from app.core.rate_limit import limiter, WRITE_LIMIT
from app.schemas.tournament import TournamentEntry
from app.services import tournament_service

router = APIRouter()


@router.get("/")
async def browse_tournaments(
    status: Optional[str] = Query(None, description="registering|in_progress|full|completed"),
    sport: Optional[str] = Query(None),
    page: int = Query(0),
    limit: int = Query(20, le=50),
    user=Depends(get_current_user),
):
    """Tournaments, soonest first, each saying whether one of your squads is in it."""
    data = await tournament_service.browse(user["id"], status, sport, page, limit)
    return {"success": True, "data": data}


@router.get("/{tournament_id}")
async def get_tournament(tournament_id: str, user=Depends(get_current_user)):
    """
    One tournament with its standings and bracket.

    Standings are derived from completed tournament_matches rather than stored,
    so a recorded result needs no second write to show up here.
    """
    data = await tournament_service.get_detail(tournament_id, user["id"])
    return {"success": True, "data": data}


@router.post("/{tournament_id}/register", status_code=201)
@limiter.limit(WRITE_LIMIT)
async def register_squad(
    request: Request, response: Response,
    tournament_id: str, payload: TournamentEntry,
    user=Depends(get_current_user),
):
    """Enter one of your squads. Captain-only, and idempotent."""
    data = await tournament_service.register_squad(
        tournament_id, payload.squad_id, user["id"])
    return {"success": True, "data": data}


@router.post("/{tournament_id}/withdraw")
async def withdraw_squad(
    tournament_id: str, payload: TournamentEntry, user=Depends(get_current_user),
):
    data = await tournament_service.withdraw_squad(
        tournament_id, payload.squad_id, user["id"])
    return {"success": True, "data": data}
