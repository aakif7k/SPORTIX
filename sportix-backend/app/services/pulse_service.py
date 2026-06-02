import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.pulse import PulseScore, PulseHistory
from app.services.level_service import add_xp_or_pulse_to_level
from app.websockets.manager import ws_manager

CATEGORY_MAPPINGS = {
    "login": ["consistency", "activity"],
    "post": ["activity"],
    "highlight": ["activity"],
    "reaction": ["activity"],
    "comment": ["activity"],
    "match": ["match_performance", "reliability"],
    "squad": ["team_chemistry"],
    "chemistry": ["team_chemistry"],
    "validation": ["reliability"],
    "leadership": ["leadership"],
    "mission": ["activity", "consistency"]
}

async def get_or_create_pulse_score(db: AsyncSession, user_id: uuid.UUID) -> PulseScore:
    result = await db.execute(select(PulseScore).where(PulseScore.user_id == user_id))
    pulse_score = result.scalar_one_or_none()
    if not pulse_score:
        pulse_score = PulseScore(
            id=uuid.uuid4(),
            user_id=user_id,
            total_pulse=100.0,
            match_performance=50.0,
            consistency=50.0,
            team_chemistry=50.0,
            reliability=50.0,
            activity=50.0,
            leadership=50.0
        )
        db.add(pulse_score)
        await db.flush()
    return pulse_score

async def add_pulse_points(
    db: AsyncSession,
    user_id: uuid.UUID,
    amount: float,
    source: str,  # match | login | post | event | mission | squad | reaction | highlight | challenge
    reason: str,
    match_id: uuid.UUID = None
) -> dict:
    pulse_score = await get_or_create_pulse_score(db, user_id)
    
    old_pulse = pulse_score.total_pulse
    pulse_score.total_pulse = max(0.0, pulse_score.total_pulse + amount)
    new_pulse = pulse_score.total_pulse
    
    # Update categories
    categories = CATEGORY_MAPPINGS.get(source, ["activity"])
    for cat in categories:
        current_val = getattr(pulse_score, cat)
        # Increase sub-metric by a fraction of the amount, ensuring it is bounded 0 to 100
        new_val = min(100.0, max(0.0, current_val + (amount * 0.5)))
        setattr(pulse_score, cat, new_val)
        
    # Record history
    history = PulseHistory(
        id=uuid.uuid4(),
        user_id=user_id,
        source=source,
        old_pulse=old_pulse,
        new_pulse=new_pulse,
        delta=amount,
        reason=reason,
        match_id=match_id,
        created_at=datetime.utcnow()
    )
    db.add(history)
    await db.flush()
    
    # Check level up progression
    level_up_res = await add_xp_or_pulse_to_level(db, user_id, amount)
    
    # Send WebSocket broadcast for real-time pulse updates
    await ws_manager.send_notification_to_user(
        user_id,
        {
            "event": "pulse_updated",
            "data": {
                "total_pulse": pulse_score.total_pulse,
                "delta": amount,
                "source": source,
                "reason": reason,
                "match_performance": pulse_score.match_performance,
                "consistency": pulse_score.consistency,
                "team_chemistry": pulse_score.team_chemistry,
                "reliability": pulse_score.reliability,
                "activity": pulse_score.activity,
                "leadership": pulse_score.leadership
            }
        }
    )
    
    return {
        "old_pulse": old_pulse,
        "new_pulse": new_pulse,
        "delta": amount,
        "level_up_info": level_up_res
    }
