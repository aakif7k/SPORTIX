"""
sports.py
Router for SPORTiX sports roles endpoints.
"""
from typing import List
from fastapi import APIRouter, HTTPException, status
from app.schemas.sports_role import SportsRoleResponse, SportsRolesListResponse
from app.services.sports_role_service import get_all_sports_roles, get_sport_role_by_id

router = APIRouter()


@router.get(
    "/roles",
    response_model=List[SportsRoleResponse],
    summary="Get all sports roles",
    description="Retrieve all 30 sports and their 4 specialized tactical roles from the database.",
)
async def list_sports_roles():
    roles = get_all_sports_roles()
    return roles


@router.get(
    "/roles/{sport_id}",
    response_model=SportsRoleResponse,
    summary="Get one sport role details",
    description="Retrieve player roles for a specific sport by sport_id (e.g. S001) or sport name (e.g. Football).",
)
async def get_sport_role(sport_id: str):
    role_data = get_sport_role_by_id(sport_id)
    if not role_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sport with identifier '{sport_id}' not found.",
        )
    return role_data
