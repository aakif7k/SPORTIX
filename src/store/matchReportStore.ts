import { create } from 'zustand';
import type { MatchResult } from '../types/performance.types';

/**
 * Form state for filing a match report — and nothing else.
 *
 * This store used to own the whole feature: a MOCK_HISTORY career, a
 * MOCK_PENDING_MATCH fixture, and a `submit` that waited four seconds on a
 * setTimeout, computed Pulse, SSR and chemistry in the browser with a second copy
 * of the server's formulas, and reported a hardcoded jump from level 27 to 28 with
 * an invented rank unlock. None of it left the page, so a refresh erased a career.
 *
 * The career and the submission now live behind the API (`useCareer`,
 * `useSubmitReport`). What is left here is genuinely client state: which step of
 * the wizard you are on and what you have typed into it.
 */
interface MatchReportFormState {
  currentStep: 0 | 1 | 2;
  matchResult: MatchResult | null;
  sportStats: Record<string, number | string | boolean>;
  matchRating: number;
  position: string;
  isMvp: boolean;

  setStep: (step: 0 | 1 | 2) => void;
  setMatchResult: (result: MatchResult) => void;
  setStat: (key: string, value: number | string | boolean) => void;
  setRating: (rating: number) => void;
  setPosition: (position: string) => void;
  setMvp: (isMvp: boolean) => void;
  reset: () => void;
}

const EMPTY = {
  currentStep: 0 as const,
  matchResult: null,
  sportStats: {},
  matchRating: 7,
  position: '',
  isMvp: false,
};

export const useMatchReportStore = create<MatchReportFormState>((set) => ({
  ...EMPTY,

  setStep: (step) => set({ currentStep: step }),
  setMatchResult: (result) => set({ matchResult: result }),
  setStat: (key, value) => set((s) => ({ sportStats: { ...s.sportStats, [key]: value } })),
  setRating: (rating) => set({ matchRating: rating }),
  setPosition: (position) => set({ position }),
  setMvp: (isMvp) => set({ isMvp }),
  reset: () => set({ ...EMPTY }),
}));

/**
 * Dismiss the "you have a match to report" banner for 24 hours. Kept out of the
 * store because it is browser state, not form state, and usePendingReport reads
 * the same key.
 */
export function dismissPendingReport(): void {
  localStorage.setItem('sportix_pending_dismissed', Date.now().toString());
}
