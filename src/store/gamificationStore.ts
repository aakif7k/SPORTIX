import { create } from 'zustand';
import { useAuthStore } from './authStore';

// ─── TYPES ──────────────────────────────────────────────────────────────────
import type { GamificationLevel, Mission, DailyReward, Badge } from '../types/gamification.types';

export interface GamificationState {
  // Core
  currentPulse: number;
  totalXP: number;
  currentLevel: number;
  streakDays: number;
  lastCheckin: string | null;

  // Data
  missions: Mission[];
  dailyRewards: DailyReward[];
  badges: Badge[];

  // Actions
  loadGamificationData: () => Promise<void>;
  addPulse: (amount: number) => void;
  claimDailyReward: (day: number) => Promise<void>;
  completeMission: (id: string) => void;
  claimMissionReward: (id: string) => void;
  updateMissionProgress: (id: string, progress: number) => void;
  checkIn: () => void;
  reset: () => void;
}

// ─── LEVEL SYSTEM ───────────────────────────────────────────────────────────
export const getLevelTitle = (lvl: number): string => {
  if (lvl <= 10) return 'Rookie';
  if (lvl <= 20) return 'Challenger';
  if (lvl <= 30) return 'Contender';
  if (lvl <= 40) return 'Striker';
  if (lvl <= 50) return 'Elite';
  if (lvl <= 60) return 'Dominator';
  if (lvl <= 70) return 'Champion';
  if (lvl <= 80) return 'Titan';
  if (lvl <= 90) return 'Apex';
  if (lvl <= 100) return 'Legend';
  if (lvl <= 110) return 'Grandmaster X';
  if (lvl <= 120) return 'HyperNova';
  if (lvl <= 130) return 'Phantom Overdrive';
  if (lvl <= 140) return 'Immortal Zenith';
  return 'Supreme GOAT';
};

export const LEVELS: GamificationLevel[] = Array.from({ length: 150 }, (_, i) => {
  const lvl = i + 1;
  const title = getLevelTitle(lvl);
  return {
    level: lvl,
    title,
    minPulse: (lvl - 1) * 100,
    maxPulse: lvl * 100,
    color: lvl > 100 ? '#CCFF00' : '#888888',
    icon: lvl > 100 ? '👑' : '⚡'
  };
});

export const getLevelInfo = (pulse: number): GamificationLevel => {
  const lvl = Math.min(150, Math.floor(pulse / 100) + 1);
  return LEVELS[lvl - 1] || LEVELS[LEVELS.length - 1];
};

export const getLevelProgress = (pulse: number) => {
  const level = getLevelInfo(pulse);
  const range = level.maxPulse - level.minPulse;
  const current = pulse - level.minPulse;
  return {
    level,
    current,
    required: range,
    remaining: range - current,
    percentage: Math.min(100, Math.round((current / range) * 100)),
  };
};

// ─── INITIAL DATA TEMPLATES ──────────────────────────────────────────────────
import { NEW_USER_MISSIONS, NEW_USER_REWARDS, NEW_USER_BADGES, getUserSportiXState, claimDailyRewardIdempotent, getLocalDateStr } from '../services/userStateService';
import { toast as hotToast } from 'react-hot-toast';

const INITIAL_MISSIONS: Mission[] = NEW_USER_MISSIONS;
const INITIAL_REWARDS: DailyReward[] = NEW_USER_REWARDS;
const INITIAL_BADGES: Badge[] = NEW_USER_BADGES;

// ─── STORE ───────────────────────────────────────────────────────────────────
export const useGamificationStore = create<GamificationState>((set, get) => ({
  currentPulse: 100,
  totalXP: 0,
  currentLevel: 1,
  streakDays: 0,
  lastCheckin: null,
  missions: INITIAL_MISSIONS,
  dailyRewards: INITIAL_REWARDS,
  badges: INITIAL_BADGES,

  loadGamificationData: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    try {
      const userState = await getUserSportiXState(user.id);
      const todayStr = getLocalDateStr();
      const lastClaimKey = `sportix_last_daily_claim_date_${user.id}`;
      const lastClaimDate = localStorage.getItem(lastClaimKey);
      const hasClaimedToday = lastClaimDate === todayStr;

      let claimedDays = userState.claimedRewardDays;
      let maxClaimedDay = claimedDays.length > 0 ? Math.max(...claimedDays) : 0;

      // If user completed full 7-day cycle and it's a new day after 12:00 AM, reset cycle
      if (maxClaimedDay >= 7 && !hasClaimedToday) {
        claimedDays = [];
        maxClaimedDay = 0;
        localStorage.setItem(`sportix_claimed_rewards_${user.id}`, JSON.stringify([]));
      }

      // Hydrate daily rewards for this user ID with 12:00 AM Reset Locking
      const updatedRewards = INITIAL_REWARDS.map(r => {
        const isClaimed = claimedDays.includes(r.day);
        
        // If user already claimed today, ALL future days (including maxClaimedDay + 1) are locked until 12:00 AM!
        // If user hasn't claimed today, day (maxClaimedDay + 1) is unlocked for today!
        const isToday = !hasClaimedToday && r.day === maxClaimedDay + 1;
        const isLocked = !isClaimed && !isToday;

        return {
          ...r,
          claimed: isClaimed,
          isToday,
          isLocked,
        };
      });

      // Hydrate missions from user localStorage
      let userMissions = INITIAL_MISSIONS;
      try {
        const rawM = localStorage.getItem(`sportix_missions_${user.id}`);
        if (rawM) userMissions = JSON.parse(rawM);
      } catch {}

      // Hydrate badges from user localStorage
      let userBadges = INITIAL_BADGES;
      try {
        const rawB = localStorage.getItem(`sportix_badges_${user.id}`);
        if (rawB) userBadges = JSON.parse(rawB);
      } catch {}

      set({
        currentPulse: userState.pulse,
        currentLevel: userState.level,
        totalXP: userState.totalXP,
        streakDays: userState.streakDays,
        dailyRewards: updatedRewards,
        missions: userMissions,
        badges: userBadges,
      });
    } catch (err) {
      console.warn('[gamificationStore] Failed to load user state:', err);
    }
  },

  addPulse: (amount) => set((state) => {
    const newPulse = state.currentPulse + amount;
    const levelInfo = getLevelInfo(newPulse);
    return { currentPulse: newPulse, currentLevel: levelInfo.level };
  }),

  claimDailyReward: async (day) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    const currentState = get();
    const reward = currentState.dailyRewards.find(r => r.day === day);
    
    // STRICT RULE: Cannot claim if already claimed, locked, or not today's active reward
    if (!reward || reward.claimed) {
      hotToast.error(`Day ${day} reward is already collected.`);
      return;
    }

    if (reward.isLocked || !reward.isToday) {
      hotToast.error("This reward is locked! You can only collect 1 reward per day. Next reward unlocks tomorrow at 12:00 AM (Midnight).");
      return;
    }

    const claimRes = await claimDailyRewardIdempotent(user.id, day, reward.pulseReward || 10);
    if (!claimRes.success) {
      hotToast.error(claimRes.message);
      return;
    }

    hotToast.success(claimRes.message);
    const newPulse = claimRes.newPulse || (currentState.currentPulse + (reward.pulseReward || 10));
    const levelInfo = getLevelInfo(newPulse);

    set(state => {
      const claimedDays = [...state.dailyRewards.filter(r => r.claimed).map(r => r.day), day];
      
      // Update state: today's reward is now claimed, ALL remaining days are LOCKED until 12:00 AM tomorrow!
      const updatedRewards = state.dailyRewards.map(r => {
        const isClaimed = claimedDays.includes(r.day);
        return {
          ...r,
          claimed: isClaimed,
          isToday: false,
          isLocked: !isClaimed,
        };
      });

      return {
        dailyRewards: updatedRewards,
        currentPulse: newPulse,
        currentLevel: levelInfo.level,
      };
    });
  },

  completeMission: (id) => set((state) => {
    const user = useAuthStore.getState().user;
    const userId = user?.id || 'guest';
    const updated = state.missions.map(m =>
      m.id === id ? { ...m, completed: true, current: m.target } : m
    );
    try { localStorage.setItem(`sportix_missions_${userId}`, JSON.stringify(updated)); } catch {}
    return { missions: updated };
  }),

  claimMissionReward: (id) => set((state) => {
    const user = useAuthStore.getState().user;
    const userId = user?.id || 'guest';
    const mission = state.missions.find(m => m.id === id);
    if (!mission || mission.claimed) return state;

    const updated = state.missions.map(m => m.id === id ? { ...m, claimed: true } : m);
    try { localStorage.setItem(`sportix_missions_${userId}`, JSON.stringify(updated)); } catch {}

    const addedPulse = mission.reward || 0;
    const newPulse = state.currentPulse + addedPulse;
    const levelInfo = getLevelInfo(newPulse);

    return {
      missions: updated,
      currentPulse: newPulse,
      currentLevel: levelInfo.level,
      totalXP: state.totalXP + (mission.xpReward || 0),
    };
  }),

  updateMissionProgress: (id, progress) => set((state) => {
    const user = useAuthStore.getState().user;
    const userId = user?.id || 'guest';
    const updated = state.missions.map(m =>
      m.id === id ? { ...m, current: Math.min(m.target, progress), completed: progress >= m.target } : m
    );
    try { localStorage.setItem(`sportix_missions_${userId}`, JSON.stringify(updated)); } catch {}
    return { missions: updated };
  }),

  checkIn: () => set((state) => ({
    lastCheckin: new Date().toISOString(),
    streakDays: state.streakDays + 1,
    currentPulse: state.currentPulse + 10,
  })),

  reset: () => set({
    currentPulse: 100,
    totalXP: 0,
    currentLevel: 1,
    streakDays: 0,
    lastCheckin: null,
    missions: INITIAL_MISSIONS,
    dailyRewards: INITIAL_REWARDS,
    badges: INITIAL_BADGES,
  }),
}));
