/**
 * eventReadinessService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * React Native mobile client service for Event AutoSquad Readiness & Universal Role Allocation.
 */

import { account, databases, Query, DATABASE_ID, COLLECTIONS } from '../api/appwrite';
import { getSportRoleDataSync, OFFICIAL_SPORTIX_SPORTS_ROLES } from './sportsRoleService';
import { allocateEventParticipants, type EventAllocationResult } from './roleAllocationEngine';

export interface EventReadinessData {
  event_id: string;
  sport: string;
  sport_id?: string;
  format: string;
  eligible_count: number;
  min_required: number;
  max_participants: number;
  is_autosquad_ready: boolean;
  readiness_state: 'WAITING_FOR_PLAYERS' | 'AUTOSQUAD_READY' | 'SQUAD_FORMING' | 'SQUAD_READY' | 'FULL';
  matching_state: string;
  target_squad_size: number;
  matched_players: number;
  remaining_needed: number;
  user_team_index?: number | null;
  user_role_assignment?: string | null;
  user_is_waiting?: boolean;
  user_waiting_reason?: string | null;
  allocation?: EventAllocationResult;
}

export async function getEventReadiness(eventId: string, currentUserId?: string): Promise<EventReadinessData> {
  try {
    const eventDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.EVENTS, eventId).catch(() => null);
    const sport = eventDoc?.sport || 'Football';
    const format = eventDoc?.format || 'team';
    const maxParts = Number(eventDoc?.max_participants || 32);

    const parts = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.EVENT_PARTICIPANTS,
      [Query.equal('event_id', eventId), Query.limit(200)]
    ).catch(() => ({ total: 0, documents: [] }));

    const documents = parts.documents || [];
    const eligibleCount = documents.filter((p: any) => {
      const s = (p.status || 'registered').toLowerCase();
      return s !== 'withdrawn' && s !== 'cancelled' && s !== 'removed';
    }).length;

    const isReady = eligibleCount >= 10;

    const sportConfig = getSportRoleDataSync(sport) || OFFICIAL_SPORTIX_SPORTS_ROLES[0];
    const targetSize = Number(sportConfig.total_players || 11);

    const allocation = allocateEventParticipants(sportConfig, documents, maxParts, eventId);

    let userTeamIndex: number | null = null;
    let userRoleAssignment: string | null = null;
    let userIsWaiting = false;
    let userWaitingReason: string | null = null;

    if (currentUserId) {
      for (const t of allocation.teams) {
        for (const pl of t.players) {
          if (pl.user_id === currentUserId) {
            userTeamIndex = t.team_index;
            userRoleAssignment = pl.assigned_role;
            break;
          }
        }
        if (userTeamIndex !== null) break;
      }

      if (userTeamIndex === null) {
        const wp = allocation.waiting_players.find((w) => w.user_id === currentUserId);
        if (wp) {
          userIsWaiting = true;
          userWaitingReason = wp.reason;
        }
      }
    }

    const matchedPlayers = userTeamIndex
      ? allocation.teams.find((t) => t.team_index === userTeamIndex)?.current_players || 1
      : allocation.teams[0]?.current_players || 0;

    const remainingNeeded = userTeamIndex
      ? allocation.teams.find((t) => t.team_index === userTeamIndex)?.remaining_players || 0
      : allocation.teams[0]?.remaining_players || targetSize;

    return {
      event_id: eventId,
      sport,
      sport_id: sportConfig.sport_id,
      format,
      eligible_count: eligibleCount,
      min_required: 10,
      max_participants: maxParts,
      is_autosquad_ready: isReady,
      readiness_state: eligibleCount >= maxParts ? 'FULL' : isReady ? 'AUTOSQUAD_READY' : 'WAITING_FOR_PLAYERS',
      matching_state: isReady ? 'AUTOSQUAD_READY' : 'WAITING_FOR_PLAYERS',
      target_squad_size: targetSize,
      matched_players: matchedPlayers,
      remaining_needed: remainingNeeded,
      user_team_index: userTeamIndex,
      user_role_assignment: userRoleAssignment,
      user_is_waiting: userIsWaiting,
      user_waiting_reason: userWaitingReason,
      allocation,
    };
  } catch (e) {
    console.error('[EventReadinessService] Fallback error:', e);
    const fallbackConfig = OFFICIAL_SPORTIX_SPORTS_ROLES[0];
    return {
      event_id: eventId,
      sport: 'Football',
      sport_id: 'S001',
      format: 'team',
      eligible_count: 0,
      min_required: 10,
      max_participants: 32,
      is_autosquad_ready: false,
      readiness_state: 'WAITING_FOR_PLAYERS',
      matching_state: 'WAITING_FOR_PLAYERS',
      target_squad_size: 11,
      matched_players: 0,
      remaining_needed: 11,
      allocation: allocateEventParticipants(fallbackConfig, [], 32, eventId),
    };
  }
}

export async function updateParticipantRole(eventId: string, newRole: string): Promise<{ success: boolean; message?: string }> {
  try {
    const user = await account.get();
    const parts = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.EVENT_PARTICIPANTS,
      [Query.equal('event_id', eventId), Query.equal('user_id', user.$id), Query.limit(1)]
    );

    if (parts.documents && parts.documents.length > 0) {
      const docId = parts.documents[0].$id;
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.EVENT_PARTICIPANTS, docId, {
        selected_role: newRole,
        role: newRole,
      });
      return { success: true };
    }
    return { success: false, message: 'Participant record not found' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Could not update role' };
  }
}
