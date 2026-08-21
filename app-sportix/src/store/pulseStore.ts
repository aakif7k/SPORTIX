/**
 * src/store/pulseStore.ts
 */
import { create } from 'zustand';
import { PulseScore } from '../types';

interface PulseState {
  pulseScore:   PulseScore | null;
  levelProgress:number; // 0-1
  history:      Array<{ score: number; date: string }>;
  loading:      boolean;

  setPulseScore:    (score: PulseScore) => void;
  setLevelProgress: (progress: number) => void;
  setHistory:       (history: Array<{ score: number; date: string }>) => void;
  setLoading:       (loading: boolean) => void;
}

export const usePulseStore = create<PulseState>((set) => ({
  pulseScore:    null,
  levelProgress: 0,
  history:       [],
  loading:       false,

  setPulseScore:    (pulseScore) => set({ pulseScore }),
  setLevelProgress: (levelProgress) => set({ levelProgress }),
  setHistory:       (history) => set({ history }),
  setLoading:       (loading) => set({ loading }),
}));
