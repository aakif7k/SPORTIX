import { create } from 'zustand';

// ─── TYPES ──────────────────────────────────────────────────────────────────
export interface GamificationLevel {
  level: number;
  title: string;
  minPulse: number;
  maxPulse: number;
  color: string;
  icon: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'daily' | 'weekly';
  target: number;
  current: number;
  reward: number;
  xpReward: number;
  completed: boolean;
  claimed: boolean;
}

export interface DailyReward {
  day: number;
  label: string;
  pulseReward: number;
  xpBooster?: number;
  icon: string;
  claimed: boolean;
  isToday: boolean;
  isLocked: boolean;
  isBonusDay: boolean;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  color: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  unlockedAt?: string;
}

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
  addPulse: (amount: number) => void;
  claimDailyReward: (day: number) => void;
  completeMission: (id: string) => void;
  claimMissionReward: (id: string) => void;
  updateMissionProgress: (id: string, progress: number) => void;
  checkIn: () => void;
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

// ─── INITIAL DATA ───────────────────────────────────────────────────────────
const INITIAL_MISSIONS: Mission[] = [
  { id: 'm1', title: 'Upload a Highlight', description: 'Share 1 sports highlight to your feed', icon: '🎥', category: 'daily', target: 1, current: 0, reward: 20, xpReward: 50, completed: false, claimed: false },
  { id: 'm2', title: 'Join an Event', description: 'Register for 1 upcoming event', icon: '🏟️', category: 'daily', target: 1, current: 1, reward: 30, xpReward: 75, completed: true, claimed: false },
  { id: 'm3', title: 'React to Posts', description: 'Like or react to 5 posts in the feed', icon: '⚡', category: 'daily', target: 5, current: 3, reward: 15, xpReward: 30, completed: false, claimed: false },
  { id: 'm4', title: 'Complete a Match', description: 'Finish 1 full match in PULSE mode', icon: '🥊', category: 'daily', target: 1, current: 0, reward: 40, xpReward: 100, completed: false, claimed: false },
  { id: 'm5', title: 'Message Teammates', description: 'Send messages to 3 teammates', icon: '💬', category: 'daily', target: 3, current: 2, reward: 10, xpReward: 25, completed: false, claimed: false },
  { id: 'm6', title: 'Earn 50 Pulse', description: 'Accumulate 50 Pulse from any activities', icon: '🔋', category: 'daily', target: 50, current: 35, reward: 25, xpReward: 60, completed: false, claimed: false },
  { id: 'm7', title: 'Win 3 Matches', description: 'Win 3 matches this week', icon: '🏆', category: 'weekly', target: 3, current: 1, reward: 100, xpReward: 250, completed: false, claimed: false },
  { id: 'm8', title: 'Build a Full Squad', description: 'Form a complete team this week', icon: '👥', category: 'weekly', target: 1, current: 0, reward: 80, xpReward: 200, completed: false, claimed: false },
];

const INITIAL_REWARDS: DailyReward[] = [
  { day: 1, label: 'Day 1',  pulseReward: 10,  icon: '⚡', claimed: true,  isToday: false, isLocked: false, isBonusDay: false },
  { day: 2, label: 'Day 2',  pulseReward: 15,  icon: '⚡', claimed: true,  isToday: false, isLocked: false, isBonusDay: false },
  { day: 3, label: 'Day 3',  pulseReward: 20,  icon: '🔋', claimed: true,  isToday: false, isLocked: false, isBonusDay: false },
  { day: 4, label: 'Day 4',  pulseReward: 25,  icon: '🎯', claimed: false, isToday: true,  isLocked: false, isBonusDay: false },
  { day: 5, label: 'Day 5',  pulseReward: 30,  xpBooster: 1.5, icon: '🚀', claimed: false, isToday: false, isLocked: true, isBonusDay: false },
  { day: 6, label: 'Day 6',  pulseReward: 40,  icon: '💎', claimed: false, isToday: false, isLocked: true, isBonusDay: false },
  { day: 7, label: 'BONUS',  pulseReward: 100, xpBooster: 2, icon: '👑', claimed: false, isToday: false, isLocked: true, isBonusDay: true },
];

const INITIAL_BADGES: Badge[] = [
  { id: 'b1', title: 'MVP', description: 'Rated Most Valuable Player in a match', icon: '🏆', rarity: 'legendary', color: '#FFD700', unlocked: true, unlockedAt: '2025-05-10' },
  { id: 'b2', title: 'Team Captain', description: 'Led a full squad to victory', icon: '⚡', rarity: 'epic', color: '#CCFF00', unlocked: true, unlockedAt: '2025-05-08' },
  { id: 'b3', title: 'Event Champion', description: 'Won a competitive tournament', icon: '🥇', rarity: 'legendary', color: '#FF3B00', unlocked: false, progress: 1, maxProgress: 1 },
  { id: 'b4', title: 'Winning Streak', description: 'Win 5 matches in a row', icon: '🔥', rarity: 'epic', color: '#f97316', unlocked: false, progress: 3, maxProgress: 5 },
  { id: 'b5', title: 'Rising Athlete', description: 'Reach Level 3 on SPORTiX', icon: '📈', rarity: 'rare', color: '#3b82f6', unlocked: true, unlockedAt: '2025-05-01' },
  { id: 'b6', title: 'Elite Performer', description: 'Maintain 90%+ rating for 30 days', icon: '💎', rarity: 'rare', color: '#a855f7', unlocked: false, progress: 12, maxProgress: 30 },
  { id: 'b7', title: 'Social Pulse', description: 'Connect with 50 athletes', icon: '🤝', rarity: 'common', color: '#22c55e', unlocked: true, unlockedAt: '2025-04-28' },
  { id: 'b8', title: 'First Blood', description: 'Win your very first match', icon: '🩸', rarity: 'common', color: '#ef4444', unlocked: true, unlockedAt: '2025-04-20' },
];

// ─── STORE ───────────────────────────────────────────────────────────────────
export const useGamificationStore = create<GamificationState>((set) => ({
  currentPulse: 2450,
  totalXP: 3800,
  currentLevel: 25,
  streakDays: 3,
  lastCheckin: null,
  missions: INITIAL_MISSIONS,
  dailyRewards: INITIAL_REWARDS,
  badges: INITIAL_BADGES,

  addPulse: (amount) => set((state) => {
    const newPulse = state.currentPulse + amount;
    const levelInfo = getLevelInfo(newPulse);
    return { currentPulse: newPulse, currentLevel: levelInfo.level };
  }),

  claimDailyReward: (day) => set((state) => {
    const rewards = state.dailyRewards.map(r =>
      r.day === day ? { ...r, claimed: true } : r
    );
    const reward = state.dailyRewards.find(r => r.day === day);
    return {
      dailyRewards: rewards,
      currentPulse: state.currentPulse + (reward?.pulseReward || 0),
      streakDays: state.streakDays + 1,
    };
  }),

  completeMission: (id) => set((state) => ({
    missions: state.missions.map(m =>
      m.id === id ? { ...m, completed: true, current: m.target } : m
    ),
  })),

  claimMissionReward: (id) => set((state) => {
    const mission = state.missions.find(m => m.id === id);
    return {
      missions: state.missions.map(m => m.id === id ? { ...m, claimed: true } : m),
      currentPulse: state.currentPulse + (mission?.reward || 0),
      totalXP: state.totalXP + (mission?.xpReward || 0),
    };
  }),

  updateMissionProgress: (id, progress) => set((state) => ({
    missions: state.missions.map(m =>
      m.id === id ? { ...m, current: Math.min(m.target, progress), completed: progress >= m.target } : m
    ),
  })),

  checkIn: () => set((state) => ({
    lastCheckin: new Date().toISOString(),
    streakDays: state.streakDays + 1,
    currentPulse: state.currentPulse + 10,
  })),
}));
