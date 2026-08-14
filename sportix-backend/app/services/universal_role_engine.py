"""
universal_role_engine.py
─────────────────────────────────────────────────────────────────────────────
Universal SPORTiX Sport-Role Slot Allocation & Team Formation Engine.
100% Sport-Agnostic, reading dynamically from sportix_sport_roles.
Per-team role counters, dynamic overflow, stable deterministic placement,
and remaining-space computation.
"""

from typing import List, Dict, Any, Optional, Tuple
from app.schemas.role_engine import (
    RoleSlotDefinition,
    AllocatedPlayer,
    AllocatedTeam,
    WaitingPlayer,
    MissingRoleSummary,
    EventAllocationResult,
)


def validate_sport_config(config: Dict[str, Any]) -> Tuple[bool, Optional[str], int, int]:
    """
    Validates that the sum of role counts matches total_players.
    Returns (is_valid, error_msg, calculated_total, stored_total).
    """
    sport_id = config.get("sport_id", "UNKNOWN")
    sport_name = config.get("sport", "UNKNOWN")
    stored_total = int(config.get("total_players", 1))

    # Extract non-empty roles
    calculated_total = 0
    for i in range(1, 5):
        role_name = (config.get(f"role_{i}") or "").strip()
        count = int(config.get(f"role_{i}_count", 0))
        if role_name:
            calculated_total += count

    # If sport is individual / 1 player per side
    if stored_total == 1 and calculated_total > 1:
        # Singles format allows 1 active player on court from any specialized role
        return True, None, calculated_total, stored_total

    if calculated_total > 0 and calculated_total != stored_total and stored_total > 1:
        error_msg = (
            f"INVALID_ROLE_CONFIGURATION for {sport_id} ({sport_name}): "
            f"sum of role counts ({calculated_total}) does not match total_players ({stored_total})"
        )
        return False, error_msg, calculated_total, stored_total

    return True, None, calculated_total, stored_total


def extract_role_definitions(config: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Dynamically extracts the role definitions from sportix_sport_roles configuration.
    Returns a list of role template definitions: [{'role': name, 'required': count}, ...]
    """
    role_defs: List[Dict[str, Any]] = []
    for i in range(1, 5):
        role_name = (config.get(f"role_{i}") or "").strip()
        count = int(config.get(f"role_{i}_count", 1))
        if role_name:
            role_defs.append({
                "role": role_name,
                "required": max(1, count),
            })

    if not role_defs:
        # Generic fallback if no specific roles defined
        role_defs = [{"role": "Athlete", "required": int(config.get("total_players", 1))}]

    return role_defs


def normalize_role_name(input_role: str, valid_roles: List[str]) -> Optional[str]:
    """Matches a user's selected role to one of the valid sport roles (case-insensitive)."""
    if not input_role:
        return None
    clean = input_role.strip().lower()
    # 1. Exact match first
    for vr in valid_roles:
        if vr.lower() == clean:
            return vr
    # 2. Prefix / substring match fallback
    for vr in valid_roles:
        if clean in vr.lower():
            return vr
    return None


def allocate_event_participants(
    sport_config: Dict[str, Any],
    participants: List[Dict[str, Any]],
    event_capacity: int = 32,
    event_id: Optional[str] = None,
    event_format: str = "team",
    max_teams: Optional[int] = None,
) -> EventAllocationResult:
    """
    Universal sport-role allocation algorithm.
    - Reads team role template from sport_config.
    - Operates per-team independent role counters.
    - Distributes overflow across sequential teams.
    - Calculates remaining space for every role.
    - Places unplaceable players into non-destructive WAITING_FOR_TEAM state.
    """
    sport_id = str(sport_config.get("sport_id") or "S000")
    sport_name = str(sport_config.get("sport") or "General Sport")
    total_players_per_team = int(sport_config.get("total_players") or 1)

    # 1. Validate configuration
    is_valid, config_err, calc_tot, stored_tot = validate_sport_config(sport_config)
    if not is_valid:
        return EventAllocationResult(
            sport_id=sport_id,
            sport=sport_name,
            event_id=event_id,
            registered_count=len(participants),
            event_capacity=event_capacity,
            total_players_per_team=total_players_per_team,
            completed_teams_count=0,
            partial_teams_count=0,
            waiting_players_count=len(participants),
            overall_readiness_pct=0.0,
            teams=[],
            waiting_players=[
                WaitingPlayer(
                    user_id=p.get("user_id", ""),
                    name=p.get("name") or p.get("username", "Athlete"),
                    username=p.get("username", "athlete"),
                    avatar=p.get("avatar"),
                    selected_role=p.get("role", "Athlete"),
                    reason="Invalid sport role configuration in database.",
                    joined_at=p.get("joined_at") or p.get("created_at"),
                )
                for p in participants
            ],
            missing_roles_summary=[],
            role_remaining_space={},
            config_status="INVALID_ROLE_CONFIGURATION",
            config_error=config_err,
        )

    # 2. Extract dynamic role template
    role_template = extract_role_definitions(sport_config)
    valid_role_names = [r["role"] for r in role_template]

    # 3. Filter and sort active participants deterministically
    active_participants: List[Dict[str, Any]] = []
    for p in participants:
        status = (p.get("status") or "registered").lower()
        if status not in ["withdrawn", "cancelled", "removed", "rejected"]:
            active_participants.append(p)

    # Deterministic sort: joined_at/created_at timestamp ASC, user_id ASC as tiebreaker
    def sort_key(item: Dict[str, Any]) -> Tuple[str, str]:
        ts = str(item.get("joined_at") or item.get("created_at") or "9999-12-31")
        uid = str(item.get("user_id") or "")
        return (ts, uid)

    active_participants.sort(key=sort_key)
    registered_count = len(active_participants)

    # 4. Maximum teams limit based on event capacity
    team_capacity = max(1, total_players_per_team)
    computed_max_teams = max(1, (event_capacity + team_capacity - 1) // team_capacity)
    if max_teams:
        computed_max_teams = min(computed_max_teams, max_teams)

    # Helper to instantiate a new team with fresh role counters
    def create_team(idx: int) -> Dict[str, Any]:
        roles_dict: Dict[str, Dict[str, Any]] = {}
        for r in role_template:
            r_name = r["role"]
            r_req = r["required"]
            roles_dict[r_name] = {
                "role_name": r_name,
                "required_count": r_req,
                "filled_count": 0,
                "remaining_space": r_req,
                "status": "OPEN",
            }
        return {
            "team_index": idx,
            "team_name": f"Team {idx}",
            "roles": roles_dict,
            "players": [],
            "total_capacity": team_capacity,
            "current_players": 0,
            "remaining_players": team_capacity,
            "is_complete": False,
            "status": "WAITING",
        }

    # Start with Team 1 initialized
    teams_in_formation: List[Dict[str, Any]] = [create_team(1)]
    waiting_players: List[WaitingPlayer] = []

    # 5. Place participants into teams
    for p in active_participants:
        raw_role = p.get("role") or ""
        matched_role = normalize_role_name(raw_role, valid_role_names)

        # If user didn't select or selected unknown role, attempt to assign first non-full role
        user_id = p.get("user_id") or p.get("$id") or "unknown"
        user_name = p.get("name") or p.get("username") or f"Athlete {user_id[:6]}"
        username = p.get("username") or "athlete"
        avatar = p.get("avatar")
        joined_at = p.get("joined_at") or p.get("created_at")

        placed = False

        # Attempt to find earliest valid team for matched role
        if matched_role:
            for team in teams_in_formation:
                if team["current_players"] < team["total_capacity"]:
                    role_slot = team["roles"].get(matched_role)
                    if role_slot and role_slot["filled_count"] < role_slot["required_count"]:
                        # Place in this team slot
                        role_slot["filled_count"] += 1
                        role_slot["remaining_space"] = max(0, role_slot["required_count"] - role_slot["filled_count"])
                        role_slot["status"] = "FULL" if role_slot["remaining_space"] == 0 else "PARTIAL"

                        team["current_players"] += 1
                        team["remaining_players"] = max(0, team["total_capacity"] - team["current_players"])

                        team["players"].append(
                            AllocatedPlayer(
                                user_id=user_id,
                                name=user_name,
                                username=username,
                                avatar=avatar,
                                selected_role=matched_role,
                                assigned_team_index=team["team_index"],
                                assigned_role=matched_role,
                                joined_at=joined_at,
                                status="confirmed",
                            )
                        )
                        placed = True
                        break

            # If not placed in existing teams, check if we can open a new team
            if not placed and len(teams_in_formation) < computed_max_teams:
                new_team_idx = len(teams_in_formation) + 1
                new_team = create_team(new_team_idx)
                role_slot = new_team["roles"].get(matched_role)
                if role_slot and role_slot["filled_count"] < role_slot["required_count"]:
                    role_slot["filled_count"] += 1
                    role_slot["remaining_space"] = max(0, role_slot["required_count"] - role_slot["filled_count"])
                    role_slot["status"] = "FULL" if role_slot["remaining_space"] == 0 else "PARTIAL"

                    new_team["current_players"] += 1
                    new_team["remaining_players"] = max(0, new_team["total_capacity"] - new_team["current_players"])

                    new_team["players"].append(
                        AllocatedPlayer(
                            user_id=user_id,
                            name=user_name,
                            username=username,
                            avatar=avatar,
                            selected_role=matched_role,
                            assigned_team_index=new_team_idx,
                            assigned_role=matched_role,
                            joined_at=joined_at,
                            status="confirmed",
                        )
                    )
                    teams_in_formation.append(new_team)
                    placed = True

        elif not raw_role:
            # Player has not selected a role yet: search any team with an OPEN slot
            for team in teams_in_formation:
                if team["current_players"] < team["total_capacity"]:
                    for r_name, r_slot in team["roles"].items():
                        if r_slot["filled_count"] < r_slot["required_count"]:
                            r_slot["filled_count"] += 1
                            r_slot["remaining_space"] = max(0, r_slot["required_count"] - r_slot["filled_count"])
                            r_slot["status"] = "FULL" if r_slot["remaining_space"] == 0 else "PARTIAL"

                            team["current_players"] += 1
                            team["remaining_players"] = max(0, team["total_capacity"] - team["current_players"])

                            team["players"].append(
                                AllocatedPlayer(
                                    user_id=user_id,
                                    name=user_name,
                                    username=username,
                                    avatar=avatar,
                                    selected_role=r_name,
                                    assigned_team_index=team["team_index"],
                                    assigned_role=r_name,
                                    joined_at=joined_at,
                                    status="confirmed",
                                )
                            )
                            placed = True
                            break
                    if placed:
                        break

        # If still not placed: assign to WAITING_FOR_TEAM with specific reason
        if not placed:
            reason = "Waiting for teammates to complete required roles."
            if matched_role:
                reason = f"Role '{matched_role}' is full in active teams. Waiting for more athletes to join and unlock next squad."
            elif len(teams_in_formation) >= computed_max_teams:
                reason = "Event capacity limit reached for current squad formations."

            waiting_players.append(
                WaitingPlayer(
                    user_id=user_id,
                    name=user_name,
                    username=username,
                    avatar=avatar,
                    selected_role=matched_role or raw_role or "Unassigned",
                    reason=reason,
                    joined_at=joined_at,
                )
            )

    # 6. Finalize team structures, statuses, missing roles, and overall readiness
    final_teams: List[AllocatedTeam] = []
    completed_teams_count = 0
    partial_teams_count = 0
    missing_roles_summary: List[MissingRoleSummary] = []
    role_remaining_space: Dict[str, int] = {r["role"]: 0 for r in role_template}

    for t in teams_in_formation:
        # Convert roles dict to list
        role_slot_list: List[RoleSlotDefinition] = []
        is_all_roles_filled = True

        for r_name, r_data in t["roles"].items():
            slot_def = RoleSlotDefinition(
                role_name=r_data["role_name"],
                required_count=r_data["required_count"],
                filled_count=r_data["filled_count"],
                remaining_space=r_data["remaining_space"],
                status=r_data["status"],
            )
            role_slot_list.append(slot_def)
            if r_data["remaining_space"] > 0:
                is_all_roles_filled = False
                # If team is in progress, record missing role
                if t["current_players"] > 0:
                    missing_roles_summary.append(
                        MissingRoleSummary(
                            team_index=t["team_index"],
                            team_name=t["team_name"],
                            role_name=r_name,
                            needed_count=r_data["remaining_space"],
                        )
                    )
                    role_remaining_space[r_name] = role_remaining_space.get(r_name, 0) + r_data["remaining_space"]

        is_complete = (t["current_players"] == t["total_capacity"]) and is_all_roles_filled
        if is_complete:
            team_status = "READY"
            completed_teams_count += 1
        elif t["current_players"] > 0:
            team_status = "FORMING"
            partial_teams_count += 1
        else:
            team_status = "WAITING"
            # Add open capacity for empty team 1 if 0 players registered
            if t["team_index"] == 1:
                for r_name, r_data in t["roles"].items():
                    role_remaining_space[r_name] = r_data["required_count"]

        # Only include teams that have players or Team 1 when empty
        if t["current_players"] > 0 or t["team_index"] == 1:
            final_teams.append(
                AllocatedTeam(
                    team_index=t["team_index"],
                    team_name=t["team_name"],
                    roles=role_slot_list,
                    players=t["players"],
                    total_capacity=t["total_capacity"],
                    current_players=t["current_players"],
                    remaining_players=t["remaining_players"],
                    is_complete=is_complete,
                    status=team_status,
                )
            )

    # 7. Compute overall readiness percentage
    active_teams = [t for t in final_teams if t.current_players > 0]
    if not active_teams:
        overall_readiness_pct = 0.0
    else:
        total_target_for_active_teams = sum(t.total_capacity for t in active_teams)
        total_placed_players = sum(t.current_players for t in active_teams)
        overall_readiness_pct = round((total_placed_players / total_target_for_active_teams) * 100, 2)

    return EventAllocationResult(
        sport_id=sport_id,
        sport=sport_name,
        event_id=event_id,
        registered_count=registered_count,
        event_capacity=event_capacity,
        total_players_per_team=total_players_per_team,
        completed_teams_count=completed_teams_count,
        partial_teams_count=partial_teams_count,
        waiting_players_count=len(waiting_players),
        overall_readiness_pct=overall_readiness_pct,
        teams=final_teams,
        waiting_players=waiting_players,
        missing_roles_summary=missing_roles_summary,
        role_remaining_space=role_remaining_space,
        config_status="VALID",
        config_error=None,
    )
