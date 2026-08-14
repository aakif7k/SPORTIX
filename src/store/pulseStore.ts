import { create } from 'zustand';
import type { PulseScore } from '../types/pulse.types';
import { getPulseScore, updatePulseScore, subscribeToPulseScore } from '../services/pulseService';
import { useAuthStore } from './authStore';

interface PulseStoreState {
  pulseScore: PulseScore;
  isLoading: boolean;
  activeSubscription: (() => void) | null;
  loadUserPulse: (userId?: string) => Promise<void>;
  addScoreDelta: (deltas: {
    matchPerf: number;
    consistency: number;
    chemistry: number;
    reliability: number;
    activity: number;
    leadership: number;
  }, totalDelta: number, reason?: string) => Promise<void>;
  reset: () => void;
}

const getInitialPulseScore = (userId: string = ''): PulseScore => ({
  userId,
  score: 100,
  tier: 'CONTENDER',
  breakdown: {
    matchPerf: 0,
    consistency: 0,
    chemistry: 0,
    reliability: 0,
    activity: 0,
    leadership: 0,
  },
  history: [],
  lastUpdated: new Date().toISOString(),
});

export const usePulseStore = create<PulseStoreState>((set, get) => ({
  pulseScore: getInitialPulseScore(),
  isLoading: false,
  activeSubscription: null,

  loadUserPulse: async (targetUserId?: string) => {
    const userId = targetUserId || useAuthStore.getState().user?.id;
    if (!userId) return;

    set({ isLoading: true });
    try {
      const data = await getPulseScore(userId);
      
      // Cleanup previous subscription if any
      const existingSub = get().activeSubscription;
      if (existingSub) existingSub();

      // Subscribe to live changes on pulse_scores collection
      const unsubscribe = subscribeToPulseScore(userId, (updated) => {
        set((state) => ({
          pulseScore: {
            ...state.pulseScore,
            ...updated,
            history: state.pulseScore.history,
          }
        }));
      });

      set({
        pulseScore: data,
        isLoading: false,
        activeSubscription: unsubscribe,
      });
    } catch (err) {
      console.warn('[pulseStore] Error loading user pulse:', err);
      set({ isLoading: false });
    }
  },

  addScoreDelta: async (deltas, totalDelta, reason = 'Match Performance') => {
    const current = get().pulseScore;
    const userId = current.userId || useAuthStore.getState().user?.id || '';

    // Optimistic local state update
    const newScore = Math.max(0, Math.min(1000, current.score + totalDelta));
    let newTier: 'CONTENDER' | 'ELITE' | 'PULSE ELITE' = 'CONTENDER';
    if (newScore >= 900) newTier = 'PULSE ELITE';
    else if (newScore >= 800) newTier = 'ELITE';

    const todayStr = new Date().toISOString().split('T')[0];
    const newHistoryItem = {
      date: todayStr,
      score: newScore,
      delta: totalDelta,
      matchId: `m_${Date.now()}`
    };

    set((state) => ({
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
        history: [newHistoryItem, ...state.pulseScore.history],
        lastUpdated: new Date().toISOString(),
      }
    }));

    // Persist to Appwrite database collection pulse_scores and profiles
    if (userId) {
      try {
        await updatePulseScore(userId, deltas, totalDelta, reason);
      } catch (err) {
        console.error('[pulseStore] Failed to persist pulse delta to Appwrite:', err);
      }
    }
  },

  reset: () => {
    const existingSub = get().activeSubscription;
    if (existingSub) existingSub();
    set({ pulseScore: getInitialPulseScore(), activeSubscription: null });
  },
}));
