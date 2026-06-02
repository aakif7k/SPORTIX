import { create } from 'zustand';
import type { PulseScore } from '../types/pulse.types';

interface PulseStoreState {
  pulseScore: PulseScore;
  addScoreDelta: (deltas: {
    matchPerf: number;
    consistency: number;
    chemistry: number;
    reliability: number;
    activity: number;
    leadership: number;
  }, totalDelta: number) => void;
}

const initialHistory = [
  { date: '2026-05-10', score: 680, delta: 12, matchId: 'm1' },
  { date: '2026-05-12', score: 695, delta: 15, matchId: 'm2' },
  { date: '2026-05-15', score: 710, delta: 15, matchId: 'm3' },
  { date: '2026-05-18', score: 721, delta: 11, matchId: 'm4' },
];

export const usePulseStore = create<PulseStoreState>((set) => ({
  pulseScore: {
    userId: 'me',
    score: 721,
    tier: 'CONTENDER',
    breakdown: {
      matchPerf: 74,
      consistency: 78,
      chemistry: 82,
      reliability: 90,
      activity: 85,
      leadership: 68,
    },
    history: initialHistory,
    lastUpdated: '2026-05-18T18:00:00Z',
  },
  addScoreDelta: (deltas, totalDelta) => set((state) => {
    const newScore = Math.max(0, Math.min(1000, state.pulseScore.score + totalDelta));
    let newTier: 'CONTENDER' | 'ELITE' | 'PULSE ELITE' = 'CONTENDER';
    if (newScore >= 900) {
      newTier = 'PULSE ELITE';
    } else if (newScore >= 800) {
      newTier = 'ELITE';
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newHistoryItem = {
      date: todayStr,
      score: newScore,
      delta: totalDelta,
      matchId: `m${state.pulseScore.history.length + 1}`
    };

    return {
      pulseScore: {
        ...state.pulseScore,
        score: newScore,
        tier: newTier,
        breakdown: {
          matchPerf: Math.max(0, Math.min(100, state.pulseScore.breakdown.matchPerf + deltas.matchPerf)),
          consistency: Math.max(0, Math.min(100, state.pulseScore.breakdown.consistency + deltas.consistency)),
          chemistry: Math.max(0, Math.min(100, state.pulseScore.breakdown.chemistry + deltas.chemistry)),
          reliability: Math.max(0, Math.min(100, state.pulseScore.breakdown.reliability + deltas.reliability)),
          activity: Math.max(0, Math.min(100, state.pulseScore.breakdown.activity + deltas.activity)),
          leadership: Math.max(0, Math.min(100, state.pulseScore.breakdown.leadership + deltas.leadership)),
        },
        history: [...state.pulseScore.history, newHistoryItem],
        lastUpdated: new Date().toISOString(),
      }
    };
  }),
}));
