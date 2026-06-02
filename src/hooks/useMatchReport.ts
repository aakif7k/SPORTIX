import { useMatchReportStore } from '../store/matchReportStore';
import type { MatchHistoryItem, PerformanceSport } from '../types/performance.types';

// ─── useMatchReport ───────────────────────────────────────────────────────────

export function useMatchReport() {
  const { matchHistory, submit, reset } = useMatchReportStore();

  const getMatchHistory = (filters?: {
    sport?: PerformanceSport;
    result?: string;
    period?: string;
  }): MatchHistoryItem[] => {
    let filtered = [...matchHistory];

    if (filters?.sport && filters.sport !== 'generic') {
      filtered = filtered.filter((m) => m.sport === filters.sport);
    }
    if (filters?.result && filters.result !== 'all') {
      filtered = filtered.filter((m) => m.matchResult === filters.result);
    }
    if (filters?.period === 'month') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      filtered = filtered.filter((m) => new Date(m.date) >= cutoff);
    }

    return filtered.sort((a, b) => b.date.localeCompare(a.date));
  };

  const getMatchDetail = (matchId: string): MatchHistoryItem | undefined =>
    matchHistory.find((m) => m.matchId === matchId);

  return { submit, reset, getMatchHistory, getMatchDetail, matchHistory };
}
