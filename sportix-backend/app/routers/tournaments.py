from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
import uuid

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.tournament import Tournament
from app.schemas.tournament import TournamentCreate, TournamentResponse

router = APIRouter(prefix="/api/tournaments", tags=["tournaments"])

@router.post("", response_model=TournamentResponse, status_code=status.HTTP_201_CREATED)
async def create_tournament(
    tournament_in: TournamentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role not in ["organizer", "coach"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers or coaches can create tournaments"
        )
        
    db_tournament = Tournament(
        id=uuid.uuid4(),
        name=tournament_in.name,
        sport=tournament_in.sport,
        description=tournament_in.description,
        rules=tournament_in.rules,
        max_teams=tournament_in.max_teams,
        prize_pool=tournament_in.prize_pool,
        start_date=tournament_in.start_date,
        end_date=tournament_in.end_date,
        status="registration",
        winner_squad_id=None
    )
    db.add(db_tournament)
    await db.flush()
    return db_tournament

@router.get("", response_model=List[TournamentResponse])
async def get_tournaments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tournament).order_by(Tournament.start_date.asc()))
    return list(result.scalars().all())

@router.get("/{tournament_id}", response_model=TournamentResponse)
async def get_tournament_details(tournament_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    tournament = await db.get(Tournament, tournament_id)
    if not tournament:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tournament not found")
    return tournament
