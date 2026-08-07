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
