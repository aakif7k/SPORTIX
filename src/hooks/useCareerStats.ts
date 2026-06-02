import { useMatchReportStore } from '../store/matchReportStore';
import type { CareerStats, PerformanceSport } from '../types/performance.types';

// ─── useCareerStats ───────────────────────────────────────────────────────────
// Aggregates career stats from match history

export function useCareerStats(sport?: PerformanceSport): CareerStats {
  const { matchHistory } = useMatchReportStore();

  const filtered = sport
    ? matchHistory.filter((m) => m.sport === sport)
    : matchHistory;

  const wins   = filtered.filter((m) => m.matchResult === 'win').length;
  const losses = filtered.filter((m) => m.matchResult === 'loss').length;
  const draws  = filtered.filter((m) => m.matchResult === 'draw').length;
  const total  = filtered.length;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const totalPulse = filtered.reduce((acc, m) => acc + m.pulseEarned, 0);
  const currentSSR = 8.4 + filtered.reduce((acc, m) => acc + m.ssrDelta, 0);
  const ssrHistory = filtered.map((m) => m.ssrDelta);
  const recentSSR  = ssrHistory.slice(-5).reduce((a, b) => a + b, 0);
  const ssrTrend: 'up' | 'down' | 'stable' =
    recentSSR > 0.2 ? 'up' : recentSSR < -0.2 ? 'down' : 'stable';

  // Football-specific aggregation
  const footballMatches = matchHistory.filter((m) => m.sport === 'football');
  const totalGoals    = footballMatches.reduce((acc, m) => acc + (Number(m.statSummary?.Goals)   || 0), 0);
  const totalAssists  = footballMatches.reduce((acc, m) => acc + (Number(m.statSummary?.Assists)  || 0), 0);
  const avgRating     = footballMatches.length > 0
    ? Math.round(footballMatches.reduce((acc, m) => acc + m.matchRating, 0) / footballMatches.length * 10) / 10
    : 0;
  const mvpCount = matchHistory.filter((m) => m.isMvp).length;

  // Cricket
  const cricketMatches  = matchHistory.filter((m) => m.sport === 'cricket');
  const totalRuns    = cricketMatches.reduce((acc, m) => acc + (Number(m.statSummary?.Runs)    || 0), 0);
  const totalWickets = cricketMatches.reduce((acc, m) => acc + (Number(m.statSummary?.Wickets) || 0), 0);

  // Basketball
  const basketballMatches = matchHistory.filter((m) => m.sport === 'basketball');
  const totalPoints  = basketballMatches.reduce((acc, m) => acc + (Number(m.statSummary?.Points)   || 0), 0);
  const totalAst     = basketballMatches.reduce((acc, m) => acc + (Number(m.statSummary?.Assists)   || 0), 0);
  const avgRebounds  = basketballMatches.length > 0
    ? Math.round(basketballMatches.reduce((acc, m) => acc + (Number(m.statSummary?.Rebounds) || 0), 0) / basketballMatches.length * 10) / 10
    : 0;

  return {
    sport: sport ?? 'football',
    totalMatches: total,
    wins,
    losses,
    draws,
    winRate,
    totalPulseEarned: totalPulse,
    currentSSR: Math.round(currentSSR * 10) / 10,
    ssrTrend,
    football: {
      totalGoals,
      totalAssists,
      avgRating,
      mvpCount,
      bestMatch: 'vs Iron Pulse FC — 2 Goals, 1 Assist, 8/10',
    },
    cricket: {
      totalRuns,
      totalWickets,
      avgStrikeRate: 118,
      bestScore: 67,
    },
    basketball: {
      totalPoints,
      totalAssists: totalAst,
      avgRebounds,
      bestGame: '24 Pts, 6 Ast, 8 Reb',
    },
  };
}
