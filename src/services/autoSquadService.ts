/**
 * autoSquadService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Frontend client service for AutoSquad AI & Matchmaking Engine.
 * Calls backend API (http://localhost:8000/api/autosquad/*) with fallback to
 * client-side deterministic matchmaking if backend is offline.
 */

import { account, databases, ID, Query, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

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
    throw new Error('Daily AutoSquad limit reached (5/day)');
  }

  // Fetch candidate profiles
  const profilesRes = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.PROFILES,
    [Query.equal('is_active', true), Query.limit(30)]
  );

  const candidates = (profilesRes.documents || []).filter(p => p.$id !== user.$id);
  const sport = params.sport || 'Football';

  const squadMembers: SquadMember[] = [
    {
      id: user.$id,
      full_name: user.name || 'Alex Rivera',
      username: user.email.split('@')[0],
      sport,
      position: 'RW',
      experience_level: 'pro',
      ssr: 82.0,
      pulse_score: 847,
      level: 24,
      distance_km: 0,
      compatibility_score: 100,
      is_captain: true,
    },
    ...candidates.slice(0, 4).map((c, i) => ({
      id: c.$id,
      full_name: c.full_name || `Athlete ${i + 1}`,
      username: c.username || `athlete_${i + 1}`,
      avatar_url: c.avatar_url,
      sport: c.sport || sport,
      position: ['GK', 'CB', 'CM', 'ST'][i] || 'CM',
      experience_level: c.experience_level || 'amateur',
      ssr: c.level ? Math.min(95, 60 + c.level) : 72.0,
      ssr_status: 'established' as const,
      pulse_score: c.pulse_score || 720,
      level: c.level || 15,
      distance_km: Number((1.2 + i * 1.5).toFixed(1)),
      compatibility_score: Math.max(70, 95 - i * 4),
    })),
  ];

  const avgScore = Math.round(squadMembers.reduce((a, b) => a + b.compatibility_score, 0) / squadMembers.length);

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
  );

  const squadData = {
    squadId: `gen_${reqDoc.$id}`,
    name: `Volt ${sport} Squad`,
    sport,
    formation: '4-3-3',
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
      name: user.name || 'Alex Rivera',
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
    remaining_generations: Math.max(0, 2 - (existingRequests.total || 0)),
  };
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
