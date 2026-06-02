import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.models.squad import Squad
from app.models.match import Match, RetentionVote
from app.models.message import Message

async def recalculate_squad_chemistry(db: AsyncSession, squad_id: uuid.UUID) -> float:
    squad = await db.get(Squad, squad_id)
    if not squad:
        return 0.0
        
    # 1. Communication Score (based on chat message volume)
    msg_result = await db.execute(
        select(func.count(Message.id)).where(Message.squad_id == squad_id)
    )
    msg_count = msg_result.scalar() or 0
    communication_score = min(100.0, 40.0 + (msg_count * 2.0))
    
    # 2. Coordination Score (based on matches played and team stability)
    match_result = await db.execute(
        select(func.count(Match.id)).where(Match.squad_id == squad_id)
    )
    match_count = match_result.scalar() or 0
    coordination_score = min(100.0, 30.0 + (match_count * 7.5))
    
    # 3. Trust Index (based on retention votes)
    votes_result = await db.execute(
        select(RetentionVote).where(RetentionVote.squad_id == squad_id)
    )
    votes = votes_result.scalars().all()
    if not votes:
        trust_index = 50.0
    else:
        total_votes = len(votes)
        points = 0.0
        for v in votes:
            if v.vote == "definitely":
                points += 100.0
            elif v.vote == "maybe":
                points += 60.0
            elif v.vote == "no":
                points += 10.0
        trust_index = round(points / total_votes, 1)
        
    # 4. Win/Performance factor
    total_matches = squad.win_count + squad.draw_count + squad.loss_count
    if total_matches == 0:
        performance_factor = 50.0
    else:
        performance_factor = ((squad.win_count * 1.0 + squad.draw_count * 0.5) / total_matches) * 100.0
        
    # 5. Composite Chemistry Score
    # Weights: Performance (30%), Trust (30%), Communication (20%), Coordination (20%)
    chemistry = (
        (performance_factor * 0.30) +
        (trust_index * 0.30) +
        (communication_score * 0.20) +
        (coordination_score * 0.20)
    )
    chemistry = round(min(100.0, max(0.0, chemistry)), 2)
    
    # Update squad
    squad.communication_score = round(communication_score, 1)
    squad.coordination_score = round(coordination_score, 1)
    squad.trust_index = round(trust_index, 1)
    squad.chemistry_score = chemistry
    squad.updated_at = datetime.utcnow()
    
    await db.flush()
    return chemistry

async def add_retention_vote(
    db: AsyncSession,
    match_id: uuid.UUID,
    voter_id: uuid.UUID,
    squad_id: uuid.UUID,
    vote_val: str  # definitely | maybe | no
) -> dict:
    # Check if vote already exists
    result = await db.execute(
        select(RetentionVote).where(
            RetentionVote.match_id == match_id,
            RetentionVote.voter_id == voter_id
        )
    )
    existing_vote = result.scalar_one_or_none()
    
    if existing_vote:
        existing_vote.vote = vote_val
        existing_vote.created_at = datetime.utcnow()
    else:
        new_vote = RetentionVote(
            id=uuid.uuid4(),
            match_id=match_id,
            voter_id=voter_id,
            squad_id=squad_id,
            vote=vote_val
        )
        db.add(new_vote)
        
    await db.flush()
    
    # Update squad chemistry
    new_chemistry = await recalculate_squad_chemistry(db, squad_id)
    
    return {
        "success": True,
        "new_chemistry": new_chemistry
    }
