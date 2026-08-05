import { create } from 'zustand';

/**
 * Wizard state for the post-match review — which step you are on and what you
 * have chosen so far.
 *
 * This store used to also hold `currentMatch`: a fixture describing a 3-2 win
 * over "Apex Rangers" with Marcus Reid as top performer, which every athlete saw
 * regardless of what they had actually played. The match, the teammates and the
 * Pulse movement all come from the API now (usePostMatch, usePendingReport).
 */
interface MatchFlowState {
  currentStep: number;
  userStats: Record<string, string | number | boolean>;
  validationVotes: Record<string, 'confirm' | 'partial' | 'dispute'>;
  validationReasons: Record<string, string>;
  retentionVote: 'definitely' | 'maybe' | 'no' | null;

  setStep: (step: number) => void;
  setUserStats: (stats: Record<string, string | number | boolean>) => void;
  recordVote: (statId: string, status: 'confirm' | 'partial' | 'dispute', reason?: string) => void;
  setRetentionVote: (vote: 'definitely' | 'maybe' | 'no') => void;
  resetFlow: () => void;
}

const EMPTY = {
  currentStep: 1,
  userStats: {},
  validationVotes: {},
  validationReasons: {},
  retentionVote: null,
};

export const useMatchStore = create<MatchFlowState>((set) => ({
  ...EMPTY,

  setStep: (step) => set({ currentStep: step }),
  setUserStats: (stats) => set({ userStats: stats }),
  recordVote: (statId, status, reason) => set((state) => ({
    validationVotes: { ...state.validationVotes, [statId]: status },
    validationReasons: reason
      ? { ...state.validationReasons, [statId]: reason }
      : state.validationReasons,
  })),
  setRetentionVote: (vote) => set({ retentionVote: vote }),
  resetFlow: () => set({ ...EMPTY }),
}));
