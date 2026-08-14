from pydantic import BaseModel, Field
from typing import List, Optional


class SportsRoleResponse(BaseModel):
    sport_id: str = Field(..., description="Unique Sport Identifier e.g. S001")
    sport: str = Field(..., description="Sport name e.g. Football")
    roles: List[str] = Field(..., description="List of 4 distinct player roles")
    role_1: Optional[str] = None
    role_1_count: int = Field(default=1, ge=0, description="Required count for role 1")
    role_2: Optional[str] = None
    role_2_count: int = Field(default=1, ge=0, description="Required count for role 2")
    role_3: Optional[str] = None
    role_3_count: int = Field(default=1, ge=0, description="Required count for role 3")
    role_4: Optional[str] = None
    role_4_count: int = Field(default=1, ge=0, description="Required count for role 4")
    total_players: int = Field(default=1, ge=0, description="Total players required for default squad")
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class SportsRolesListResponse(BaseModel):
    total: int
    data: List[SportsRoleResponse]
