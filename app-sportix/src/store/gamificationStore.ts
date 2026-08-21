/**
 * src/store/gamificationStore.ts
 */
import { create } from 'zustand';
import { UserMission, UserBadge, CoinTransaction } from '../types';

interface GamificationState {
  missions:        UserMission[];
  badges:          UserBadge[];
  coinBalance:     number;
  transactions:    CoinTransaction[];
  streakDays:      number;
  lastClaimDate:   string | null;
  loading:         boolean;

  setMissions:      (missions: UserMission[]) => void;
  setBadges:        (badges: UserBadge[]) => void;
  setCoinBalance:   (balance: number) => void;
  setTransactions:  (txns: CoinTransaction[]) => void;
  setStreakDays:    (days: number) => void;
  setLastClaimDate: (date: string | null) => void;
  setLoading:       (loading: boolean) => void;
}

export const useGamificationStore = create<GamificationState>((set) => ({
  missions:      [],
  badges:        [],
  coinBalance:   0,
  transactions:  [],
  streakDays:    0,
  lastClaimDate: null,
  loading:       false,

  setMissions:      (missions) => set({ missions }),
  setBadges:        (badges) => set({ badges }),
  setCoinBalance:   (coinBalance) => set({ coinBalance }),
  setTransactions:  (transactions) => set({ transactions }),
  setStreakDays:    (streakDays) => set({ streakDays }),
  setLastClaimDate: (lastClaimDate) => set({ lastClaimDate }),
  setLoading:       (loading) => set({ loading }),
}));
