import { create } from 'zustand';
import type {
  MatchResult,
  PerformanceSport,
  ReportResult,
  MatchHistoryItem,
  ValidationStatus,
} from '../types/performance.types';
import { calculatePulse, calculateSSRDelta, calculateChemistryDelta } from '../services/performanceService';

// ─── MOCK MATCH HISTORY ───────────────────────────────────────────────────────

const MOCK_HISTORY: MatchHistoryItem[] = [
  {
    id: 'mh1',
    matchId: 'match-001',
    eventName: 'Berlin 5v5 Championship',
    sport: 'football',
    matchResult: 'win',
    date: '2026-05-20',
    pulseEarned: 91,
    ssrDelta: 0.4,
    matchRating: 8,
    isMvp: true,
    validationStatus: 'validated',
    statSummary: { Goals: 2, Assists: 1, Passes: 34, Rating: '8/10' },
  },
  {
    id: 'mh2',
    matchId: 'match-002',
    eventName: 'Urban Streetball Showdown',
    sport: 'basketball',
    matchResult: 'win',
    date: '2026-05-15',
    pulseEarned: 74,
    ssrDelta: 0.3,
    matchRating: 7,
    isMvp: false,
    validationStatus: 'validated',
    statSummary: { Points: 22, Assists: 5, Rebounds: 8, Rating: '7/10' },
  },
  {
    id: 'mh3',
    matchId: 'match-003',
    eventName: 'Metropolitan Cup 2026',
    sport: 'football',
    matchResult: 'draw',
    date: '2026-05-10',
    pulseEarned: 42,
    ssrDelta: 0.1,
    matchRating: 6,
    isMvp: false,
    validationStatus: 'validated',
    statSummary: { Goals: 1, Assists: 0, Passes: 28, Rating: '6/10' },
  },
  {
    id: 'mh4',
    matchId: 'match-004',
    eventName: 'Euro Cricket Open',
    sport: 'cricket',
    matchResult: 'win',
    date: '2026-04-28',
    pulseEarned: 67,
    ssrDelta: 0.3,
    matchRating: 7,
    isMvp: false,
    validationStatus: 'partial',
    statSummary: { Runs: 67, Wickets: 2, Catches: 1, Rating: '7/10' },
  },
  {
    id: 'mh5',
    matchId: 'match-005',
    eventName: 'Alpha Cup Quarter-Final',
    sport: 'football',
    matchResult: 'loss',
    date: '2026-04-15',
    pulseEarned: 28,
    ssrDelta: -0.1,
    matchRating: 5,
    isMvp: false,
    validationStatus: 'validated',
    statSummary: { Goals: 0, Assists: 1, Passes: 19, Rating: '5/10' },
  },
];

// There's one pending report the user hasn't submitted yet
export const MOCK_PENDING_MATCH = {
  matchId: 'match-pending-001',
  eventName: 'Iron Pulse FC vs Rapid XI',
  sport: 'football' as PerformanceSport,
  date: '2026-05-28',
  daysAgo: 4,
};

// ─── STORE STATE ──────────────────────────────────────────────────────────────

interface MatchReportState {
  // Form state
  currentStep: 0 | 1 | 2;
  matchResult: MatchResult | null;
  sportStats: Record<string, number | string | boolean>;
  matchRating: number;
  position: string;
  isMvp: boolean;
  isSubmitting: boolean;
  submissionResult: ReportResult | null;
  showRewardScreen: boolean;

  // Data
  matchHistory: MatchHistoryItem[];
  hasPendingReport: boolean;

  // Actions
  setStep: (step: 0 | 1 | 2) => void;
  setMatchResult: (result: MatchResult) => void;
  setStat: (key: string, value: number | string | boolean) => void;
  setRating: (rating: number) => void;
  setPosition: (position: string) => void;
  setMvp: (isMvp: boolean) => void;
  submit: (sport: PerformanceSport) => Promise<ReportResult>;
  reset: () => void;
  dismissPendingReport: () => void;
  setShowRewardScreen: (show: boolean) => void;
}

// ─── STORE ────────────────────────────────────────────────────────────────────

export const useMatchReportStore = create<MatchReportState>((set, get) => ({
  // Form defaults
  currentStep: 0,
  matchResult: null,
  sportStats: {},
  matchRating: 7,
  position: '',
  isMvp: false,
  isSubmitting: false,
  submissionResult: null,
  showRewardScreen: false,

  // Data — in a real app these come from Firestore
  matchHistory: MOCK_HISTORY,
  hasPendingReport: true, // Start with a pending report for demo

  // ── Actions ──────────────────────────────────────────────────────────────

  setStep: (step) => set({ currentStep: step }),

  setMatchResult: (result) => set({ matchResult: result }),

  setStat: (key, value) =>
    set((s) => ({ sportStats: { ...s.sportStats, [key]: value } })),

  setRating: (rating) => set({ matchRating: rating }),

  setPosition: (position) => set({ position }),

  setMvp: (isMvp) => set({ isMvp }),

  setShowRewardScreen: (show) => set({ showRewardScreen: show }),

  submit: async (sport: PerformanceSport): Promise<ReportResult> => {
    const { sportStats, matchRating, isMvp, matchResult } = get();
    set({ isSubmitting: true });

    // Simulate API call
    await new Promise((r) => setTimeout(r, 4000));

    const result = matchResult ?? 'draw';
    const pulseEarned = calculatePulse(sport, sportStats as Record<string, number | string | boolean>, matchRating, isMvp, result);
    const ssrDelta     = calculateSSRDelta(sport, sportStats as Record<string, number | string | boolean>, matchRating, result);
    const chemDelta    = calculateChemistryDelta(isMvp, result, matchRating);

    // Build stat summary for history
    const statSummary: Record<string, string | number> = {};
    Object.entries(sportStats).forEach(([k, v]) => {
      if (typeof v === 'number' || typeof v === 'string') statSummary[k] = v;
    });
    statSummary['Rating'] = `${matchRating}/10`;

    const newReport: MatchHistoryItem = {
      id: `mh-${Date.now()}`,
      matchId: MOCK_PENDING_MATCH.matchId,
      eventName: MOCK_PENDING_MATCH.eventName,
      sport,
      matchResult: result,
      date: new Date().toISOString().split('T')[0],
      pulseEarned,
      ssrDelta,
      matchRating,
      isMvp,
      validationStatus: 'pending' as ValidationStatus,
      statSummary,
    };

    const reportResult: ReportResult = {
      pulseEarned,
      ssrDelta,
      chemistryDelta: chemDelta,
      leveledUp: pulseEarned > 80, // demo — level up if earned a lot
      oldLevel: 27,
      newLevel: 28,
      rankUnlocked: pulseEarned > 80 ? 'CONTENDER X' : undefined,
    };

    set((s) => ({
      isSubmitting: false,
      submissionResult: reportResult,
      showRewardScreen: true,
      hasPendingReport: false,
      matchHistory: [newReport, ...s.matchHistory],
    }));

    return reportResult;
  },

  reset: () =>
    set({
      currentStep: 0,
      matchResult: null,
      sportStats: {},
      matchRating: 7,
      position: '',
      isMvp: false,
      isSubmitting: false,
      submissionResult: null,
      showRewardScreen: false,
    }),

  dismissPendingReport: () => {
    // Dismiss for 24h via localStorage
    localStorage.setItem('sportix_pending_dismissed', Date.now().toString());
    set({ hasPendingReport: false });
    // Re-show after 1.5s in demo (would be 24h in production)
    setTimeout(() => set({ hasPendingReport: true }), 1500);
  },
}));
