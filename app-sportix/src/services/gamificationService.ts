/**
 * src/services/gamificationService.ts
 */
import { account, databases, DATABASE_ID, COLLECTIONS, Query, FASTAPI_URL } from '../api/appwrite';
import { UserMission, UserBadge, Badge, CoinTransaction } from '../types';
import { authService } from './authService';

export const gamificationService = {
  async getMyMissions(): Promise<UserMission[]> {
    const raw = await account.get();
    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USER_MISSIONS, [
      Query.equal('user_id', raw.$id),
      Query.limit(20),
    ]);
    // Enrich with mission details
    const missions = res.documents as any[];
    const enriched: UserMission[] = [];
    for (const m of missions) {
      let mission: any = null;
      try {
        mission = await databases.getDocument(DATABASE_ID, COLLECTIONS.DAILY_MISSIONS, m.mission_id);
      } catch { /* mission template may not exist */ }
      enriched.push({
        $id:        m.$id,
        user_id:    m.user_id,
        mission_id: m.mission_id,
        progress:   m.progress  ?? 0,
        completed:  m.completed ?? false,
        mission:    mission ? {
          $id:          mission.$id,
          title:        mission.title        ?? '',
          description:  mission.description  ?? '',
          reward_coins: mission.reward_coins ?? 0,
          category:     mission.category     ?? '',
        } : undefined,
      });
    }
    return enriched;
  },

  async getMyBadges(): Promise<UserBadge[]> {
    const raw = await account.get();
    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USER_BADGES, [
      Query.equal('user_id', raw.$id),
      Query.limit(50),
    ]);
    const badges: UserBadge[] = [];
    for (const ub of res.documents as any[]) {
      let badge: Badge | undefined;
      try {
        const b = await databases.getDocument(DATABASE_ID, COLLECTIONS.BADGES, ub.badge_id);
        badge = {
          $id:         b.$id,
          name:        (b as any).name        ?? '',
          description: (b as any).description ?? '',
          icon:        (b as any).icon        ?? '',
          category:    (b as any).category    ?? '',
        };
      } catch { /* badge definition may not exist */ }
      badges.push({
        $id:       ub.$id,
        user_id:   ub.user_id,
        badge_id:  ub.badge_id,
        earned_at: ub.earned_at ?? ub.$createdAt,
        badge,
      });
    }
    return badges;
  },

  async getCoinBalance(): Promise<number> {
    try {
      const raw = await account.get();
      const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, raw.$id);
      return (doc as any).coins_balance ?? 0;
    } catch {
      return 0;
    }
  },

  async getCoinTransactions(limit = 30): Promise<CoinTransaction[]> {
    const raw = await account.get();
    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.COIN_TRANSACTIONS, [
      Query.equal('user_id', raw.$id),
      Query.orderDesc('$createdAt'),
      Query.limit(limit),
    ]);
    return (res.documents as any[]).map(d => ({
      $id:         d.$id,
      user_id:     d.user_id,
      amount:      d.amount      ?? 0,
      type:        d.type        ?? 'earn',
      description: d.description ?? '',
      $createdAt:  d.$createdAt,
    }));
  },

  async getStreakInfo(): Promise<{ days: number; lastClaimDate: string | null }> {
    try {
      const raw = await account.get();
      const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USER_STREAKS, [
        Query.equal('user_id', raw.$id),
        Query.limit(1),
      ]);
      if (res.total === 0) return { days: 0, lastClaimDate: null };
      const doc = res.documents[0] as any;
      return { days: doc.streak_days ?? 0, lastClaimDate: doc.last_claim_date ?? null };
    } catch {
      return { days: 0, lastClaimDate: null };
    }
  },
};
