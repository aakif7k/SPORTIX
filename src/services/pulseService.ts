/**
 * pulseService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Frontend service for querying, updating, and syncing Appwrite `pulse_scores`
 * collection and `profiles.pulse_score` with live Realtime subscription.
 */

import { databases, client, ID, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite';
import type { PulseScore } from '@/types/pulse.types';

export interface PulseScoreRecord {
  $id?: string;
  user_id: string;
  total_pulse: number;
  match_performance: number;
  consistency: number;
  team_chemistry: number;
  reliability: number;
  activity: number;
  leadership: number;
  tier: 'contender' | 'elite' | 'pulse_elite';
  created_at?: string;
  updated_at?: string;
}

function calculateTier(score: number): 'CONTENDER' | 'ELITE' | 'PULSE ELITE' {
  if (score >= 900) return 'PULSE ELITE';
  if (score >= 800) return 'ELITE';
  return 'CONTENDER';
}

function toAppwriteTier(tier: 'CONTENDER' | 'ELITE' | 'PULSE ELITE'): 'contender' | 'elite' | 'pulse_elite' {
  switch (tier) {
    case 'PULSE ELITE': return 'pulse_elite';
    case 'ELITE': return 'elite';
    default: return 'contender';
  }
}

function fromAppwriteTier(tier: string | undefined): 'CONTENDER' | 'ELITE' | 'PULSE ELITE' {
  if (!tier) return 'CONTENDER';
  const clean = tier.toLowerCase().replace(/[^a-z]/g, '');
  if (clean === 'pulseelite' || clean === 'pulse_elite') return 'PULSE ELITE';
  if (clean === 'elite') return 'ELITE';
  return 'CONTENDER';
}

/**
 * Fetch the user's pulse_scores record from Appwrite.
 * If record does not exist yet, initializes it from profile or default.
 */
export async function getPulseScore(userId: string): Promise<PulseScore> {
  if (!userId) {
    return {
      userId: '',
      score: 100,
      tier: 'CONTENDER',
      breakdown: { matchPerf: 0, consistency: 0, chemistry: 0, reliability: 0, activity: 0, leadership: 0 },
      history: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PULSE_SCORES,
      [Query.equal('user_id', userId), Query.limit(1)]
    );

    if (res.documents && res.documents.length > 0) {
      const doc = res.documents[0] as any;
      const score = Math.round(Number(doc.total_pulse ?? 100));
      const tier = fromAppwriteTier(doc.tier);

      // Fetch history if available
      let historyItems: any[] = [];
      try {
        const histRes = await databases.listDocuments(
          DATABASE_ID,
          'pulse_history',
          [Query.equal('user_id', userId), Query.orderDesc('created_at'), Query.limit(10)]
        );
        historyItems = histRes.documents.map((h: any) => ({
          date: (h.created_at || h.$createdAt || '').split('T')[0],
          score: Math.round(Number(h.score_after ?? score)),
          delta: Number(h.delta ?? 0),
          matchId: h.reference_id || h.$id,
        }));
      } catch {}

      return {
        userId,
        score,
        tier,
        breakdown: {
          matchPerf: Math.round(Number(doc.match_performance ?? 0)),
          consistency: Math.round(Number(doc.consistency ?? 0)),
          chemistry: Math.round(Number(doc.team_chemistry ?? 0)),
          reliability: Math.round(Number(doc.reliability ?? 0)),
          activity: Math.round(Number(doc.activity ?? 0)),
          leadership: Math.round(Number(doc.leadership ?? 0)),
        },
        history: historyItems.length > 0 ? historyItems : [
          { date: new Date().toISOString().split('T')[0], score, delta: 0, matchId: 'init' }
        ],
        lastUpdated: doc.updated_at || doc.$updatedAt || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn('[pulseService] Error fetching pulse_scores from Appwrite:', err);
  }

  // Fallback: Check profile pulse_score and create initial pulse_scores document
  let profilePulse = 100;
  try {
    const profileDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, userId);
    if (profileDoc && profileDoc.pulse_score != null) {
      profilePulse = Number(profileDoc.pulse_score);
    }
  } catch {}

  // Create initial document in pulse_scores collection
  try {
    const nowIso = new Date().toISOString();
    await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.PULSE_SCORES,
      ID.unique(),
      {
        user_id: userId,
        total_pulse: profilePulse,
        match_performance: 0,
        consistency: 0,
        team_chemistry: 0,
        reliability: 0,
        activity: 0,
        leadership: 0,
        tier: toAppwriteTier(calculateTier(profilePulse)),
        created_at: nowIso,
        updated_at: nowIso,
      }
    );
  } catch (createErr) {
    console.warn('[pulseService] Error initializing pulse_scores record:', createErr);
  }

  return {
    userId,
    score: profilePulse,
    tier: calculateTier(profilePulse),
    breakdown: { matchPerf: 0, consistency: 0, chemistry: 0, reliability: 0, activity: 0, leadership: 0 },
    history: [{ date: new Date().toISOString().split('T')[0], score: profilePulse, delta: 0, matchId: 'init' }],
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Update pulse score and sub-scores in Appwrite pulse_scores collection,
 * synchronize profiles.pulse_score, and log to pulse_history.
 */
export async function updatePulseScore(
  userId: string,
  deltas: {
    matchPerf?: number;
    consistency?: number;
    chemistry?: number;
    reliability?: number;
    activity?: number;
    leadership?: number;
  },
  totalDelta: number,
  reason: string = 'Pulse Activity'
): Promise<PulseScore> {
  if (!userId) {
    throw new Error('User ID is required to update pulse score.');
  }

  const nowIso = new Date().toISOString();
  let existingDocId: string | null = null;
  let currentTotal = 100;
  let currentBreakdown = {
    matchPerf: 0,
    consistency: 0,
    chemistry: 0,
    reliability: 0,
    activity: 0,
    leadership: 0,
  };

  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PULSE_SCORES,
      [Query.equal('user_id', userId), Query.limit(1)]
    );
    if (res.documents && res.documents.length > 0) {
      const doc = res.documents[0] as any;
      existingDocId = doc.$id;
      currentTotal = Number(doc.total_pulse ?? 100);
      currentBreakdown = {
        matchPerf: Number(doc.match_performance ?? 0),
        consistency: Number(doc.consistency ?? 0),
        chemistry: Number(doc.team_chemistry ?? 0),
        reliability: Number(doc.reliability ?? 0),
        activity: Number(doc.activity ?? 0),
        leadership: Number(doc.leadership ?? 0),
      };
    }
  } catch {}

  const newTotal = Math.max(0, Math.min(1000, Math.round(currentTotal + totalDelta)));
  const newBreakdown = {
    matchPerf: Math.max(0, Math.min(100, Math.round(currentBreakdown.matchPerf + (deltas.matchPerf || 0)))),
    consistency: Math.max(0, Math.min(100, Math.round(currentBreakdown.consistency + (deltas.consistency || 0)))),
    chemistry: Math.max(0, Math.min(100, Math.round(currentBreakdown.chemistry + (deltas.chemistry || 0)))),
    reliability: Math.max(0, Math.min(100, Math.round(currentBreakdown.reliability + (deltas.reliability || 0)))),
    activity: Math.max(0, Math.min(100, Math.round(currentBreakdown.activity + (deltas.activity || 0)))),
    leadership: Math.max(0, Math.min(100, Math.round(currentBreakdown.leadership + (deltas.leadership || 0)))),
  };
  const newTier = calculateTier(newTotal);

  const payload = {
    user_id: userId,
    total_pulse: newTotal,
    match_performance: newBreakdown.matchPerf,
    consistency: newBreakdown.consistency,
    team_chemistry: newBreakdown.chemistry,
    reliability: newBreakdown.reliability,
    activity: newBreakdown.activity,
    leadership: newBreakdown.leadership,
    tier: toAppwriteTier(newTier),
    updated_at: nowIso,
  };

  // 1. Update or create in pulse_scores
  if (existingDocId) {
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.PULSE_SCORES, existingDocId, payload);
    } catch (err) {
      console.error('[pulseService] Failed to update pulse_scores doc:', err);
    }
  } else {
    try {
      await databases.createDocument(DATABASE_ID, COLLECTIONS.PULSE_SCORES, ID.unique(), {
        ...payload,
        created_at: nowIso,
      });
    } catch (err) {
      console.error('[pulseService] Failed to create pulse_scores doc:', err);
    }
  }

  // 2. Synchronize profiles.pulse_score
  try {
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.PROFILES, userId, {
      pulse_score: newTotal,
      updated_at: nowIso,
    });
  } catch (err) {
    console.warn('[pulseService] Failed to sync profile pulse_score:', err);
  }

  // 3. Log to pulse_history
  try {
    await databases.createDocument(DATABASE_ID, 'pulse_history', ID.unique(), {
      user_id: userId,
      delta: totalDelta,
      source: 'pulse_update',
      reason,
      score_after: newTotal,
      reference_id: `upd_${Date.now()}`,
      created_at: nowIso,
      updated_at: nowIso,
    });
  } catch (histErr) {
    console.warn('[pulseService] Failed to create pulse_history record:', histErr);
  }

  return {
    userId,
    score: newTotal,
    tier: newTier,
    breakdown: newBreakdown,
    history: [],
    lastUpdated: nowIso,
  };
}

/**
 * Subscribe to realtime updates on pulse_scores for immediate reflection when edited in Appwrite.
 */
export function subscribeToPulseScore(
  userId: string,
  onUpdate: (updatedScore: PulseScore) => void
): () => void {
  if (!userId) return () => {};

  const channel = `databases.${DATABASE_ID}.collections.${COLLECTIONS.PULSE_SCORES}.documents`;
  
  try {
    const unsubscribe = client.subscribe(channel, (response: any) => {
      const payload = response.payload;
      if (payload && payload.user_id === userId) {
        const score = Math.round(Number(payload.total_pulse ?? 100));
        const tier = fromAppwriteTier(payload.tier);
        onUpdate({
          userId,
          score,
          tier,
          breakdown: {
            matchPerf: Math.round(Number(payload.match_performance ?? 0)),
            consistency: Math.round(Number(payload.consistency ?? 0)),
            chemistry: Math.round(Number(payload.team_chemistry ?? 0)),
            reliability: Math.round(Number(payload.reliability ?? 0)),
            activity: Math.round(Number(payload.activity ?? 0)),
            leadership: Math.round(Number(payload.leadership ?? 0)),
          },
          history: [],
          lastUpdated: payload.updated_at || payload.$updatedAt || new Date().toISOString(),
        });
      }
    });

    return unsubscribe;
  } catch (err) {
    console.warn('[pulseService] Realtime subscription failed:', err);
    return () => {};
  }
}
