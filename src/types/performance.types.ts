// ─── PERFORMANCE TYPES ───────────────────────────────────────────────────────

export type PerformanceSport = 'football' | 'cricket' | 'basketball' | 'running' | 'generic';

export type MatchResult = 'win' | 'loss' | 'draw';

export type ValidationStatus =
  | 'pending'
  | 'validated'
  | 'verified'
  | 'submitted'
  | 'disputed'
  | 'partial'
  | 'correction_requested'
  | 'rectified';

// ─── SPORT-SPECIFIC STAT INTERFACES ──────────────────────────────────────────

export interface FootballStats {
  goals: number;
  assists: number;
  passes: number;
  tackles: number;
  saves?: number; // Only for GK
  position: string;
}

export interface CricketStats {
  runs: number;
  wickets: number;
  catches: number;
  ballsFaced: number;
  strikeRate: number; // auto-calculated
  role: string;
}

export interface BasketballStats {
  points: number;
  assists: number;
  rebounds: number;
  steals: number;
  blocks: number;
  position: string;
}

export interface RunningStats {
  finishTimeSeconds: number;
  distanceKm: number;
  avgPaceSeconds: number;
  personalBest: boolean;
  positionFinished: number;
}

export interface GenericStats {
  contribution: number;
  mvp: boolean;
  teamImpact: 'low' | 'medium' | 'high' | 'outstanding';
}

export type SportStats =
  | FootballStats
  | CricketStats
  | BasketballStats
  | RunningStats
  | GenericStats
  | Record<string, number | string | boolean>;

// ─── MATCH REPORT ──────────────────────────────────────────────────────────────

export interface MatchReport {
  id: string;
  matchId: string;
  userId: string;
  sport: PerformanceSport;
  matchResult: MatchResult;
  stats: SportStats;
  matchRating: number; // 1–10
  isMvp: boolean;
  pulseEarned: number;
  ssrDelta: number;
  chemistryDelta: number;
  validationStatus: ValidationStatus;
  submittedAt: string;
  createdAt: string;
  eventName: string;
  opponentName?: string;
}

// ─── CAREER STATS ────────────────────────────────────────────────────────────

export interface CareerStats {
  sport: PerformanceSport;
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  totalPulseEarned: number;
  currentSSR: number;
  ssrTrend: 'up' | 'down' | 'stable';
  football?: {
    totalGoals: number;
    totalAssists: number;
    avgRating: number;
    mvpCount: number;
    bestMatch?: string;
  };
  cricket?: {
    totalRuns: number;
    totalWickets: number;
    avgStrikeRate: number;
    bestScore?: number;
  };
  basketball?: {
    totalPoints: number;
    totalAssists: number;
    avgRebounds: number;
    bestGame?: string;
  };
}

// ─── SUBMISSION RESULT ────────────────────────────────────────────────────────

export interface ReportResult {
  pulseEarned: number;
  ssrDelta: number;
  chemistryDelta: number;
  leveledUp: boolean;
  oldLevel?: number;
  newLevel?: number;
  rankUnlocked?: string;
  badgeUnlocked?: string;
}

// ─── PENDING MATCH ────────────────────────────────────────────────────────────

export interface PendingMatch {
  matchId: string;
  eventName: string;
  sport: PerformanceSport;
  date: string;
  daysAgo: number;
}

// ─── MATCH HISTORY ITEM (flattened for display) ───────────────────────────────

export interface MatchHistoryItem {
  id: string;
  matchId: string;
  eventName: string;
  sport: PerformanceSport;
  matchResult: MatchResult;
  date: string;
  pulseEarned: number;
  ssrDelta: number;
  matchRating: number;
  isMvp: boolean;
  validationStatus: ValidationStatus;
  isPending?: boolean;
  statSummary: Record<string, string | number>; // display-ready
}
