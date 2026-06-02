import uuid
from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.squad import Squad, SquadMember
from app.services.chemistry_service import recalculate_squad_chemistry
from app.services.mission_service import update_mission_progress

async def create_squad_profile(
    db: AsyncSession,
    creator_id: uuid.UUID,
    squad_in
) -> Squad:
    squad = Squad(
        id=uuid.uuid4(),
        name=squad_in.name,
        sport=squad_in.sport,
        captain_id=creator_id,
        formation=squad_in.formation,
        tactical_notes=squad_in.tactical_notes,
        chemistry_score=50.0,  # Starting baseline
        trust_index=50.0,
        communication_score=50.0,
        coordination_score=50.0,
        win_count=0,
        draw_count=0,
        loss_count=0,
        is_ai_generated=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(squad)
    await db.flush()
    
    # Add creator as captain member
    captain = SquadMember(
        id=uuid.uuid4(),
        squad_id=squad.id,
        user_id=creator_id,
        role="captain",
        position="Any",
        joined_at=datetime.utcnow(),
        is_active=True
    )
    db.add(captain)
    await db.flush()
    
    await recalculate_squad_chemistry(db, squad.id)
    return squad

async def join_squad_group(
    db: AsyncSession,
    user_id: uuid.UUID,
    squad_id: uuid.UUID,
    position: str = "Any"
) -> dict:
    squad = await db.get(Squad, squad_id)
    if not squad:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Squad not found")
        
    # Check if already a member
    result = await db.execute(
        select(SquadMember).where(
            SquadMember.squad_id == squad_id,
            SquadMember.user_id == user_id
        )
    )
    member = result.scalar_one_or_none()
    if member:
        if not member.is_active:
            member.is_active = True
            await db.flush()
            await recalculate_squad_chemistry(db, squad_id)
        return {"success": True, "message": "Joined squad successfully"}
        
    new_member = SquadMember(
        id=uuid.uuid4(),
        squad_id=squad_id,
        user_id=user_id,
        role="member",
        position=position,
        joined_at=datetime.utcnow(),
        is_active=True
    )
    db.add(new_member)
    await db.flush()
    
    # Recalculate squad chemistry
    await recalculate_squad_chemistry(db, squad_id)
    
    # Update Daily Mission Progress for joining a squad
    await update_mission_progress(db, user_id, "join_autosquad")
    
    return {"success": True, "message": "Joined squad successfully"}

async def leave_squad_group(db: AsyncSession, user_id: uuid.UUID, squad_id: uuid.UUID) -> dict:
    result = await db.execute(
        select(SquadMember).where(
            SquadMember.squad_id == squad_id,
            SquadMember.user_id == user_id
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        return {"success": True, "message": "Not a squad member"}
        
    await db.delete(member)
    await db.flush()
    
    # Recalculate chemistry after departure
    await recalculate_squad_chemistry(db, squad_id)
    return {"success": True, "message": "Left squad successfully"}

async def update_tactics(
    db: AsyncSession,
    user_id: uuid.UUID,
    squad_id: uuid.UUID,
    formation: str,
    tactical_notes: str = None
) -> Squad:
    squad = await db.get(Squad, squad_id)
    if not squad:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Squad not found")
        
    # Check authorization (only captain or vice-captain)
    if squad.captain_id != user_id and squad.vice_captain_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only captain or vice-captain can update tactics"
        )
        
    squad.formation = formation
    if tactical_notes is not None:
        squad.tactical_notes = tactical_notes
        
    squad.updated_at = datetime.utcnow()
    await db.flush()
    return squad

async def assign_member_role(
    db: AsyncSession,
    captain_id: uuid.UUID,
    squad_id: uuid.UUID,
    target_user_id: uuid.UUID,
    role: str
) -> dict:
    squad = await db.get(Squad, squad_id)
    if not squad:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Squad not found")
        
    if squad.captain_id != captain_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the squad captain can assign roles"
        )
        
    result = await db.execute(
        select(SquadMember).where(
            SquadMember.squad_id == squad_id,
            SquadMember.user_id == target_user_id
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Squad member not found")
        
    member.role = role
    
    # Sync with captain or vice captain properties on the Squad table
    if role == "captain":
        squad.captain_id = target_user_id
        member.role = "captain"
        # The previous captain gets demoted to member or stays
        prev_cap_res = await db.execute(
            select(SquadMember).where(
                SquadMember.squad_id == squad_id,
                SquadMember.user_id == captain_id
            )
        )
        prev_cap = prev_cap_res.scalar_one_or_none()
        if prev_cap:
            prev_cap.role = "member"
    elif role == "vice_captain":
        squad.vice_captain_id = target_user_id
        
    await db.flush()
    return {"success": True, "message": f"Successfully assigned role {role}"}
