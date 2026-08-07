/**
 * gamificationService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Full CRUD service for Appwrite gamification collections.
 * Uses fallback mock data if collections are empty or unavailable.
 */

import { databases, Query, DATABASE_ID } from '@/lib/appwrite';
import type { Mission, Badge } from '../types/gamification.types';

export async function getMissions(userId: string, fallbackMocks: Mission[]): Promise<Mission[]> {
  try {
    const res = await databases.listDocuments(DATABASE_ID, 'daily_missions', [
      Query.equal('user_id', userId),
      Query.limit(50)
    ]);
    if (res.documents.length === 0) return fallbackMocks;
    return res.documents.map(d => ({
      id: d.$id,
      title: d.title,
      description: d.description,
      icon: d.icon,
      category: d.category,
      target: d.target,
      current: d.current_progress,
      reward: d.reward,
      xpReward: d.xp_reward,
      completed: d.completed,
      claimed: d.claimed
    }));
  } catch (err) {
    console.warn('[gamificationService] getMissions failed:', err);
    return fallbackMocks;
  }
}

export async function getBadges(userId: string, fallbackMocks: Badge[]): Promise<Badge[]> {
  try {
    const res = await databases.listDocuments(DATABASE_ID, 'badges', [
      Query.equal('user_id', userId),
      Query.limit(50)
    ]);
    if (res.documents.length === 0) return fallbackMocks;
    return res.documents.map(d => ({
      id: d.$id,
      title: d.title,
      description: d.description,
      icon: d.icon,
      rarity: d.rarity,
      color: d.color,
      unlocked: d.unlocked,
      progress: d.progress,
      maxProgress: d.max_progress,
      unlockedAt: d.unlocked_at
    }));
  } catch (err) {
    console.warn('[gamificationService] getBadges failed:', err);
    return fallbackMocks;
  }
}

export async function getLeaderboard(): Promise<any[]> {
  try {
    const res = await databases.listDocuments(DATABASE_ID, 'leaderboard', [
      Query.orderDesc('pulse_score'),
      Query.limit(10)
    ]);
    return res.documents;
  } catch (err) {
    console.warn('[gamificationService] getLeaderboard failed:', err);
    return [];
  }
}
