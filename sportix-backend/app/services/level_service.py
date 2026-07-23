# Level service stubs — level logic is integrated in pulse_service.py
from app.services import pulse_service

async def get_user_level(user_id: str):
    return await pulse_service.get_level(user_id)

async def check_level_up(user_id: str, total_pulse: float):
    return await pulse_service._check_level_up(user_id, total_pulse)
