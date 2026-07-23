# Chemistry calculation helpers — integrated in squad_service.py
from app.services import squad_service

async def calculate_squad_chemistry(squad_id: str):
    return await squad_service.get_chemistry(squad_id)
