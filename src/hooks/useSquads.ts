/**
 * Squads, on the API.
 *
 * The existing useSquad reads squadStore, which is seeded from mockData and
 * persists nothing. This is the replacement; pages move onto it one at a time,
 * so both exist during the migration.
 *
 * Named useSquads (plural) to sit alongside the old useSquad without a clash —
 * the old one goes when the last page stops importing it.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { api, ApiError } from '@/lib/api';
import type {
  ApiSquad, ApiSquadMember, ApiSquadChemistry, SquadRole,
} from '@/types/api.types';

export const squadKeys = {
  all: ['squads'] as const,
  mine: () => ['squads', 'mine'] as const,
  detail: (id: string | undefined) => ['squads', 'detail', id ?? null] as const,
  members: (id: string | undefined) => ['squads', id ?? null, 'members'] as const,
  chemistry: (id: string | undefined) => ['squads', id ?? null, 'chemistry'] as const,
  analytics: (id: string | undefined) => ['squads', id ?? null, 'analytics'] as const,
};

function unwrapList<T>(data: unknown): T[] {
  const d = data as Record<string, unknown> | undefined;
  if (!d) return [];
  for (const key of ['items', 'documents', 'squads', 'members']) {
    if (Array.isArray(d[key])) return d[key] as T[];
  }
  return Array.isArray(d) ? (d as T[]) : [];
}

// ─── Reads ────────────────────────────────────────────────────────────────────
export function useMySquads() {
  const query = useQuery<ApiSquad[], ApiError>({
    queryKey: squadKeys.mine(),
    queryFn: async () => unwrapList<ApiSquad>(
      (await api.get<{ data: unknown }>('/api/squads/me')).data,
    ),
  });

  return {
    squads: query.data ?? [],
    loading: query.isPending,
    error: (query.error as ApiError | null) ?? null,
    refresh: query.refetch,
  };
}

export function useSquadDetail(squadId?: string) {
  const detail = useQuery<ApiSquad, ApiError>({
    queryKey: squadKeys.detail(squadId),
    enabled: Boolean(squadId),
    queryFn: async () => (await api.get<{ data: ApiSquad }>(`/api/squads/${squadId}`)).data,
  });

  const members = useQuery<ApiSquadMember[], ApiError>({
    queryKey: squadKeys.members(squadId),
    enabled: Boolean(squadId),
    queryFn: async () => unwrapList<ApiSquadMember>(
      (await api.get<{ data: unknown }>(`/api/squads/${squadId}/members`)).data,
    ),
  });

  return {
    squad: detail.data ?? null,
    members: members.data ?? [],
    loading: Boolean(squadId) && (detail.isPending || members.isPending),
    error: (detail.error as ApiError | null) ?? null,
  };
}

export function useSquadChemistry(squadId?: string) {
  const query = useQuery<ApiSquadChemistry, ApiError>({
    queryKey: squadKeys.chemistry(squadId),
    enabled: Boolean(squadId),
    queryFn: async () =>
      (await api.get<{ data: ApiSquadChemistry }>(`/api/squads/${squadId}/chemistry`)).data,
  });

  return {
    chemistry: query.data ?? null,
    loading: query.isPending && Boolean(squadId),
    error: (query.error as ApiError | null) ?? null,
  };
}

export function useSquadAnalytics(squadId?: string) {
  const query = useQuery<Record<string, unknown>, ApiError>({
    queryKey: squadKeys.analytics(squadId),
    enabled: Boolean(squadId),
    queryFn: async () =>
      (await api.get<{ data: Record<string, unknown> }>(`/api/squads/${squadId}/analytics`)).data,
  });

  return {
    analytics: query.data ?? null,
    loading: query.isPending && Boolean(squadId),
    error: (query.error as ApiError | null) ?? null,
  };
}

// ─── Writes ───────────────────────────────────────────────────────────────────
export function useSquadMutations(squadId?: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: squadKeys.all });

  const create = useMutation({
    mutationFn: async (input: {
      name: string; sport: string; formation?: string;
      tactical_notes?: string; max_members?: number;
    }) => (await api.post<{ data: ApiSquad }>('/api/squads/', input)).data,
    onSuccess: () => { toast.success('Squad created'); invalidate(); },
    onError: (e: ApiError) => toast.error(e.message || 'Could not create the squad'),
  });

  const update = useMutation({
    mutationFn: async (updates: Record<string, unknown>) =>
      (await api.put<{ data: ApiSquad }>(`/api/squads/${squadId}`, updates)).data,
    onSuccess: () => { toast.success('Squad updated'); invalidate(); },
    onError: (e: ApiError) => toast.error(e.message || 'Could not update the squad'),
  });

  const disband = useMutation({
    mutationFn: () => api.delete(`/api/squads/${squadId}`),
    onSuccess: () => { toast.success('Squad disbanded'); invalidate(); },
    onError: (e: ApiError) => toast.error(e.message || 'Could not disband the squad'),
  });

  const addMember = useMutation({
    mutationFn: (args: { user_id: string; role?: SquadRole; position?: string }) =>
      api.post(`/api/squads/${squadId}/members`, {
        user_id: args.user_id,
        role: args.role ?? 'member',
        position: args.position ?? null,
      }),
    onSuccess: () => { toast.success('Member added'); invalidate(); },
    onError: (e: ApiError) => toast.error(e.message || 'Could not add the member'),
  });

  const removeMember = useMutation({
    mutationFn: (targetUserId: string) =>
      api.delete(`/api/squads/${squadId}/members/${targetUserId}`),
    onSuccess: () => { toast.success('Member removed'); invalidate(); },
    onError: (e: ApiError) => toast.error(e.message || 'Could not remove the member'),
  });

  const updateRole = useMutation({
    mutationFn: (args: { targetUserId: string; role: SquadRole }) =>
      api.patch(`/api/squads/${squadId}/members/${args.targetUserId}/role`, { role: args.role }),
    onSuccess: () => { toast.success('Role updated'); invalidate(); },
    onError: (e: ApiError) => toast.error(e.message || 'Could not update the role'),
  });

  const updateTactics = useMutation({
    mutationFn: (args: { formation: string; tactical_notes?: string | null }) =>
      api.put(`/api/squads/${squadId}/tactics`, {
        formation: args.formation,
        tactical_notes: args.tactical_notes ?? null,
      }),
    onSuccess: () => { toast.success('Tactics saved'); invalidate(); },
    onError: (e: ApiError) => toast.error(e.message || 'Could not save the tactics'),
  });

  const voteLeadership = useMutation({
    mutationFn: (args: { candidate_id: string; vote?: 'approve' | 'reject' }) =>
      api.post<{ data: { new_captain_id: string | null; votes_needed: number } }>(
        `/api/squads/${squadId}/leadership/vote`,
        { candidate_id: args.candidate_id, vote: args.vote ?? 'approve' },
      ),
    onSuccess: res => {
      const promoted = res?.data?.new_captain_id;
      toast.success(promoted ? 'The squad has a new captain' : 'Vote recorded');
      invalidate();
    },
    onError: (e: ApiError) => toast.error(e.message || 'Could not record the vote'),
  });

  return {
    createSquad: create.mutateAsync,
    updateSquad: update.mutateAsync,
    disbandSquad: disband.mutateAsync,
    addMember: addMember.mutateAsync,
    removeMember: removeMember.mutateAsync,
    updateRole: updateRole.mutateAsync,
    updateTactics: updateTactics.mutateAsync,
    voteLeadership: voteLeadership.mutateAsync,
    creating: create.isPending,
    savingTactics: updateTactics.isPending,
  };
}
