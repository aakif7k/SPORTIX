import { create } from 'zustand';
import type { MatchResult } from '../types/pulse.types';

interface MatchStoreState {
  currentMatch: MatchResult | null;
  currentStep: number;
  userStats: Record<string, string | number | boolean>;
  validationVotes: Record<string, 'confirm' | 'partial' | 'dispute'>;
  validationReasons: Record<string, string>;
  retentionVote: 'definitely' | 'maybe' | 'no' | null;
  setCurrentMatch: (match: MatchResult | null) => void;
  setStep: (step: number) => void;
  setUserStats: (stats: Record<string, string | number | boolean>) => void;
  submitValidation: (teammateId: string, status: 'confirm' | 'partial' | 'dispute', reason?: string) => void;
  setRetentionVote: (vote: 'definitely' | 'maybe' | 'no') => void;
  resetFlow: () => void;
}

export const useMatchStore = create<MatchStoreState>((set) => ({
  currentMatch: {
    matchId: 'm_post_1',
    squadId: 'squad-1',
    opponentName: 'Apex Rangers',
    result: 'W',
    score: '3 - 2',
    date: new Date().toISOString().split('T')[0],
    chemistryDelta: 8,
    topPerformer: {
      uid: 'u1',
      name: 'Marcus Reid',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      statsSummary: '2 Goals, 1 Assist'
    },
    playerStats: {},
    validations: {},
    retentionVotes: {}
  },
  currentStep: 1,
  userStats: {},
  validationVotes: {},
  validationReasons: {},
  retentionVote: null,
  setCurrentMatch: (match) => set({ currentMatch: match }),
  setStep: (step) => set({ currentStep: step }),
  setUserStats: (stats) => set({ userStats: stats }),
  submitValidation: (teammateId, status, reason) => set((state) => ({
    validationVotes: { ...state.validationVotes, [teammateId]: status },
    validationReasons: reason ? { ...state.validationReasons, [teammateId]: reason } : state.validationReasons
  })),
  setRetentionVote: (vote) => set({ retentionVote: vote }),
  resetFlow: () => set({
    currentStep: 1,
    userStats: {},
    validationVotes: {},
    validationReasons: {},
    retentionVote: null
  })
}));
