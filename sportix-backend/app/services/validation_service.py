import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.models.match import Match, PlayerStat, StatValidation
from app.models.squad import SquadMember
from app.services.pulse_service import add_pulse_points
from app.services.coins_service import add_coins
from app.services.mission_service import update_mission_progress
from app.services.notification_service import create_notification

async def submit_player_stats(
    db: AsyncSession,
    match_id: uuid.UUID,
    user_id: uuid.UUID,
    sport: str,
    stats_data: dict,
    media_proof_url: str = None
) -> PlayerStat:
    # Check if stats already submitted
    result = await db.execute(
        select(PlayerStat).where(
            PlayerStat.match_id == match_id,
            PlayerStat.user_id == user_id
        )
    )
    player_stat = result.scalar_one_or_none()
    
    if player_stat:
        player_stat.stats_data = stats_data
        player_stat.media_proof_url = media_proof_url
        player_stat.validation_status = "pending"
        player_stat.submitted_at = datetime.utcnow()
    else:
        player_stat = PlayerStat(
            id=uuid.uuid4(),
            match_id=match_id,
            user_id=user_id,
            sport=sport,
            stats_data=stats_data,
            media_proof_url=media_proof_url,
            validation_status="pending",
            submitted_at=datetime.utcnow()
        )
        db.add(player_stat)
        
    await db.flush()
    
    # Notify other squad members to validate
    match = await db.get(Match, match_id)
    if match:
        result = await db.execute(
            select(SquadMember.user_id).where(
                SquadMember.squad_id == match.squad_id,
                SquadMember.user_id != user_id,
                SquadMember.is_active == True
            )
        )
        teammate_ids = result.scalars().all()
        
        for t_id in teammate_ids:
            await create_notification(
                db,
                t_id,
                "validation_request",
                "Validate Teammate Stats",
                f"Your teammate submitted match stats. Please confirm or dispute them.",
                {"player_stat_id": str(player_stat.id), "match_id": str(match_id)}
            )
            
    return player_stat

async def submit_stat_validation(
    db: AsyncSession,
    player_stat_id: uuid.UUID,
    validator_id: uuid.UUID,
    vote_val: str,  # confirm | partial | dispute
    reason: str = None
) -> dict:
    player_stat = await db.get(PlayerStat, player_stat_id)
    if not player_stat:
        return {"success": False, "error": "Player stat record not found"}
        
    # Check if validator already voted
    result = await db.execute(
        select(StatValidation).where(
            StatValidation.player_stat_id == player_stat_id,
            StatValidation.validator_id == validator_id
        )
    )
    validation = result.scalar_one_or_none()
    
    if validation:
        validation.vote = vote_val
        validation.reason = reason
        validation.created_at = datetime.utcnow()
    else:
        validation = StatValidation(
            id=uuid.uuid4(),
            player_stat_id=player_stat_id,
            validator_id=validator_id,
            vote=vote_val,
            reason=reason
        )
        db.add(validation)
        
    await db.flush()
    
    # Recalculate consensus validation status
    result = await db.execute(
        select(StatValidation).where(StatValidation.player_stat_id == player_stat_id)
    )
    all_validations = result.scalars().all()
    
    confirms = sum(1 for v in all_validations if v.vote == "confirm")
    partials = sum(1 for v in all_validations if v.vote == "partial")
    disputes = sum(1 for v in all_validations if v.vote == "dispute")
    total_votes = len(all_validations)
    
    old_status = player_stat.validation_status
    new_status = "pending"
    
    # Minimum 1 validator for consensus, or let's settle with simple majority logic
    if total_votes >= 1:
        if disputes > confirms:
            new_status = "flagged"
        elif confirms >= (total_votes * 0.6):
            new_status = "accepted"
        else:
            new_status = "partial"
            
    player_stat.validation_status = new_status
    await db.flush()
    
    # Trigger rewards if status changed to accepted
    rewards_issued = False
    level_up_info = None
    
    if new_status == "accepted" and old_status != "accepted":
        rewards_issued = True
        
        # Award Pulse Points for completing a match with validated stats
        pulse_res = await add_pulse_points(
            db,
            player_stat.user_id,
            12.0,
            "match",
            f"Validated stats for match play",
            match_id=player_stat.match_id
        )
        level_up_info = pulse_res["level_up_info"]
        
        # Award Coins
        await add_coins(
            db,
            player_stat.user_id,
            30,
            "match_validation",
            "Bonus for validated match statistics",
            reference_id=str(player_stat.id)
        )
        
        # Update Daily Missions Progress
        await update_mission_progress(db, player_stat.user_id, "complete_match")
        
        # Check match result for win mission
        match = await db.get(Match, player_stat.match_id)
        if match and match.result == "win":
            await update_mission_progress(db, player_stat.user_id, "win_match")
            
        # Notify the user
        await create_notification(
            db,
            player_stat.user_id,
            "validation_request",
            "Match Stats Approved!",
            "Your submitted match stats have been verified by your team.",
            {"match_id": str(player_stat.match_id), "status": "accepted"}
        )
        
    return {
        "success": True,
        "old_status": old_status,
        "new_status": new_status,
        "rewards_issued": rewards_issued,
        "level_up_info": level_up_info
    }
