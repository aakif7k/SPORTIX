
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
  return {
    level: lvl,
    title: getLevelTitle(lvl),
    // Kept for display continuity; the server decides which level an athlete is on
    // and how far through it they are, so these bounds are not used to compute it.
    minPulse: (lvl - 1) * 100,
    maxPulse: lvl * 100,
    color: lvl > 100 ? '#CCFF00' : '#888888',
    icon: lvl > 100 ? '\u{1F451}' : '\u26A1',
  };
});

/**
 * The palette, title and icon for a level number.
 *
 * This replaces getLevelProgress(pulse), which derived the level from the
 * athlete's **current** Pulse as floor(pulse / 100) + 1. The server derives it
 * from **lifetime** earned Pulse, so the two disagreed the moment anyone spent
 * Pulse or lost any — and the client's answer could go down, which a level must
 * never do. The number and the progress now come from /api/pulse/me/level; this
 * module only says what that level looks like.
 */
export const levelStyleFor = (level: number): GamificationLevel =>
  LEVELS[Math.max(0, Math.min(LEVELS.length - 1, level - 1))];
