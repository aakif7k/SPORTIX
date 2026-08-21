/**
 * roleAllocationEngine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * SPORTiX Universal All-Sport Role Slot + Team/Group Generation Engine for React Native.
 * 100% Sport-Agnostic, dynamic allocation driven by sportix_sport_roles.
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

  if (storedTotal === 1 && calculatedTotal >= 1) {
    return { isValid: true, errorMsg: null, calculatedTotal, storedTotal };
  }

  if (calculatedTotal > 0 && calculatedTotal !== storedTotal && storedTotal > 1) {
    const errorMsg = `INVALID_ROLE_CONFIGURATION for ${sportId} (${sportName}): sum of role counts (${calculatedTotal}) does not match total_players (${storedTotal})`;
    return { isValid: false, errorMsg, calculatedTotal, storedTotal };
  }

  return { isValid: true, errorMsg: null, calculatedTotal, storedTotal };
}

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

export function normalizeRoleName(inputRole?: string | null, validRoles: string[] = []): string | null {
  if (!inputRole) return null;
  const clean = inputRole.trim().toLowerCase();

  for (const vr of validRoles) {
    if (vr.toLowerCase() === clean) return vr;
  }

  for (const vr of validRoles) {
    if (clean.includes(vr.toLowerCase()) || vr.toLowerCase().includes(clean)) {
      return vr;
    }
  }

  return null;
}

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

  const roleTemplate = extractRoleDefinitions(sportConfig);
  const validRoleNames = roleTemplate.map((r) => r.role);

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
  const teamCapacity = totalPlayersPerTeam;
  let computedMaxTeams = Math.max(1, Math.ceil(eventCapacity / teamCapacity));
  if (maxTeamsLimit) computedMaxTeams = Math.min(computedMaxTeams, maxTeamsLimit);

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
      const reason = matchedRole
        ? `Capacity reached for ${matchedRole} across active teams (${teamsInFormation.length}/${computedMaxTeams} teams).`
        : `Role "${rawRole || 'Unassigned'}" is invalid for ${sportName}.`;

      waitingPlayers.push({
        user_id: userId,
        name: userName,
        username,
        avatar,
        selected_role: rawRole || 'Unassigned',
        reason,
        joined_at: joinedAt,
      });
    }
  }

  const finalTeams: AllocatedTeam[] = teamsInFormation.map((t) => {
    const isComplete = t.current_players === t.total_capacity;
    const status: 'READY' | 'FORMING' | 'WAITING' = isComplete
      ? 'READY'
      : t.current_players > 0
      ? 'FORMING'
      : 'WAITING';

    const rolesList: RoleSlotDefinition[] = roleTemplate.map((r) => {
      const s = t.rolesMap[r.role];
      return {
        role_name: r.role,
        required_count: s ? s.required_count : r.required,
        filled_count: s ? s.filled_count : 0,
        remaining_space: s ? s.remaining_space : r.required,
        status: s ? s.status : 'OPEN',
      };
    });

    return {
      team_index: t.team_index,
      team_name: t.team_name,
      roles: rolesList,
      players: t.players,
      total_capacity: t.total_capacity,
      current_players: t.current_players,
      remaining_players: t.remaining_players,
      is_complete: isComplete,
      status,
    };
  });

  const completedTeamsCount = finalTeams.filter((t) => t.is_complete).length;
  const partialTeamsCount = finalTeams.filter((t) => !t.is_complete && t.current_players > 0).length;

  const missingRolesSummary: MissingRoleSummary[] = [];
  for (const team of finalTeams) {
    if (!team.is_complete) {
      for (const slot of team.roles) {
        if (slot.remaining_space > 0) {
          missingRolesSummary.push({
            team_index: team.team_index,
            team_name: team.team_name,
            role_name: slot.role_name,
            needed_count: slot.remaining_space,
          });
        }
      }
    }
  }

  const roleRemainingSpace: Record<string, number> = {};
  for (const r of roleTemplate) {
    let sumRemaining = 0;
    for (const team of finalTeams) {
      const s = team.roles.find((x) => x.role_name === r.role);
      if (s) sumRemaining += s.remaining_space;
    }
    roleRemainingSpace[r.role] = sumRemaining;
  }

  const activeTeamsCount = Math.max(1, finalTeams.filter((t) => t.current_players > 0).length);
  const activeTeamsTotalTarget = activeTeamsCount * totalPlayersPerTeam;
  const activeTeamsFilledPlayers = finalTeams.reduce((sum, t) => sum + t.current_players, 0);

  const overallReadinessPct = activeTeamsTotalTarget > 0
    ? Math.min(100, Math.round((activeTeamsFilledPlayers / activeTeamsTotalTarget) * 100))
    : 0;

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
