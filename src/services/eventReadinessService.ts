/**
 * eventReadinessService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Frontend client service for Event AutoSquad Readiness & Partial Squad Progress.
 * Queries backend API (http://localhost:8000/api/events/{event_id}/readiness)
 * with direct Appwrite fallback.
 */

import { account, databases, Query, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export interface EventReadinessData {
  event_id: string;
  sport: string;
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
}

/**
 * Fetch Event AutoSquad readiness and user squad forming progress
 */
export async function getEventReadiness(eventId: string): Promise<EventReadinessData> {
  try {
    const session = await account.getSession('current').catch(() => null);
    const token = session ? (session as any).jwt || '' : '';

    const res = await fetch(`${BACKEND_URL}/api/events/${eventId}/readiness`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (res.ok) {
      const data = await res.json();
      return data.data;
    }
  } catch (err) {
    console.warn('[EventReadinessService] Backend offline, falling back to direct Appwrite check:', err);
  }

  // Direct Appwrite fallback
  try {
    const eventDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.EVENTS, eventId).catch(() => null);
    const sport = eventDoc?.sport || 'Football';
    const format = eventDoc?.format || 'team';
    const maxParts = eventDoc?.max_participants || 32;

    const parts = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.EVENT_PARTICIPANTS,
      [Query.equal('event_id', eventId), Query.limit(200)]
    ).catch(() => ({ total: 0, documents: [] }));

    const eligibleCount = parts.total || parts.documents.length;
    const isReady = eligibleCount >= 10;
    const targetSize = sport === 'Football' ? 5 : sport === 'Basketball' ? 5 : 11;

    return {
      event_id: eventId,
      sport,
      format,
      eligible_count: eligibleCount,
      min_required: 10,
      max_participants: maxParts,
      is_autosquad_ready: isReady,
      readiness_state: eligibleCount >= maxParts ? 'FULL' : isReady ? 'AUTOSQUAD_READY' : 'WAITING_FOR_PLAYERS',
      matching_state: isReady ? 'AUTOSQUAD_READY' : 'WAITING_FOR_PLAYERS',
      target_squad_size: targetSize,
      matched_players: isReady ? Math.min(targetSize, eligibleCount) : 1,
      remaining_needed: isReady ? Math.max(0, targetSize - eligibleCount) : targetSize - 1,
    };
  } catch {
    return {
      event_id: eventId,
      sport: 'Football',
      format: 'team',
      eligible_count: 0,
      min_required: 10,
      max_participants: 32,
      is_autosquad_ready: false,
      readiness_state: 'WAITING_FOR_PLAYERS',
      matching_state: 'WAITING_FOR_PLAYERS',
      target_squad_size: 5,
      matched_players: 0,
      remaining_needed: 5,
    };
  }
}
