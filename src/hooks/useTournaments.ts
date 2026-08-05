/**
 * Tournaments, on the API.
 *
 * TournamentHub had no data source at all — the featured championship, the
 * standings and the bracket were literals, and registering only set component
 * state. Standings and brackets are computed by the server from recorded
 * matches, so nothing here derives a record or a position.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { api, ApiError } from '@/lib/api';
import type {
  ApiTournament, ApiTournamentDetail, TournamentStatus,
} from '@/types/api.types';

export const tournamentKeys = {
  all: ['tournaments'] as const,
  list: (filters?: { status?: TournamentStatus; sport?: string }) =>
    ['tournaments', 'list', filters?.status ?? null, filters?.sport ?? null] as const,
  detail: (id: string | undefined) => ['tournaments', 'detail', id ?? null] as const,
};

function unwrapItems<T>(data: unknown): T[] {
  const d = data as { items?: unknown } | undefined;
  return Array.isArray(d?.items) ? (d.items as T[]) : [];
}

export function useTournaments(filters?: { status?: TournamentStatus; sport?: string }) {
  const query = useQuery<ApiTournament[], ApiError>({
    queryKey: tournamentKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.sport) params.set('sport', filters.sport);
      const suffix = params.toString() ? `?${params}` : '';
      return unwrapItems<ApiTournament>(
        (await api.get<{ data: unknown }>(`/api/tournaments/${suffix}`)).data,
      );
    },
  });

  return {
    tournaments: query.data ?? [],
    loading: query.isPending,
    error: (query.error as ApiError | null) ?? null,
    refresh: query.refetch,
  };
}

export function useTournament(tournamentId?: string) {
  const query = useQuery<ApiTournamentDetail, ApiError>({
    queryKey: tournamentKeys.detail(tournamentId),
    enabled: Boolean(tournamentId),
    queryFn: async () =>
      (await api.get<{ data: ApiTournamentDetail }>(
        `/api/tournaments/${tournamentId}`)).data,
  });

  return {
    tournament: query.data ?? null,
    loading: Boolean(tournamentId) && query.isPending,
    error: (query.error as ApiError | null) ?? null,
    refresh: query.refetch,
  };
}

export function useTournamentEntry() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: tournamentKeys.all });

  const register = useMutation({
    mutationFn: (args: { tournamentId: string; squadId: string }) =>
      api.post(`/api/tournaments/${args.tournamentId}/register`, { squad_id: args.squadId }),
    onSuccess: () => { toast.success('Squad entered'); invalidate(); },
    onError: (e: ApiError) => toast.error(e.message || 'Could not enter that squad'),
  });

  const withdraw = useMutation({
    mutationFn: (args: { tournamentId: string; squadId: string }) =>
      api.post(`/api/tournaments/${args.tournamentId}/withdraw`, { squad_id: args.squadId }),
    onSuccess: () => { toast.success('Squad withdrawn'); invalidate(); },
    onError: (e: ApiError) => toast.error(e.message || 'Could not withdraw that squad'),
  });

  return {
    registerSquad: register.mutateAsync,
    withdrawSquad: withdraw.mutateAsync,
    entering: register.isPending || withdraw.isPending,
  };
}
