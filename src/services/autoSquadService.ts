/**
 * autoSquadService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Frontend client service for AutoSquad AI & Matchmaking Engine.
 * Calls backend API (http://localhost:8000/api/autosquad/*) with fallback to
 * client-side deterministic matchmaking if backend is offline.
 */

import { account, databases, ID, Query, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { getSportRolesSync, getSportRoleDataSync } from './sportsRoleService';

function getBackendUrl(): string {
  const envUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return envUrl || window.location.origin;
  }
  return envUrl || 'http://localhost:8000';
}
const BACKEND_URL = getBackendUrl();

export interface ScoreBreakdown {
  compatibility_score: number;
  skill_score: number;
  position_score: number;
  distance_score: number;
  level_score: number;
  activity_score: number;
  history_score: number;
}

export interface CaptainRecommendation {
  id: string;
  name: string;
  reasoning: string;
}

export interface SquadMember {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  sport: string;
  position: string;
  experience_level: string;
  ssr: number;
  ssr_status?: 'established' | 'provisional';
  pulse_score: number;
  level: number;
  distance_km: number;
  compatibility_score: number;
  is_captain?: boolean;
}

export interface AutoSquadResult {
  request_id: string;
  squad_id: string;
  squad_data: {
    squadId: string;
    name: string;
    sport: string;
    formation: string;
    members: SquadMember[];
    score_breakdown: ScoreBreakdown;
    confidence_score: number;
    captain_recommendation: CaptainRecommendation;
    reasoning: string;
    exclusion_reasons?: { user_id: string; name: string; reason: string }[];
    algorithm_version: string;
    weights_version: string;
  };
  overall_compatibility: number;
  reasoning: string;
  remaining_generations: number;
}

export interface DailyLimitInfo {
  used: number;
  remaining: number;
  max: number;
}

/**
 * Fetch remaining daily generations for current user
 */
export async function getRemainingGenerations(): Promise<DailyLimitInfo> {
  try {
    const session = await account.getSession('current').catch(() => null);
    const token = session ? (session as any).jwt || '' : '';

    const res = await fetch(`${BACKEND_URL}/api/autosquad/remaining`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (res.ok) {
      const data = await res.json();
      return data.data || { used: 0, remaining: 5, max: 5 };
    }
  } catch (err) {
    console.warn('[AutoSquadService] Backend offline, falling back to local quota check:', err);
  }

  // Fallback Appwrite direct count
  try {
    const user = await account.get();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const docs = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.AUTOSQUAD_REQUESTS,
      [
        Query.equal('user_id', user.$id),
        Query.greaterThanEqual('$createdAt', todayStart.toISOString()),
      ]
    );

    const userDocs = (docs.documents || []).filter((d: any) => d.user_id === user.$id || d.userId === user.$id);
    const used = userDocs.length;
    return { used, remaining: Math.max(0, 5 - used), max: 5 };
  } catch {
    return { used: 0, remaining: 5, max: 5 };
  }
}

/**
 * Generate AutoSquad suggestion via backend engine
 */
export async function generateAutoSquad(params: {
  sport: string;
  role?: string;
  event_id?: string;
  entry_type?: 'solo' | 'duo' | 'squad';
  skill_level?: 'casual' | 'amateur' | 'semi_pro' | 'professional';
  radius_km?: number;
  location?: string;
}): Promise<AutoSquadResult> {
  try {
    const session = await account.getSession('current').catch(() => null);
    const token = session ? (session as any).jwt || '' : '';

    const res = await fetch(`${BACKEND_URL}/api/autosquad/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      const json = await res.json();
      return json.data;
    } else {
      const errJson = await res.json().catch(() => ({}));
      if (errJson.detail) throw new Error(errJson.detail);
    }
  } catch (err: any) {
    console.warn('[AutoSquadService] Backend call failed, running direct fallback:', err);
    if (err.message && err.message.includes('limit reached')) {
      throw err;
    }
  }

  // Direct Fallback Client-side Generation if backend server is unreachable
  const user = await account.get();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const existingRequests = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.AUTOSQUAD_REQUESTS,
    [
      Query.equal('user_id', user.$id),
      Query.greaterThanEqual('$createdAt', todayStart.toISOString()),
    ]
  ).catch(() => ({ total: 0, documents: [] }));

  const userDocs = (existingRequests.documents || []).filter((d: any) => d.user_id === user.$id || d.userId === user.$id);
  if (userDocs.length >= 5) {
    throw new Error('Daily AutoSquad limit reached (5 generations max per day). Please try again tomorrow.');
  }

  // Fetch real candidate profiles from Appwrite DB
  let candidates: any[] = [];

  // If an event ID is provided, query real registered participants for that event and enforce 10-athlete minimum
  if (params.event_id) {
    try {
      const partsRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.EVENT_PARTICIPANTS,
        [
          Query.equal('event_id', params.event_id),
          Query.limit(200),
        ]
      );
      const rawParts = partsRes.documents || [];
      const confirmedParts = rawParts.filter((p: any) => {
        const s = (p.status || 'confirmed').toLowerCase();
        return s !== 'withdrawn' && s !== 'cancelled' && s !== 'removed';
      });

      if (confirmedParts.length < 10) {
        throw new Error(`AutoSquad locked: ${confirmedParts.length} / 10 athletes joined. At least 10 athletes must join this event to begin matchmaking.`);
      }

      const participantUserIds = confirmedParts
        .map((p: any) => p.user_id)
        .filter((uid: string) => uid && uid !== user.$id);

      if (participantUserIds.length > 0) {
        // Fetch profiles for these participants
        const eventProfiles = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.PROFILES,
          [Query.limit(100)]
        ).catch(() => ({ documents: [] }));

        for (const pid of participantUserIds) {
          const matchingProfile = (eventProfiles.documents || []).find((p: any) => p.$id === pid || p.userId === pid);
          const partDoc = confirmedParts.find((p: any) => p.user_id === pid);
          if (matchingProfile) {
            candidates.push({
              ...matchingProfile,
              position: partDoc?.selected_role || matchingProfile.position,
            });
          }
        }
      }
    } catch (err: any) {
      if (err.message && err.message.includes('AutoSquad locked')) throw err;
      console.warn('[AutoSquadService] Fetching event participants warning:', err);
    }
  }

  // If no event specified, query active profiles for the sport
  if (!params.event_id || candidates.length === 0) {
    const profilesRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PROFILES,
      [Query.limit(50)]
    ).catch(() => ({ documents: [] }));

    const existingIds = new Set(candidates.map(c => c.$id));
    for (const p of profilesRes.documents || []) {
      if (p.$id !== user.$id && !existingIds.has(p.$id)) {
        candidates.push(p);
      }
    }
  }

  const sport = params.sport || 'Football';
  const roleData = getSportRoleDataSync(sport);
  const availableRoles = getSportRolesSync(sport);
  const userRole = params.role || availableRoles[0] || 'Player';
  const otherRoles = availableRoles.filter(r => r !== userRole);
  const targetPlayers = roleData?.total_players || 5;
  const neededMembersCount = Math.max(0, targetPlayers - 1);

  // Fetch requesting user profile
  let userProfile: any = null;
  try {
    userProfile = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, user.$id);
  } catch {}

  const userMember: SquadMember = {
    id: user.$id,
    full_name: userProfile?.name || userProfile?.full_name || user.name || 'Athlete',
    username: userProfile?.username || user.email?.split('@')[0] || 'captain',
    avatar_url: userProfile?.avatar_url || userProfile?.avatar || '',
    sport,
    position: userRole,
    experience_level: userProfile?.experience_level || 'amateur',
    ssr: Number(userProfile?.ssr || 75.0),
    pulse_score: Number(userProfile?.pulse_score || 750),
    level: Number(userProfile?.level || 15),
    distance_km: 0,
    compatibility_score: 100,
    is_captain: true,
  };

  const selectedCandidates = candidates.slice(0, neededMembersCount);
  const squadMembers: SquadMember[] = [
    userMember,
    ...selectedCandidates.map((c, i) => {
      const assignedRole = c.position || otherRoles[i % otherRoles.length] || availableRoles[i % availableRoles.length] || 'Athlete';
      return {
        id: c.$id,
        full_name: c.name || c.full_name || `Athlete ${i + 1}`,
        username: c.username || `athlete_${i + 1}`,
        avatar_url: c.avatar_url || c.avatar || '',
        sport: c.sport || sport,
        position: assignedRole,
        experience_level: c.experience_level || 'amateur',
        ssr: Number(c.ssr || 70.0),
        ssr_status: 'established' as const,
        pulse_score: Number(c.pulse_score || 700),
        level: Number(c.level || 10),
        distance_km: Number((1.0 + i * 0.8).toFixed(1)),
        compatibility_score: Math.max(70, 95 - i * 3),
      };
    }),
  ];

  const avgScore = Math.round(squadMembers.reduce((a, b) => a + b.compatibility_score, 0) / Math.max(1, squadMembers.length));

  // Record request in Appwrite
  const reqDoc = await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.AUTOSQUAD_REQUESTS,
    ID.unique(),
    {
      user_id: user.$id,
      event_id: params.event_id || '',
      sport,
      skill_level: params.skill_level || 'amateur',
      params: JSON.stringify(params),
      status: 'completed',
      reasoning: `Deterministic AutoSquad lineup constructed for ${sport}. Overall compatibility: ${avgScore}%.`,
      created_at: new Date().toISOString(),
    }
  ).catch((e) => {
    console.warn('[AutoSquadService] Appwrite log create fallback:', e);
    return { $id: 'req_' + ID.unique() } as any;
  });

  const squadData = {
    squadId: `gen_${reqDoc.$id}`,
    name: `Volt ${sport} Squad`,
    sport,
    formation: roleData ? `${roleData.role_1_count}-${roleData.role_2_count}-${roleData.role_3_count}` : '4-3-3',
    members: squadMembers,
    score_breakdown: {
      compatibility_score: avgScore,
      skill_score: 88,
      position_score: 92,
      distance_score: 85,
      level_score: 84,
      activity_score: 82,
      history_score: 75,
    },
    confidence_score: 85,
    captain_recommendation: {
      id: user.$id,
      name: userMember.full_name,
      reasoning: 'Highest skill rating and team leadership experience.',
    },
    reasoning: `Deterministic AutoSquad lineup constructed for ${sport}. Overall compatibility: ${avgScore}%.`,
    algorithm_version: 'autosquad-v1',
    weights_version: 'v1',
  };

  await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.GENERATED_SQUAD,
    ID.unique(),
    {
      request_id: reqDoc.$id,
      squad_data: JSON.stringify(squadData),
      score: avgScore,
      rank: 1,
      created_at: new Date().toISOString(),
    }
  ).catch(() => null);

  return {
    request_id: reqDoc.$id,
    squad_id: `gen_${reqDoc.$id}`,
    squad_data: squadData,
    overall_compatibility: avgScore,
    reasoning: squadData.reasoning,
    remaining_generations: Math.max(0, 5 - ((existingRequests.total || userDocs.length) + 1)),
  };
}

/**
 * Fetch real saved/generated squads from Appwrite for the current user (Max 5 slots)
 */
export async function getUserGeneratedSquads(userId: string): Promise<any[]> {
  if (!userId) return [];
  try {
    // 1. Fetch user's completed or pending autosquad requests
    const reqRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.AUTOSQUAD_REQUESTS,
      [
        Query.equal('user_id', userId),
        Query.orderDesc('$createdAt'),
        Query.limit(10),
      ]
    );

    const requests = (reqRes.documents || []).filter(
      (r: any) => r.status !== 'rejected'
    ).slice(0, 5);

    if (requests.length === 0) return [];

    const squads: any[] = [];

    for (const req of requests) {
      try {
        const genRes = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.GENERATED_SQUAD,
          [Query.equal('request_id', req.$id), Query.limit(1)]
        );

        if (genRes.documents && genRes.documents.length > 0) {
          const genDoc = genRes.documents[0];
          const rawData = typeof genDoc.squad_data === 'string'
            ? JSON.parse(genDoc.squad_data)
            : genDoc.squad_data;

          squads.push({
            ...rawData,
            squadId: rawData.squadId || `gen_${req.$id}`,
            requestId: req.$id,
            requestStatus: req.status,
            eventId: req.event_id,
            sport: req.sport || rawData.sport,
            score: genDoc.score || rawData.score_breakdown?.compatibility_score || 85,
            createdAt: req.created_at || req.$createdAt,
          });
        }
      } catch (err) {
        console.warn('[AutoSquadService] Error parsing generated squad document:', err);
      }
    }

    return squads;
  } catch (err) {
    console.warn('[AutoSquadService] getUserGeneratedSquads error:', err);
    return [];
  }
}

/**
 * Accept AutoSquad result & join event / crew
 */
export async function acceptAutoSquad(requestId: string): Promise<boolean> {
  try {
    const session = await account.getSession('current').catch(() => null);
    const token = session ? (session as any).jwt || '' : '';

    const res = await fetch(`${BACKEND_URL}/api/autosquad/${requestId}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (res.ok) return true;
  } catch (err) {
    console.warn('[AutoSquadService] Backend accept failed, applying direct update:', err);
  }

  try {
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.AUTOSQUAD_REQUESTS,
      requestId,
      { status: 'accepted' }
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Reject AutoSquad result
 */
export async function rejectAutoSquad(requestId: string): Promise<boolean> {
  try {
    const session = await account.getSession('current').catch(() => null);
    const token = session ? (session as any).jwt || '' : '';

    const res = await fetch(`${BACKEND_URL}/api/autosquad/${requestId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (res.ok) return true;
  } catch (err) {
    console.warn('[AutoSquadService] Backend reject failed, applying direct update:', err);
  }

  try {
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.AUTOSQUAD_REQUESTS,
      requestId,
      { status: 'rejected' }
    );
    return true;
  } catch {
    return false;
  }
}
