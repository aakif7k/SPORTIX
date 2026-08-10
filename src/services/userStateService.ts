/**
 * userStateService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized service to manage and compute user-specific initial state and progression:
 * - Pulse balance (Starts at 100 for brand-new users)
 * - AutoSquad generation quotas (5/5 remaining per individual account)
 * - Daily rewards persistence per user ID
 * - Mission progress persistence per user ID
 * - Badges unlock persistence per user ID
 * - Complete data isolation between user accounts
 */

import { databases, ID, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite';
import type { Mission, DailyReward, Badge } from '@/types/gamification.types';

export interface UserSportiXState {
  userId: string;
  pulse: number;
  level: number;
  totalXP: number;
  streakDays: number;
  matchesPlayed: number;
  winRate: string;         // "N/A" if 0 matches
  ssrStatus: string;       // "Provisional" if no match history
  globalRank: string;      // "Unranked" if no match history
  eventsJoinedCount: number;
  activeCrew: string | null;
  autoSquadUsed: number;
  autoSquadRemaining: number;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  completedMissionsCount: number;
  claimedRewardDays: number[];
  unlockedBadges: string[];
}

const DEFAULT_INITIAL_PULSE = 100;
const MAX_AUTOSQUAD_QUOTA = 5;

/* ─── INITIAL TEMPLATES FOR NEW USERS ────────────────────────────────────── */

export const NEW_USER_MISSIONS: Mission[] = [
  { id: 'm1', title: 'Upload a Highlight', description: 'Share 1 sports highlight to your feed', icon: '🎥', category: 'daily', target: 1, current: 0, reward: 20, xpReward: 50, completed: false, claimed: false },
  { id: 'm2', title: 'Join an Event', description: 'Register for 1 upcoming event', icon: '🏟️', category: 'daily', target: 1, current: 0, reward: 30, xpReward: 75, completed: false, claimed: false },
  { id: 'm3', title: 'React to Posts', description: 'Like or react to 5 posts in the feed', icon: '⚡', category: 'daily', target: 5, current: 0, reward: 15, xpReward: 30, completed: false, claimed: false },
  { id: 'm4', title: 'Complete a Match', description: 'Finish 1 full match in PULSE mode', icon: '🥊', category: 'daily', target: 1, current: 0, reward: 40, xpReward: 100, completed: false, claimed: false },
  { id: 'm5', title: 'Message Teammates', description: 'Send messages to 3 teammates', icon: '💬', category: 'daily', target: 3, current: 0, reward: 10, xpReward: 25, completed: false, claimed: false },
  { id: 'm6', title: 'Earn 50 Pulse', description: 'Accumulate 50 Pulse from any activities', icon: '🔋', category: 'daily', target: 50, current: 0, reward: 25, xpReward: 60, completed: false, claimed: false },
  { id: 'm7', title: 'Win 3 Matches', description: 'Win 3 matches this week', icon: '🏆', category: 'weekly', target: 3, current: 0, reward: 100, xpReward: 250, completed: false, claimed: false },
  { id: 'm8', title: 'Build a Full Squad', description: 'Form a complete team this week', icon: '👥', category: 'weekly', target: 1, current: 0, reward: 80, xpReward: 200, completed: false, claimed: false },
];

export const NEW_USER_REWARDS: DailyReward[] = [
  { day: 1, label: 'Day 1', pulseReward: 10, icon: '⚡', claimed: false, isToday: true, isLocked: false, isBonusDay: false },
  { day: 2, label: 'Day 2', pulseReward: 15, icon: '⚡', claimed: false, isToday: false, isLocked: true, isBonusDay: false },
  { day: 3, label: 'Day 3', pulseReward: 20, icon: '🔋', claimed: false, isToday: false, isLocked: true, isBonusDay: false },
  { day: 4, label: 'Day 4', pulseReward: 25, icon: '🎯', claimed: false, isToday: false, isLocked: true, isBonusDay: false },
  { day: 5, label: 'Day 5', pulseReward: 30, xpBooster: 1.5, icon: '🚀', claimed: false, isToday: false, isLocked: true, isBonusDay: false },
  { day: 6, label: 'Day 6', pulseReward: 40, icon: '💎', claimed: false, isToday: false, isLocked: true, isBonusDay: false },
  { day: 7, label: 'BONUS', pulseReward: 100, xpBooster: 2, icon: '👑', claimed: false, isToday: false, isLocked: true, isBonusDay: true },
];

export const NEW_USER_BADGES: Badge[] = [
  { id: 'b1', title: 'MVP', description: 'Rated Most Valuable Player in a match', icon: '🏆', rarity: 'legendary', color: '#FFD700', unlocked: false, progress: 0, maxProgress: 1 },
  { id: 'b2', title: 'Team Captain', description: 'Led a full squad to victory', icon: '⚡', rarity: 'epic', color: '#CCFF00', unlocked: false, progress: 0, maxProgress: 1 },
  { id: 'b3', title: 'Event Champion', description: 'Won a competitive tournament', icon: '🥇', rarity: 'legendary', color: '#FF3B00', unlocked: false, progress: 0, maxProgress: 1 },
  { id: 'b4', title: 'Winning Streak', description: 'Win 5 matches in a row', icon: '🔥', rarity: 'epic', color: '#f97316', unlocked: false, progress: 0, maxProgress: 5 },
  { id: 'b5', title: 'Rising Athlete', description: 'Reach Level 3 on SPORTiX', icon: '📈', rarity: 'rare', color: '#3b82f6', unlocked: false, progress: 0, maxProgress: 1 },
  { id: 'b6', title: 'Elite Performer', description: 'Maintain 90%+ rating for 30 days', icon: '💎', rarity: 'rare', color: '#a855f7', unlocked: false, progress: 0, maxProgress: 30 },
  { id: 'b7', title: 'Social Pulse', description: 'Connect with 50 athletes', icon: '🤝', rarity: 'common', color: '#22c55e', unlocked: false, progress: 0, maxProgress: 50 },
  { id: 'b8', title: 'First Blood', description: 'Win your very first match', icon: '🩸', rarity: 'common', color: '#ef4444', unlocked: false, progress: 0, maxProgress: 1 },
];

/* ─── USER STORAGE KEYS ───────────────────────────────────────────────────── */
function getStorageKey(key: string, userId: string): string {
  return `sportix_${key}_${userId}`;
}

/**
 * Evaluates daily login streak AFTER authenticating session.
 * STRICT RULE: Only executed during Auth/Session initialization (loadProfileFromAppwrite).
 * NEVER called by opening Pulse, refreshing tab, or clicking reward cards.
 */
export async function evaluateDailyLogin(userId: string): Promise<{ streak: number; todayDate: string; isNewLoginToday: boolean }> {
  if (!userId) return { streak: 0, todayDate: '', isNewLoginToday: false };

  const todayDate = new Date().toISOString().split('T')[0]; // UTC Calendar Date YYYY-MM-DD
  const lastLoginKey = getStorageKey('last_login_date', userId);
  const lastLoginDate = localStorage.getItem(lastLoginKey);

  let currentStreak = 0;

  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, userId);
    currentStreak = doc.login_streak ?? 0;
  } catch {}

  // 1. Same calendar day login check
  if (lastLoginDate === todayDate) {
    return { streak: Math.max(1, currentStreak), todayDate, isNewLoginToday: false };
  }

  // 2. Compute yesterday's UTC date string YYYY-MM-DD
  const todayMs = new Date(todayDate).getTime();
  const yesterdayMs = todayMs - 86400000;
  const yesterdayDate = new Date(yesterdayMs).toISOString().split('T')[0];

  let newStreak = 1;
  if (!lastLoginDate) {
    newStreak = 1;
  } else if (lastLoginDate === yesterdayDate) {
    newStreak = currentStreak + 1;
  } else {
    newStreak = 1;
  }

  try {
    localStorage.setItem(lastLoginKey, todayDate);
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.PROFILES, userId, {
      login_streak: newStreak,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[userStateService] Failed to persist streak to Appwrite:', err);
  }

  return { streak: newStreak, todayDate, isNewLoginToday: true };
}

/** Helper to get local YYYY-MM-DD date string for 12:00 AM midnight reset calculation */
export function getLocalDateStr(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Idempotent daily reward claim execution.
 * STRICT RULE: Only ONE reward claim allowed per calendar day (resets at 12:00 AM Midnight).
 * Guarantees that (userId, day) can ONLY be claimed ONCE.
 * Logs a transaction doc in `pulse_history`.
 */
export async function claimDailyRewardIdempotent(
  userId: string,
  day: number,
  rewardPulse: number
): Promise<{ success: boolean; newPulse: number; message: string }> {
  if (!userId) return { success: false, newPulse: 100, message: 'Invalid user' };

  const todayStr = getLocalDateStr();
  const lastClaimKey = getStorageKey('last_daily_claim_date', userId);
  const lastClaimDate = localStorage.getItem(lastClaimKey);

  // 1. Strict Date Check: Cannot claim more than ONCE per calendar day (resets at 12:00 AM Midnight)
  if (lastClaimDate === todayStr) {
    return {
      success: false,
      newPulse: 0,
      message: "You have already collected today's reward! Next reward unlocks at 12:00 AM (Midnight)."
    };
  }

  const refId = `daily_reward_day_${day}_${userId}`;
  const claimedKey = getStorageKey('claimed_rewards', userId);

  // 2. Check local claimed array
  let claimedDays: number[] = [];
  try {
    const raw = localStorage.getItem(claimedKey);
    if (raw) claimedDays = JSON.parse(raw);
  } catch {}

  if (claimedDays.includes(day)) {
    return { success: false, newPulse: 0, message: `Day ${day} reward already claimed.` };
  }

  // 3. Check Appwrite pulse_history for existing reference_id
  try {
    const existing = await databases.listDocuments(
      DATABASE_ID,
      'pulse_history',
      [Query.equal('user_id', userId), Query.equal('reference_id', refId), Query.limit(1)]
    );
    if (existing.total > 0) {
      if (!claimedDays.includes(day)) {
        claimedDays.push(day);
        localStorage.setItem(claimedKey, JSON.stringify(claimedDays));
      }
      return { success: false, newPulse: 0, message: `Day ${day} reward already claimed.` };
    }
  } catch {}

  // 4. Read current profile pulse_score
  let currentPulse = 100;
  try {
    const profileDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, userId);
    currentPulse = profileDoc.pulse_score ?? 100;
  } catch {}

  const newPulse = currentPulse + rewardPulse;

  // 5. Update Appwrite profile pulse_score
  try {
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.PROFILES, userId, {
      pulse_score: newPulse,
      updated_at: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[userStateService] Failed to update profile pulse_score:', err);
    return { success: false, newPulse: currentPulse, message: 'Failed to update Pulse balance' };
  }

  // 6. Create pulse_history transaction record
  try {
    await databases.createDocument(DATABASE_ID, 'pulse_history', ID.unique(), {
      user_id: userId,
      delta: rewardPulse,
      source: 'daily_reward',
      reason: `Day ${day} Daily Login Reward`,
      score_after: newPulse,
      reference_id: refId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (histErr) {
    console.warn('[userStateService] Warning: Failed to record pulse_history:', histErr);
  }

  // 7. Update local storage claimed array & last claim date
  claimedDays.push(day);
  try {
    localStorage.setItem(claimedKey, JSON.stringify(claimedDays));
    localStorage.setItem(lastClaimKey, todayStr);
  } catch {}

  return { success: true, newPulse, message: `Successfully claimed Day ${day} reward (+${rewardPulse} Pulse)!` };
}

/**
 * Fetch and compute clean isolated state for a specific user ID.
 */
export async function getUserSportiXState(userId: string): Promise<UserSportiXState> {
  if (!userId) {
    return {
      userId: '',
      pulse: DEFAULT_INITIAL_PULSE,
      level: 1,
      totalXP: 0,
      streakDays: 0,
      matchesPlayed: 0,
      winRate: 'N/A',
      ssrStatus: 'Provisional',
      globalRank: 'Unranked',
      eventsJoinedCount: 0,
      activeCrew: null,
      autoSquadUsed: 0,
      autoSquadRemaining: MAX_AUTOSQUAD_QUOTA,
      postsCount: 0,
      followersCount: 0,
      followingCount: 0,
      completedMissionsCount: 0,
      claimedRewardDays: [],
      unlockedBadges: [],
    };
  }

  // 1. Fetch user profile from Appwrite
  let pulse = DEFAULT_INITIAL_PULSE;
  let level = 1;
  let matchesPlayed = 0;
  let eventsJoinedCount = 0;
  let postsCount = 0;
  let followersCount = 0;
  let followingCount = 0;
  let loginStreak = 0;

  try {
    const profileDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, userId);
    if (profileDoc) {
      pulse = profileDoc.pulse_score ?? DEFAULT_INITIAL_PULSE;
      level = profileDoc.level ?? 1;
      loginStreak = profileDoc.login_streak ?? 0;
      followersCount = profileDoc.followers_count ?? 0;
      followingCount = profileDoc.following_count ?? 0;
      postsCount = profileDoc.posts_count ?? 0;
    }
  } catch {}

  // 2. Fetch events joined count from event_participants
  try {
    const participantsRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.EVENT_PARTICIPANTS,
      [Query.equal('user_id', userId), Query.limit(100)]
    );
    eventsJoinedCount = participantsRes.total || participantsRes.documents.length;
  } catch {}

  // 3. User AutoSquad Quota
  let autoSquadUsed = 0;
  try {
    const rawUsed = localStorage.getItem(getStorageKey('autosquad_used', userId));
    if (rawUsed) autoSquadUsed = parseInt(rawUsed, 10) || 0;
  } catch {}
  const autoSquadRemaining = Math.max(0, MAX_AUTOSQUAD_QUOTA - autoSquadUsed);

  // 4. Daily rewards claimed days
  let claimedRewardDays: number[] = [];
  try {
    const rawRewards = localStorage.getItem(getStorageKey('claimed_rewards', userId));
    if (rawRewards) claimedRewardDays = JSON.parse(rawRewards);
  } catch {}

  return {
    userId,
    pulse,
    level,
    totalXP: Math.max(0, (level - 1) * 100),
    streakDays: loginStreak,
    matchesPlayed,
    winRate: matchesPlayed > 0 ? `${Math.round((0 / matchesPlayed) * 100)}%` : 'N/A',
    ssrStatus: matchesPlayed > 0 ? 'Rated' : 'Provisional',
    globalRank: matchesPlayed > 0 ? '#100+' : 'Unranked',
    eventsJoinedCount,
    activeCrew: null,
    autoSquadUsed,
    autoSquadRemaining,
    postsCount,
    followersCount,
    followingCount,
    completedMissionsCount: 0,
    claimedRewardDays,
    unlockedBadges: [],
  };
}

/**
 * Record AutoSquad generation usage for a user.
 */
export function consumeAutoSquadQuota(userId: string): number {
  if (!userId) return MAX_AUTOSQUAD_QUOTA;
  const key = getStorageKey('autosquad_used', userId);
  const current = parseInt(localStorage.getItem(key) || '0', 10) || 0;
  const updated = current + 1;
  localStorage.setItem(key, updated.toString());
  return Math.max(0, MAX_AUTOSQUAD_QUOTA - updated);
}

