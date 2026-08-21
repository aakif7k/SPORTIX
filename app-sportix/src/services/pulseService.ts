/**
 * src/services/pulseService.ts
 */
import { account, databases, DATABASE_ID, COLLECTIONS, Query, FASTAPI_URL } from '../api/appwrite';
import { PulseScore } from '../types';
import { authService } from './authService';

export const pulseService = {
  async getMyPulse(): Promise<PulseScore | null> {
    try {
      const raw = await account.get();
      const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PULSE_SCORES, [
        Query.equal('user_id', raw.$id),
        Query.orderDesc('$createdAt'),
        Query.limit(1),
      ]);
      if (res.total === 0) return null;
      const doc = res.documents[0] as any;
      return {
        $id:     doc.$id,
        user_id: doc.user_id,
        score:   doc.score  ?? 0,
        level:   doc.level  ?? 1,
        streak:  doc.streak ?? 0,
      };
    } catch {
      return null;
    }
  },

  async getPulseHistory(limit = 30): Promise<Array<{ score: number; date: string }>> {
    try {
      const raw = await account.get();
      const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PULSE_HISTORY, [
        Query.equal('user_id', raw.$id),
        Query.orderDesc('$createdAt'),
        Query.limit(limit),
      ]);
      return res.documents.map((d: any) => ({
        score: d.score ?? 0,
        date:  d.$createdAt,
      }));
    } catch {
      return [];
    }
  },

  /** Claim daily reward via FastAPI (idempotent). */
  async claimDailyReward(): Promise<{ coins: number; streak: number; alreadyClaimed: boolean }> {
    const jwt = await authService.createJWT();
    const res = await fetch(`${FASTAPI_URL}/api/missions/daily-claim`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${jwt}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (err.detail?.includes('already')) {
        return { coins: 0, streak: 0, alreadyClaimed: true };
      }
      throw new Error(err.detail ?? 'Claim failed');
    }
    return { ...(await res.json()), alreadyClaimed: false };
  },
};
