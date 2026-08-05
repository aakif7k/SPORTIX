/**
 * AutoSquad generation.
 *
 * EventJoinModal called generateAIPulseSquad from services/squadAI in the browser
 * and tracked the daily quota with a zustand counter, so the limit reset on every
 * refresh and the generated squad existed only in that tab. The endpoint has been
 * there since phase 3: it scores real athletes by Pulse, enforces the quota
 * server-side against autosquad_requests, and records the request so it can be
 * accepted or rejected later.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { api, ApiError } from '@/lib/api';

export const autoSquadKeys = {
  all: ['autosquad'] as const,
  remaining: () => ['autosquad', 'remaining'] as const,
};

export interface ApiSuggestedPlayer {
  $id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  sport: string;
  position: string | null;
  experience_level: string;
  level: number;
  pulse_score: number;
}

export interface ApiGeneratedSquad {
  request_id: string;
  sport: string;
  skill_level: string;
  entry_type: string;
  suggested_players: ApiSuggestedPlayer[];
  chemistry_estimate?: number;
}

export function useAutoSquad() {
  const queryClient = useQueryClient();

  const remaining = useQuery<number, ApiError>({
    queryKey: autoSquadKeys.remaining(),
    queryFn: async () => {
      const res = await api.get<{ data: { remaining?: number } }>('/api/autosquad/remaining');
      return Number(res.data?.remaining ?? 0);
    },
  });

  const generate = useMutation({
    mutationFn: async (input: {
      sport: string;
      skill_level: string;
      entry_type: string;
      event_id?: string | null;
    }) => (await api.post<{ data: ApiGeneratedSquad }>('/api/autosquad/generate', {
      sport: input.sport,
      skill_level: input.skill_level,
      entry_type: input.entry_type,
      event_id: input.event_id ?? null,
    })).data,
    onSuccess: () => {
      // The quota moved server-side, so re-read it rather than decrementing here.
      queryClient.invalidateQueries({ queryKey: autoSquadKeys.all });
    },
    onError: (e: ApiError) => toast.error(e.message || 'Could not generate a squad'),
  });

  const accept = useMutation({
    mutationFn: (requestId: string) => api.post(`/api/autosquad/${requestId}/accept`, {}),
    onSuccess: () => {
      toast.success('Squad accepted');
      queryClient.invalidateQueries({ queryKey: autoSquadKeys.all });
      queryClient.invalidateQueries({ queryKey: ['squads'] });
    },
    onError: (e: ApiError) => toast.error(e.message || 'Could not accept that squad'),
  });

  const reject = useMutation({
    mutationFn: (requestId: string) => api.post(`/api/autosquad/${requestId}/reject`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: autoSquadKeys.all }),
    onError: (e: ApiError) => toast.error(e.message || 'Could not reject that squad'),
  });

  return {
    remaining: remaining.data ?? 0,
    remainingLoading: remaining.isPending,
    generateSquad: generate.mutateAsync,
    acceptSquad: accept.mutateAsync,
    rejectSquad: reject.mutateAsync,
    generating: generate.isPending,
  };
}
