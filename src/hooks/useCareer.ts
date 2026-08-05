/**
 * An athlete's match history, career aggregates, and filing a match report.
 *
 * Replaces useMatchReport and useCareerStats, which read matchReportStore: the
 * career arithmetic ran in the browser, the store persisted nothing (a refresh
 * emptied a career), and `submit` waited four seconds on a setTimeout, computed
 * Pulse and SSR client-side, and reported a hardcoded jump from level 27 to 28.
 *
 * The server owns all of it. Nothing here derives a total, a rating or a level.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { api, ApiError } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import type { PerformanceSport } from '@/types/performance.types';

export const careerKeys = {
  all: ['career'] as const,
  history: (f?: { sport?: string; result?: string; period?: string }) =>
    ['career', 'history', f?.sport ?? null, f?.result ?? null, f?.period ?? null] as const,
  stats: (sport?: string) => ['career', 'stats', sport ?? null] as const,
};

export interface ApiMatchHistoryItem {
  id: string;
  match_id: string;
  event_name: string;
  sport: PerformanceSport;
  match_result: 'win' | 'loss' | 'draw' | 'pending';
  date: string | null;
  pulse_earned: number;
  ssr_delta: number;
  match_rating: number;
  is_mvp: boolean;
  validation_status: 'pending' | 'validated' | 'disputed' | 'partial';
  /** True until three teammates confirm; such rows are excluded from the career. */
  is_pending: boolean;
  stat_summary: Record<string, string | number>;
  confirm_votes: number;
  dispute_votes: number;
}

export interface ApiCareerStats {
  sport: string;
  total_matches: number;
  wins: number;
  losses: number;
  draws: number;
  win_rate: number;
  total_pulse_earned: number;
  /** Null when nothing has been validated yet — deliberately not a flattering default. */
  current_ssr: number | null;
  ssr_trend: 'up' | 'down' | 'stable';
  mvp_count: number;
  pending_count: number;
  football?: { total_goals: number; total_assists: number; avg_rating: number; mvp_count: number };
  cricket?: { total_runs: number; total_wickets: number; avg_strike_rate: number; best_score: number };
  basketball?: { total_points: number; total_assists: number; avg_rebounds: number };
}

/** What the server reports back after a match report is filed. */
export interface ApiReportResult {
  $id: string;
  pulse_earned: number;
  ssr_delta: number;
  chemistry_delta: number;
  level: number;
  previous_level: number;
  leveled_up: boolean;
  tier: string;
  total_pulse: number;
}

function items<T>(data: unknown): T[] {
  const d = data as { items?: unknown } | undefined;
  return Array.isArray(d?.items) ? (d.items as T[]) : [];
}

export function useMatchHistory(filters?: {
  sport?: PerformanceSport; result?: string; period?: string;
}) {
  const query = useQuery<ApiMatchHistoryItem[], ApiError>({
    queryKey: careerKeys.history(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      // 'generic' is the "all sports" sentinel in the UI, not a real sport.
      if (filters?.sport && filters.sport !== 'generic') params.set('sport', filters.sport);
      if (filters?.result && filters.result !== 'all') params.set('result', filters.result);
      if (filters?.period && filters.period !== 'all') params.set('period', filters.period);
      const suffix = params.toString() ? `?${params}` : '';
      return items<ApiMatchHistoryItem>(
        (await api.get<{ data: unknown }>(`/api/matches/me/history${suffix}`)).data,
      );
    },
  });

  return {
    matches: query.data ?? [],
    loading: query.isPending,
    error: (query.error as ApiError | null) ?? null,
    refresh: query.refetch,
  };
}

export function useCareer(sport?: PerformanceSport) {
  const query = useQuery<ApiCareerStats, ApiError>({
    queryKey: careerKeys.stats(sport),
    queryFn: async () => {
      const suffix = sport && sport !== 'generic' ? `?sport=${sport}` : '';
      return (await api.get<{ data: ApiCareerStats }>(`/api/matches/me/career${suffix}`)).data;
    },
  });

  return {
    career: query.data ?? null,
    loading: query.isPending,
    error: (query.error as ApiError | null) ?? null,
    refresh: query.refetch,
  };
}

/**
 * File a match report.
 *
 * The stat keys are sent as the sport form collected them; the server stores the
 * blob and computes Pulse, SSR, chemistry and the level move, so the reward screen
 * shows what actually happened rather than a fixture.
 */
export function useSubmitReport() {
  const queryClient = useQueryClient();

  const submit = useMutation({
    mutationFn: async (args: {
      matchId: string;
      sport: PerformanceSport;
      stats: Record<string, number | string | boolean>;
      matchRating: number;
      isMvp: boolean;
      mediaProofUrl?: string | null;
    }) => (await api.post<{ data: ApiReportResult }>(
      `/api/matches/${args.matchId}/stats`,
      {
        match_id: args.matchId,
        sport: args.sport,
        stats_data: args.stats,
        match_rating: args.matchRating,
        is_mvp: args.isMvp,
        media_proof_url: args.mediaProofUrl ?? null,
      },
    )).data,
    onSuccess: () => {
      // Pulse, level and the career record all moved server-side.
      queryClient.invalidateQueries({ queryKey: careerKeys.all });
      queryClient.invalidateQueries({ queryKey: qk.pulse.all });
      queryClient.invalidateQueries({ queryKey: qk.matches.all });
      queryClient.invalidateQueries({ queryKey: qk.profile.all });
    },
    onError: (e: ApiError) => toast.error(e.message || 'Could not file that report'),
  });

  return {
    submitReport: submit.mutateAsync,
    submitting: submit.isPending,
    result: submit.data ?? null,
    reset: submit.reset,
  };
}
