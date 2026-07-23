# Stat validation service — integrated in match_service.py
from app.services import match_service
from app.schemas.match import StatValidate

async def validate_player_stat(stat_id: str, validator_id: str, payload: StatValidate):
    return await match_service.validate_stat(stat_id, validator_id, payload)
