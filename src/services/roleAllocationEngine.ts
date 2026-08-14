/**
 * roleAllocationEngine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * SPORTiX Universal All-Sport Role Slot + Team/Group Generation Engine.
 * 100% Sport-Agnostic, dynamic allocation driven by sportix_sport_roles.
 * Per-team role counters, dynamic overflow, non-destructive waiting list,
 * and remaining space for role computation.
 */

import { type SportsRoleData } from './sportsRoleService';

export interface RoleSlotDefinition {
  role_name: string;
  required_count: number;
  filled_count: number;
  remaining_space: number;
  status: 'OPEN' | 'PARTIAL' | 'FULL';
}

export interface AllocatedPlayer {
  user_id: string;
  name: string;
  username: string;
  avatar?: string;
  selected_role: string;
  assigned_team_index: number;
  assigned_role: string;
  joined_at?: string;
  status: string;
}

export interface AllocatedTeam {
  team_index: number;
  team_name: string;
  roles: RoleSlotDefinition[];
  players: AllocatedPlayer[];
  total_capacity: number;
  current_players: number;
  remaining_players: number;
  is_complete: boolean;
  status: 'READY' | 'FORMING' | 'WAITING';
}

export interface WaitingPlayer {
  user_id: string;
  name: string;
  username: string;
  avatar?: string;
  selected_role: string;
  reason: string;
  joined_at?: string;
}

export interface MissingRoleSummary {
  team_index: number;
  team_name: string;
  role_name: string;
  needed_count: number;
}

export interface EventAllocationResult {
  sport_id: string;
  sport: string;
  event_id?: string;
  registered_count: number;
  event_capacity: number;
  total_players_per_team: number;
  completed_teams_count: number;
  partial_teams_count: number;
  waiting_players_count: number;
  overall_readiness_pct: number;
  teams: AllocatedTeam[];
  waiting_players: WaitingPlayer[];
  missing_roles_summary: MissingRoleSummary[];
  role_remaining_space: Record<string, number>;
  config_status: 'VALID' | 'INVALID_ROLE_CONFIGURATION';
  config_error?: string | null;
}

export interface DynamicRoleTemplate {
  role: string;
  required: number;
}

/**
 * Validates sport role configuration.
 */
export function validateSportConfig(config: SportsRoleData): {
  isValid: boolean;
  errorMsg: string | null;
  calculatedTotal: number;
  storedTotal: number;
} {
  const sportId = config.sport_id || 'UNKNOWN';
  const sportName = config.sport || 'UNKNOWN';
  const storedTotal = Number(config.total_players ?? 1);

  const calculatedTotal =
    Number(config.role_1_count || 0) +
    Number(config.role_2_count || 0) +
    Number(config.role_3_count || 0) +
    Number(config.role_4_count || 0);

  // Singles format allows 1 player on court
  if (storedTotal === 1 && calculatedTotal >= 1) {
    return { isValid: true, errorMsg: null, calculatedTotal, storedTotal };
  }

  if (calculatedTotal > 0 && calculatedTotal !== storedTotal && storedTotal > 1) {
    const errorMsg = `INVALID_ROLE_CONFIGURATION for ${sportId} (${sportName}): sum of role counts (${calculatedTotal}) does not match total_players (${storedTotal})`;
    return { isValid: false, errorMsg, calculatedTotal, storedTotal };
  }

  return { isValid: true, errorMsg: null, calculatedTotal, storedTotal };
}

/**
 * Extracts non-empty dynamic role definitions from sport config.
 */
export function extractRoleDefinitions(config: SportsRoleData): DynamicRoleTemplate[] {
  const roleDefs: DynamicRoleTemplate[] = [];

  const roles = [
    { role: config.role_1, required: Number(config.role_1_count || 1) },
    { role: config.role_2, required: Number(config.role_2_count || 1) },
    { role: config.role_3, required: Number(config.role_3_count || 1) },
    { role: config.role_4, required: Number(config.role_4_count || 1) },
  ];

  for (const r of roles) {
    if (r.role && r.role.trim().length > 0) {
      roleDefs.push({
        role: r.role.trim(),
        required: Math.max(1, r.required),
      });
    }
  }

  if (roleDefs.length === 0) {
    roleDefs.push({
      role: 'Athlete',
      required: Math.max(1, Number(config.total_players ?? 1)),
    });
  }

  return roleDefs;
}

/**
 * Matches input role name against valid sport role definitions (case-insensitive with exact priority).
 */
export function normalizeRoleName(inputRole?: string | null, validRoles: string[] = []): string | null {
  if (!inputRole) return null;
  const clean = inputRole.trim().toLowerCase();

  // 1. Exact match
  for (const vr of validRoles) {
    if (vr.toLowerCase() === clean) return vr;
  }

  // 2. Prefix / substring match
  for (const vr of validRoles) {
    if (clean.includes(vr.toLowerCase()) || vr.toLowerCase().includes(clean)) {
      return vr;
    }
  }

  return null;
}

/**
 * Universal sport-role allocation algorithm on frontend.
 */
export function allocateEventParticipants(
  sportConfig: SportsRoleData,
  participants: any[] = [],
  eventCapacity: number = 32,
  eventId?: string,
  maxTeamsLimit?: number
): EventAllocationResult {
  const sportId = sportConfig.sport_id || 'S001';
  const sportName = sportConfig.sport || 'General Sport';
  const totalPlayersPerTeam = Math.max(1, Number(sportConfig.total_players ?? 1));

  // 1. Validation check
  const validation = validateSportConfig(sportConfig);
  if (!validation.isValid) {
    return {
      sport_id: sportId,
      sport: sportName,
      event_id: eventId,
      registered_count: participants.length,
      event_capacity: eventCapacity,
      total_players_per_team: totalPlayersPerTeam,
      completed_teams_count: 0,
      partial_teams_count: 0,
      waiting_players_count: participants.length,
      overall_readiness_pct: 0,
      teams: [],
      waiting_players: participants.map((p) => ({
        user_id: p.user_id || p.userId || p.$id || 'unknown',
        name: p.name || p.username || 'Athlete',
        username: p.username || 'athlete',
        avatar: p.avatar,
        selected_role: p.role || 'Athlete',
        reason: 'Invalid sport role configuration in database.',
        joined_at: p.joined_at || p.created_at || p.$createdAt,
      })),
      missing_roles_summary: [],
      role_remaining_space: {},
      config_status: 'INVALID_ROLE_CONFIGURATION',
      config_error: validation.errorMsg,
    };
  }

  // 2. Dynamic role template
  const roleTemplate = extractRoleDefinitions(sportConfig);
  const validRoleNames = roleTemplate.map((r) => r.role);

  // 3. Filter active participants & deterministic sort
  const activeParticipants = participants.filter((p) => {
    const status = (p.status || 'registered').toLowerCase();
    return status !== 'withdrawn' && status !== 'cancelled' && status !== 'removed' && status !== 'rejected';
  });

  activeParticipants.sort((a, b) => {
    const aDate = new Date(a.joined_at || a.created_at || a.$createdAt || 0).getTime();
    const bDate = new Date(b.joined_at || b.created_at || b.$createdAt || 0).getTime();
    if (aDate !== bDate) return aDate - bDate;
    const aId = String(a.user_id || a.userId || a.$id || '');
    const bId = String(b.user_id || b.userId || b.$id || '');
    return aId.localeCompare(bId);
  });

  const registeredCount = activeParticipants.length;

  // Max teams computation
  const teamCapacity = totalPlayersPerTeam;
  let computedMaxTeams = Math.max(1, Math.ceil(eventCapacity / teamCapacity));
  if (maxTeamsLimit) computedMaxTeams = Math.min(computedMaxTeams, maxTeamsLimit);

  // Factory to create a team with fresh per-team role counters
  const createTeam = (idx: number) => {
    const rolesMap: Record<string, RoleSlotDefinition> = {};
    for (const r of roleTemplate) {
      rolesMap[r.role] = {
        role_name: r.role,
        required_count: r.required,
        filled_count: 0,
        remaining_space: r.required,
        status: 'OPEN',
      };
    }
    return {
      team_index: idx,
      team_name: `Team ${idx}`,
      rolesMap,
      players: [] as AllocatedPlayer[],
      total_capacity: teamCapacity,
      current_players: 0,
      remaining_players: teamCapacity,
      is_complete: false,
      status: 'WAITING' as 'READY' | 'FORMING' | 'WAITING',
    };
  };

  const teamsInFormation = [createTeam(1)];
  const waitingPlayers: WaitingPlayer[] = [];

  // 4. Sequential deterministic placement
  for (const p of activeParticipants) {
    const rawRole = p.role || '';
    const matchedRole = normalizeRoleName(rawRole, validRoleNames);

    const userId = p.user_id || p.userId || p.$id || 'unknown';
    const userName = p.name || p.username || `Athlete ${userId.slice(0, 6)}`;
    const username = p.username || 'athlete';
    const avatar = p.avatar;
    const joinedAt = p.joined_at || p.created_at || p.$createdAt;

    let placed = false;

    if (matchedRole) {
      // Find earliest team with available slot for matched role
      for (const team of teamsInFormation) {
        if (team.current_players < team.total_capacity) {
          const slot = team.rolesMap[matchedRole];
          if (slot && slot.filled_count < slot.required_count) {
            slot.filled_count += 1;
            slot.remaining_space = Math.max(0, slot.required_count - slot.filled_count);
            slot.status = slot.remaining_space === 0 ? 'FULL' : 'PARTIAL';

            team.current_players += 1;
            team.remaining_players = Math.max(0, team.total_capacity - team.current_players);

            team.players.push({
              user_id: userId,
              name: userName,
              username,
              avatar,
              selected_role: matchedRole,
              assigned_team_index: team.team_index,
              assigned_role: matchedRole,
              joined_at: joinedAt,
              status: 'confirmed',
            });
            placed = true;
            break;
          }
        }
      }

      // If not placed and team capacity allows, open next team
      if (!placed && teamsInFormation.length < computedMaxTeams) {
        const nextTeamIdx = teamsInFormation.length + 1;
        const newTeam = createTeam(nextTeamIdx);
        const slot = newTeam.rolesMap[matchedRole];
        if (slot && slot.filled_count < slot.required_count) {
          slot.filled_count += 1;
          slot.remaining_space = Math.max(0, slot.required_count - slot.filled_count);
          slot.status = slot.remaining_space === 0 ? 'FULL' : 'PARTIAL';

          newTeam.current_players += 1;
          newTeam.remaining_players = Math.max(0, newTeam.total_capacity - newTeam.current_players);

          newTeam.players.push({
            user_id: userId,
            name: userName,
            username,
            avatar,
            selected_role: matchedRole,
            assigned_team_index: nextTeamIdx,
            assigned_role: matchedRole,
            joined_at: joinedAt,
            status: 'confirmed',
          });
          teamsInFormation.push(newTeam);
          placed = true;
        }
      }
    } else if (!rawRole) {
      // Unassigned role -> search any open slot
      for (const team of teamsInFormation) {
        if (team.current_players < team.total_capacity) {
          for (const [rName, slot] of Object.entries(team.rolesMap)) {
            if (slot.filled_count < slot.required_count) {
              slot.filled_count += 1;
              slot.remaining_space = Math.max(0, slot.required_count - slot.filled_count);
              slot.status = slot.remaining_space === 0 ? 'FULL' : 'PARTIAL';

              team.current_players += 1;
              team.remaining_players = Math.max(0, team.total_capacity - team.current_players);

              team.players.push({
                user_id: userId,
                name: userName,
                username,
                avatar,
                selected_role: rName,
                assigned_team_index: team.team_index,
                assigned_role: rName,
                joined_at: joinedAt,
                status: 'confirmed',
              });
              placed = true;
              break;
            }
          }
          if (placed) break;
        }
      }
    }

    if (!placed) {
      let reason = 'Waiting for teammates to complete required roles.';
      if (matchedRole) {
        reason = `Role '${matchedRole}' is currently full in active teams. Waiting for more athletes to join.`;
      } else if (teamsInFormation.length >= computedMaxTeams) {
        reason = 'Event capacity limit reached for active squad formations.';
      }

      waitingPlayers.push({
        user_id: userId,
        name: userName,
        username,
        avatar,
        selected_role: matchedRole || rawRole || 'Unassigned',
        reason,
        joined_at: joinedAt,
      });
    }
  }

  // 5. Finalize team structures & calculate remaining space
  const finalTeams: AllocatedTeam[] = [];
  let completedTeamsCount = 0;
  let partialTeamsCount = 0;
  const missingRolesSummary: MissingRoleSummary[] = [];
  const roleRemainingSpace: Record<string, number> = {};

  for (const r of roleTemplate) {
    roleRemainingSpace[r.role] = 0;
  }

  for (const t of teamsInFormation) {
    const rolesList: RoleSlotDefinition[] = [];
    let isAllRolesFilled = true;

    for (const [rName, slot] of Object.entries(t.rolesMap)) {
      rolesList.push(slot);
      if (slot.remaining_space > 0) {
        isAllRolesFilled = false;
        if (t.current_players > 0) {
          missingRolesSummary.push({
            team_index: t.team_index,
            team_name: t.team_name,
            role_name: rName,
            needed_count: slot.remaining_space,
          });
          roleRemainingSpace[rName] = (roleRemainingSpace[rName] || 0) + slot.remaining_space;
        }
      }
    }

    const isComplete = t.current_players === t.total_capacity && isAllRolesFilled;
    let teamStatus: 'READY' | 'FORMING' | 'WAITING' = 'WAITING';

    if (isComplete) {
      teamStatus = 'READY';
      completedTeamsCount += 1;
    } else if (t.current_players > 0) {
      teamStatus = 'FORMING';
      partialTeamsCount += 1;
    } else {
      teamStatus = 'WAITING';
      if (t.team_index === 1) {
        for (const [rName, slot] of Object.entries(t.rolesMap)) {
          roleRemainingSpace[rName] = slot.required_count;
        }
      }
    }

    if (t.current_players > 0 || t.team_index === 1) {
      finalTeams.push({
        team_index: t.team_index,
        team_name: t.team_name,
        roles: rolesList,
        players: t.players,
        total_capacity: t.total_capacity,
        current_players: t.current_players,
        remaining_players: t.remaining_players,
        is_complete: isComplete,
        status: teamStatus,
      });
    }
  }

  // 6. Overall readiness percentage
  const activeTeams = finalTeams.filter((t) => t.current_players > 0);
  let overallReadinessPct = 0;
  if (activeTeams.length > 0) {
    const totalTarget = activeTeams.reduce((sum, t) => sum + t.total_capacity, 0);
    const totalPlaced = activeTeams.reduce((sum, t) => sum + t.current_players, 0);
    overallReadinessPct = Number(((totalPlaced / totalTarget) * 100).toFixed(2));
  }

  return {
    sport_id: sportId,
    sport: sportName,
    event_id: eventId,
    registered_count: registeredCount,
    event_capacity: eventCapacity,
    total_players_per_team: totalPlayersPerTeam,
    completed_teams_count: completedTeamsCount,
    partial_teams_count: partialTeamsCount,
    waiting_players_count: waitingPlayers.length,
    overall_readiness_pct: overallReadinessPct,
    teams: finalTeams,
    waiting_players: waitingPlayers,
    missing_roles_summary: missingRolesSummary,
    role_remaining_space: roleRemainingSpace,
    config_status: 'VALID',
    config_error: null,
  };
}
