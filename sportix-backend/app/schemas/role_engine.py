from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class RoleSlotDefinition(BaseModel):
    role_name: str = Field(..., description="Name of the role e.g. Goalkeeper, Batter")
    required_count: int = Field(..., ge=0, description="Required count per team")
    filled_count: int = Field(..., ge=0, description="Number of players currently placed in this slot")
    remaining_space: int = Field(..., ge=0, description="Remaining open slots for this role in this team")
    status: str = Field(..., description="OPEN, PARTIAL, or FULL")


class AllocatedPlayer(BaseModel):
    user_id: str
    name: Optional[str] = None
    username: Optional[str] = None
    avatar: Optional[str] = None
    selected_role: str
    assigned_team_index: int = Field(..., description="0-indexed or 1-indexed team number")
    assigned_role: str
    joined_at: Optional[str] = None
    status: str = Field(default="confirmed")


class AllocatedTeam(BaseModel):
    team_index: int = Field(..., description="1-indexed team number (Team 1, Team 2, ...)")
    team_name: str = Field(..., description="Display name e.g. Team 1, Alpha Squad")
    roles: List[RoleSlotDefinition] = Field(default_factory=list)
    players: List[AllocatedPlayer] = Field(default_factory=list)
    total_capacity: int = Field(..., ge=1, description="Target team size from sportix_sport_roles")
    current_players: int = Field(..., ge=0, description="Number of players assigned to this team")
    remaining_players: int = Field(..., ge=0, description="Remaining slots to complete this team")
    is_complete: bool = Field(default=False)
    status: str = Field(..., description="READY, FORMING, or WAITING")


class WaitingPlayer(BaseModel):
    user_id: str
    name: Optional[str] = None
    username: Optional[str] = None
    avatar: Optional[str] = None
    selected_role: str
    reason: str = Field(..., description="Human-readable reason why player is waiting")
    joined_at: Optional[str] = None


class MissingRoleSummary(BaseModel):
    team_index: int
    team_name: str
    role_name: str
    needed_count: int


class EventAllocationResult(BaseModel):
    sport_id: str
    sport: str
    event_id: Optional[str] = None
    registered_count: int = Field(..., ge=0)
    event_capacity: int = Field(..., ge=1)
    total_players_per_team: int = Field(..., ge=1)
    completed_teams_count: int = Field(..., ge=0)
    partial_teams_count: int = Field(..., ge=0)
    waiting_players_count: int = Field(..., ge=0)
    overall_readiness_pct: float = Field(..., ge=0.0, le=100.0)
    teams: List[AllocatedTeam] = Field(default_factory=list)
    waiting_players: List[WaitingPlayer] = Field(default_factory=list)
    missing_roles_summary: List[MissingRoleSummary] = Field(default_factory=list)
    role_remaining_space: Dict[str, int] = Field(default_factory=dict, description="Remaining slots per role across active teams")
    config_status: str = Field(default="VALID", description="VALID or INVALID_ROLE_CONFIGURATION")
    config_error: Optional[str] = None
