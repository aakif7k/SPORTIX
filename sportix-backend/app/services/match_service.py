import uuid
from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.match import Match
from app.models.squad import Squad
from app.services.chemistry_service import recalculate_squad_chemistry

async def create_new_match(
    db: AsyncSession,
    match_in
) -> Match:
    # Validate squads exist
    squad = await db.get(Squad, match_in.squad_id)
    if not squad:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Squad not found")
        
    opponent = None
    if match_in.opponent_squad_id:
        opponent = await db.get(Squad, match_in.opponent_squad_id)
        if not opponent:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opponent squad not found")
            
    match = Match(
        id=uuid.uuid4(),
        event_id=match_in.event_id,
        squad_id=match_in.squad_id,
        opponent_squad_id=match_in.opponent_squad_id,
        result=match_in.result,
        chemistry_delta=0.0,
        top_performer_id=None,
        played_at=datetime.utcnow(),
        created_at=datetime.utcnow()
    )
    db.add(match)
    await db.flush()
    return match

async def update_match_result(
    db: AsyncSession,
    match_id: uuid.UUID,
    result_val: str,  # win | loss | draw | pending
    top_performer_id: uuid.UUID = None
) -> Match:
    match = await db.get(Match, match_id)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
        
    old_result = match.result
    match.result = result_val
    if top_performer_id:
        match.top_performer_id = top_performer_id
        
    # Get squads to adjust win/draw/loss records
    squad = await db.get(Squad, match.squad_id)
    opponent = await db.get(Squad, match.opponent_squad_id) if match.opponent_squad_id else None
    
    # Rollback old result stats first if it wasn't pending
    if old_result != "pending":
        if old_result == "win":
            squad.win_count = max(0, squad.win_count - 1)
            if opponent:
                opponent.loss_count = max(0, opponent.loss_count - 1)
        elif old_result == "loss":
            squad.loss_count = max(0, squad.loss_count - 1)
            if opponent:
                opponent.win_count = max(0, opponent.win_count - 1)
        elif old_result == "draw":
            squad.draw_count = max(0, squad.draw_count - 1)
            if opponent:
                opponent.draw_count = max(0, opponent.draw_count - 1)
                
    # Apply new results stats
    if result_val == "win":
        squad.win_count += 1
        if opponent:
            opponent.loss_count += 1
    elif result_val == "loss":
        squad.loss_count += 1
        if opponent:
            opponent.win_count += 1
    elif result_val == "draw":
        squad.draw_count += 1
        if opponent:
            opponent.draw_count += 1
            
    await db.flush()
    
    # Recalculate chemistry score for both squads
    old_chem = squad.chemistry_score
    new_chem = await recalculate_squad_chemistry(db, squad.id)
    match.chemistry_delta = round(new_chem - old_chem, 2)
    
    if opponent:
        await recalculate_squad_chemistry(db, opponent.id)
        
    await db.flush()
    return match

async def list_matches(db: AsyncSession, squad_id: uuid.UUID = None) -> list[Match]:
    query = select(Match).options(
        selectinload(Match.squad),
        selectinload(Match.opponent_squad),
        selectinload(Match.top_performer)
    )
    if squad_id:
        query = query.where((Match.squad_id == squad_id) | (Match.opponent_squad_id == squad_id))
        
    result = await db.execute(query.order_by(Match.played_at.desc()))
    return list(result.scalars().all())
