/**
 * src/store/aiSettingsStore.ts
 */
import { create } from 'zustand';

interface AISettingsState {
  preferredSport:     string;
  preferredFormation: string;
  autoAccept:         boolean;
  dailyQuotaUsed:     number;
  dailyQuotaLimit:    number;

  setPreferredSport:      (sport: string) => void;
  setPreferredFormation:  (formation: string) => void;
  setAutoAccept:          (autoAccept: boolean) => void;
  setDailyQuotaUsed:      (used: number) => void;
}

export const useAISettingsStore = create<AISettingsState>((set) => ({
  preferredSport:      '',
  preferredFormation:  '4-3-3',
  autoAccept:          false,
  dailyQuotaUsed:      0,
  dailyQuotaLimit:     5,

  setPreferredSport:     (preferredSport) => set({ preferredSport }),
  setPreferredFormation: (preferredFormation) => set({ preferredFormation }),
  setAutoAccept:         (autoAccept) => set({ autoAccept }),
  setDailyQuotaUsed:    (dailyQuotaUsed) => set({ dailyQuotaUsed }),
}));
