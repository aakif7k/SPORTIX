/**
 * The post-match flow: validating teammates, the retention vote, and the Pulse
 * change the match actually produced.
 *
 * PostMatchReview drove all of this from matchStore and pulseStore: three
 * hardcoded teammates with invented Pulse scores and tiers, a hand-written stat
 * line for each, five fixed component deltas (+6, +3, +2, −1, +1) and a score
 * animation that always ran 721 → 732. Every endpoint it needed already existed.
 */
import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { api, ApiError } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import { careerKeys } from '@/hooks/useCareer';

export interface ApiMatchStatRow {
  $id: string;
  match_id: string;
  user_id: string;
  sport: string;
  match_rating: number;
  is_mvp: boolean;
  validation_status: 'pending' | 'validated' | 'disputed' | 'partial';
  confirm_votes: number;
  partial_votes: number;
  dispute_votes: number;
  pulse_earned: number;
  // Joined by the API from the athlete's profile.
  full_name: string;
  username: string;
  avatar_url: string | null;
  position: string | null;
  level: number;
  pulse_score: number;
  tier: string;
  stat_summary: Record<string, string | number>;
}

/** The Pulse components the server tracks, in the order the review screen lists them. */
export const PULSE_COMPONENTS = [
  { key: 'match_performance', label: 'Match Performance' },
  { key: 'team_chemistry', label: 'Team Chemistry' },
  { key: 'reliability', label: 'Reliability' },
  { key: 'consistency', label: 'Consistency' },
  { key: 'activity', label: 'Activity' },
  { key: 'leadership', label: 'Leadership' },
] as const;

export interface PulseSnapshot {
  total_pulse: number;
  match_performance: number;
  team_chemistry: number;
  reliability: number;
  consistency: number;
  activity: number;
  leadership: number;
  tier: string;
}

async function readPulse(): Promise<PulseSnapshot> {
  const res = await api.get<{ data: Partial<PulseSnapshot> }>('/api/pulse/me');
  const d = res.data ?? {};
  return {
    total_pulse: Number(d.total_pulse ?? 0),
    match_performance: Number(d.match_performance ?? 0),
    team_chemistry: Number(d.team_chemistry ?? 0),
    reliability: Number(d.reliability ?? 0),
    consistency: Number(d.consistency ?? 0),
    activity: Number(d.activity ?? 0),
    leadership: Number(d.leadership ?? 0),
    tier: String(d.tier ?? ''),
  };
}

/** Everyone's stat line for a match, for the validation step. */
export function useMatchStats(matchId?: string, excludeUserId?: string) {
  const query = useQuery<ApiMatchStatRow[], ApiError>({
    queryKey: ['matches', matchId ?? null, 'stats'],
    enabled: Boolean(matchId),
    queryFn: async () => {
      const res = await api.get<{ data: { items?: ApiMatchStatRow[] } }>(
        `/api/matches/${matchId}/stats`,
      );
      return res.data?.items ?? [];
    },
  });

  const rows = query.data ?? [];
  return {
    // You do not validate your own submission.
    teammates: excludeUserId ? rows.filter(r => r.user_id !== excludeUserId) : rows,
    mine: excludeUserId ? rows.find(r => r.user_id === excludeUserId) ?? null : null,
    loading: Boolean(matchId) && query.isPending,
    error: (query.error as ApiError | null) ?? null,
    refresh: query.refetch,
  };
}

export function usePostMatchActions(matchId?: string) {
  const queryClient = useQueryClient();

  // Taken before validations are cast, so the deltas shown afterwards are the
  // difference the match actually made rather than five fixed numbers.
  const [before, setBefore] = useState<PulseSnapshot | null>(null);
  const [after, setAfter] = useState<PulseSnapshot | null>(null);

  const snapshot = useCallback(async () => {
    try {
      setBefore(await readPulse());
    } catch {
      // A missing baseline means the review screen shows totals without deltas,
      // which is better than inventing them.
    }
  }, []);

  const validate = useMutation({
    mutationFn: (args: {
      statId: string; vote: 'confirm' | 'partial' | 'dispute'; reason?: string;
    }) => api.post(`/api/matches/${matchId}/validate/${args.statId}`, {
      vote: args.vote, reason: args.reason ?? null,
    }),
    onError: (e: ApiError) => toast.error(e.message || 'Could not record that vote'),
  });

  const finish = useMutation({
    // Validations are already recorded one by one; this reads the resulting Pulse
    // so the review screen can show the real movement.
    mutationFn: async () => readPulse(),
    onSuccess: result => {
      setAfter(result);
      queryClient.invalidateQueries({ queryKey: qk.pulse.all });
      queryClient.invalidateQueries({ queryKey: careerKeys.all });
    },
    onError: (e: ApiError) => toast.error(e.message || 'Could not read your Pulse'),
  });

  const retention = useMutation({
    mutationFn: (args: { targetId: string; vote: 'definitely' | 'maybe' | 'no' }) =>
      api.post(`/api/matches/${matchId}/retention`, {
        target_id: args.targetId, vote: args.vote,
      }),
    onSuccess: () => toast.success('Vote recorded'),
    onError: (e: ApiError) => toast.error(e.message || 'Could not record that vote'),
  });

  const deltas = before && after
    ? PULSE_COMPONENTS.map(({ key, label }) => ({
      label,
      value: Math.round((after[key] - before[key]) * 10) / 10,
    })).filter(d => d.value !== 0)
    : [];

  return {
    snapshotPulse: snapshot,
    validateStat: validate.mutateAsync,
    finishValidation: finish.mutateAsync,
    voteRetention: retention.mutateAsync,
    validating: validate.isPending,
    pulseBefore: before,
    pulseAfter: after,
    deltas,
  };
}
