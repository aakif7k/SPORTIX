/**
 * src/services/leaderboardService.ts
 */
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../api/appwrite';
import { LeaderboardEntry } from '../types';

function toEntry(doc: any): LeaderboardEntry {
  return {
    $id:         doc.$id,
    user_id:     doc.user_id     ?? '',
    username:    doc.username    ?? '',
    avatar_url:  doc.avatar_url  ?? null,
    pulse_score: doc.pulse_score ?? 0,
    level:       doc.level       ?? 1,
    sport:       doc.sport       ?? '',
    rank:        doc.rank        ?? 0,
  };
}

export const leaderboardService = {
  async getGlobalLeaderboard(sport?: string, limit = 50): Promise<LeaderboardEntry[]> {
    try {
      const queries: any[] = [
        Query.orderAsc('rank'),
        Query.limit(limit),
      ];
      if (sport && sport !== 'All') {
        queries.push(Query.equal('sport', sport));
      }
      const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.LEADERBOARD, queries);
      return res.documents.map(toEntry);
    } catch {
      // Fallback: query profiles ordered by pulse_score
      const queries: any[] = [
        Query.orderDesc('pulse_score'),
        Query.limit(limit),
      ];
      if (sport && sport !== 'All') {
        queries.push(Query.equal('sport', sport));
      }
      const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, queries);
      return (res.documents as any[]).map((doc, idx) => ({
        $id:         doc.$id,
        user_id:     doc.$id,
        username:    doc.username    ?? '',
        avatar_url:  doc.avatar_url  ?? null,
        pulse_score: doc.pulse_score ?? 0,
        level:       doc.level       ?? 1,
        sport:       doc.sport       ?? '',
        rank:        idx + 1,
      }));
    }
  },
};
