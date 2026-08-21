/**
 * src/store/matchStore.ts
 */
import { create } from 'zustand';
import { Match, PlayerStat } from '../types';

interface MatchState {
  myMatches:          Match[];
  pendingValidations: PlayerStat[];
  loading:            boolean;

  setMyMatches:          (matches: Match[]) => void;
  setPendingValidations: (stats: PlayerStat[]) => void;
  setLoading:            (loading: boolean) => void;
  addMatch:              (match: Match) => void;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  myMatches:          [],
  pendingValidations: [],
  loading:            false,

  setMyMatches:          (myMatches) => set({ myMatches }),
  setPendingValidations: (pendingValidations) => set({ pendingValidations }),
  setLoading:            (loading) => set({ loading }),
  addMatch:              (match) => set({ myMatches: [match, ...get().myMatches] }),
}));
