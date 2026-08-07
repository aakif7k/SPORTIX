/**
 * matchService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Full CRUD service for Appwrite `matches` collection.
 * Uses fallback mock data if collections are empty or unavailable.
 */

import { databases, ID, Query, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import type { MatchHistoryItem, MatchResult, PerformanceSport, ValidationStatus } from '@/types/performance.types';

type AppwriteDocument = Record<string, any> & {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
};

// ─── MAPPER ──────────────────────────────────────────────────────────────────
function docToMatch(doc: AppwriteDocument): MatchHistoryItem {
  return {
    id: doc.$id,
    matchId: doc.match_id || '',
    eventName: doc.event_name || 'Unknown Match',
    sport: (doc.sport || 'football') as PerformanceSport,
    matchResult: (doc.match_result || 'draw') as MatchResult,
    date: doc.date || doc.$createdAt,
    pulseEarned: doc.pulse_earned || 0,
    ssrDelta: doc.ssr_delta || 0,
    matchRating: doc.match_rating || 0,
    isMvp: doc.is_mvp || false,
    validationStatus: (doc.validation_status || 'pending') as ValidationStatus,
    statSummary: doc.stat_summary ? JSON.parse(doc.stat_summary) : {},
  } as MatchHistoryItem;
}

function matchToDoc(userId: string, match: Partial<MatchHistoryItem>): Record<string, any> {
  const doc: Record<string, any> = { user_id: userId };
  if (match.matchId !== undefined) doc.match_id = match.matchId;
  if (match.eventName !== undefined) doc.event_name = match.eventName;
  if (match.sport !== undefined) doc.sport = match.sport;
  if (match.matchResult !== undefined) doc.match_result = match.matchResult;
  if (match.date !== undefined) doc.date = match.date;
  if (match.pulseEarned !== undefined) doc.pulse_earned = match.pulseEarned;
  if (match.ssrDelta !== undefined) doc.ssr_delta = match.ssrDelta;
  if (match.matchRating !== undefined) doc.match_rating = match.matchRating;
  if (match.isMvp !== undefined) doc.is_mvp = match.isMvp;
  if (match.validationStatus !== undefined) doc.validation_status = match.validationStatus;
  if (match.statSummary !== undefined) doc.stat_summary = JSON.stringify(match.statSummary);
  return doc;
}

// ─── READ ────────────────────────────────────────────────────────────────────
export async function getMatchHistory(userId: string, fallbackMockData: MatchHistoryItem[]): Promise<MatchHistoryItem[]> {
  if (!userId) return fallbackMockData;
  try {
    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.MATCHES, [
      Query.equal('user_id', userId),
      Query.orderDesc('date'),
      Query.limit(50)
    ]);
    
    if (res.documents.length === 0) {
      return fallbackMockData;
    }
    
    return res.documents.map(d => docToMatch(d as AppwriteDocument));
  } catch (err) {
    console.warn('[matchService] getMatchHistory failed, using mock data:', err);
    return fallbackMockData;
  }
}

// ─── CREATE ──────────────────────────────────────────────────────────────────
export async function createMatch(userId: string, match: Omit<MatchHistoryItem, 'id'>): Promise<MatchHistoryItem | null> {
  try {
    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.MATCHES,
      ID.unique(),
      matchToDoc(userId, match)
    );
    return docToMatch(doc as AppwriteDocument);
  } catch (err) {
    console.error('[matchService] createMatch failed:', err);
    return null;
  }
}
