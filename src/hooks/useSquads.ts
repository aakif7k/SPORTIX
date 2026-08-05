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
  ApiSquadMatch, ApiLeadership,
} from '@/types/api.types';

export const squadKeys = {
  all: ['squads'] as const,
  events: (id: string | undefined) => ['squads', id ?? null, 'events'] as const,
  posts: (id: string | undefined) => ['squads', id ?? null, 'posts'] as const,
  achievements: (id: string | undefined) => ['squads', id ?? null, 'achievements'] as const,
  mine: () => ['squads', 'mine'] as const,
  detail: (id: string | undefined) => ['squads', 'detail', id ?? null] as const,
  members: (id: string | undefined) => ['squads', id ?? null, 'members'] as const,
  chemistry: (id: string | undefined) => ['squads', id ?? null, 'chemistry'] as const,
  analytics: (id: string | undefined) => ['squads', id ?? null, 'analytics'] as const,
  matches: (id: string | undefined) => ['squads', id ?? null, 'matches'] as const,
  leadership: (id: string | undefined) => ['squads', id ?? null, 'leadership'] as const,
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

export function useSquadMatches(squadId?: string) {
  const query = useQuery<ApiSquadMatch[], ApiError>({
    queryKey: squadKeys.matches(squadId),
    enabled: Boolean(squadId),
    queryFn: async () => unwrapList<ApiSquadMatch>(
      (await api.get<{ data: unknown }>(`/api/squads/${squadId}/matches`)).data,
    ),
  });

  return {
    matches: query.data ?? [],
    loading: Boolean(squadId) && query.isPending,
    error: (query.error as ApiError | null) ?? null,
    refresh: query.refetch,
  };
}

export function useLeadership(squadId?: string) {
  const query = useQuery<ApiLeadership, ApiError>({
    queryKey: squadKeys.leadership(squadId),
    enabled: Boolean(squadId),
    queryFn: async () =>
      (await api.get<{ data: ApiLeadership }>(`/api/squads/${squadId}/leadership`)).data,
  });

  return {
    leadership: query.data ?? null,
    loading: Boolean(squadId) && query.isPending,
    error: (query.error as ApiError | null) ?? null,
    refresh: query.refetch,
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
    // squadId can be overridden per call: a squad created in the same action does
    // not exist when this hook is instantiated, which is the case when a suggested
    // lineup is turned into a real squad.
    mutationFn: (args: {
      user_id: string; role?: SquadRole; position?: string; squadId?: string;
    }) =>
      api.post(`/api/squads/${args.squadId ?? squadId}/members`, {
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

// ─── Squad activity: scheduling, feed, achievements ───────────────────────────
// These back UI that shipped with no server behind it at all.

export interface ApiSquadEvent {
  $id: string;
  squad_id: string;
  title: string;
  type: 'practice' | 'match' | 'social';
  starts_at: string;
  venue: string | null;
  notes: string | null;
  created_by: string;
  status: 'scheduled' | 'confirmed' | 'cancelled';
  votes: { yes: number; maybe: number; no: number };
  my_vote: 'yes' | 'maybe' | 'no' | null;
  total_members: number;
  created_at: string;
}

export interface ApiSquadPost {
  $id: string;
  squad_id: string;
  author_id: string;
  author_name: string | null;
  author_avatar_url: string | null;
  content: string;
  media_url: string | null;
  likes_count: number;
  is_liked: boolean;
  created_at: string;
  $createdAt: string;
}

export interface ApiSquadAchievement {
  key: string;
  name: string;
  description: string | null;
  icon: string | null;
  unlocked: boolean;
  unlocked_at: string | null;
}

export function useSquadEvents(squadId?: string) {
  const queryClient = useQueryClient();
  const key = squadKeys.events(squadId);

  const query = useQuery<ApiSquadEvent[], ApiError>({
    queryKey: key,
    enabled: Boolean(squadId),
    queryFn: async () => unwrapList<ApiSquadEvent>(
      (await api.get<{ data: unknown }>(`/api/squads/${squadId}/events`)).data,
    ),
  });

  const create = useMutation({
    mutationFn: (input: {
      title: string; starts_at: string;
      type?: 'practice' | 'match' | 'social'; venue?: string; notes?: string;
    }) => api.post(`/api/squads/${squadId}/events`, input),
    onSuccess: () => { toast.success('Session scheduled'); void queryClient.invalidateQueries({ queryKey: key }); },
    onError: (e: ApiError) => toast.error(e.message || 'Could not schedule that'),
  });

  const vote = useMutation({
    mutationFn: (args: { eventId: string; vote: 'yes' | 'maybe' | 'no' }) =>
      api.post(`/api/squads/events/${args.eventId}/vote`, { vote: args.vote }),
    // Optimistic so the availability pill flips immediately.
    onMutate: async ({ eventId, vote }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ApiSquadEvent[]>(key);
      queryClient.setQueryData<ApiSquadEvent[]>(key, old => old?.map(e =>
        e.$id === eventId ? { ...e, my_vote: vote } : e));
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous);
      toast.error('Could not record your availability');
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: key }),
  });

  const cancel = useMutation({
    mutationFn: (eventId: string) => api.delete(`/api/squads/events/${eventId}`),
    onSuccess: () => { toast.success('Session cancelled'); void queryClient.invalidateQueries({ queryKey: key }); },
    onError: (e: ApiError) => toast.error(e.message || 'Could not cancel that'),
  });

  return {
    events: query.data ?? [],
    loading: query.isPending && Boolean(squadId),
    error: (query.error as ApiError | null) ?? null,
    createEvent: create.mutateAsync,
    voteEvent: (eventId: string, v: 'yes' | 'maybe' | 'no') => vote.mutate({ eventId, vote: v }),
    cancelEvent: cancel.mutateAsync,
    scheduling: create.isPending,
  };
}

export function useSquadPosts(squadId?: string) {
  const queryClient = useQueryClient();
  const key = squadKeys.posts(squadId);

  const query = useQuery<ApiSquadPost[], ApiError>({
    queryKey: key,
    enabled: Boolean(squadId),
    queryFn: async () => unwrapList<ApiSquadPost>(
      (await api.get<{ data: unknown }>(`/api/squads/${squadId}/posts`)).data,
    ),
  });

  const create = useMutation({
    mutationFn: (input: { content: string; media_url?: string | null }) =>
      api.post(`/api/squads/${squadId}/posts`, input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: key }),
    onError: (e: ApiError) => toast.error(e.message || 'Could not post that'),
  });

  const like = useMutation({
    mutationFn: (postId: string) => api.post(`/api/squads/posts/${postId}/like`),
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ApiSquadPost[]>(key);
      queryClient.setQueryData<ApiSquadPost[]>(key, old => old?.map(p =>
        p.$id === postId
          ? { ...p, is_liked: !p.is_liked, likes_count: p.likes_count + (p.is_liked ? -1 : 1) }
          : p));
      return { previous };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous);
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: key }),
  });

  return {
    posts: query.data ?? [],
    loading: query.isPending && Boolean(squadId),
    error: (query.error as ApiError | null) ?? null,
    createPost: create.mutateAsync,
    likePost: (postId: string) => like.mutate(postId),
    posting: create.isPending,
  };
}

export function useSquadAchievements(squadId?: string) {
  const query = useQuery<
    { items: ApiSquadAchievement[]; unlocked_count: number; total: number }, ApiError
  >({
    queryKey: squadKeys.achievements(squadId),
    enabled: Boolean(squadId),
    queryFn: async () => {
      const res = await api.get<{
        data: { items?: ApiSquadAchievement[]; unlocked_count?: number; total?: number };
      }>(`/api/squads/${squadId}/achievements`);
      return {
        items: res.data?.items ?? [],
        unlocked_count: res.data?.unlocked_count ?? 0,
        total: res.data?.total ?? 0,
      };
    },
  });

  return {
    achievements: query.data?.items ?? [],
    unlockedCount: query.data?.unlocked_count ?? 0,
    loading: query.isPending && Boolean(squadId),
    error: (query.error as ApiError | null) ?? null,
  };
}

// ─── Invitations and the activity feed ────────────────────────────────────────
// SquadFormation's invitations tab held two fabricated invites and its activity tab
// five fabricated lines. Both have backends now.

export interface ApiSquadInvite {
  $id: string;
  squad_id: string;
  invited_user_id: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  position: string | null;
  message: string | null;
  expires_at: string | null;
  created_at: string;
  squad: {
    squad_id: string;
    name: string;
    sport: string;
    logo_url: string | null;
    chemistry_score: number;
    members_count: number;
  };
  inviter: {
    user_id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
    level: number;
    pulse_score: number;
  };
  /** Status alone cannot say this: a row can be `pending` and long past its deadline. */
  is_expired: boolean;
  expires_in_seconds: number;
}

export interface ApiSquadActivity {
  id: string;
  type: 'post' | 'event' | 'message' | 'achievement';
  squad_id: string;
  squad_name: string;
  text: string;
  detail: string;
  at: string;
}

export function useMyInvites() {
  const queryClient = useQueryClient();

  const query = useQuery<ApiSquadInvite[], ApiError>({
    queryKey: ['squads', 'invites', 'mine'],
    queryFn: async () => unwrapList<ApiSquadInvite>(
      (await api.get<{ data: unknown }>('/api/squads/invites/mine')).data,
    ),
  });

  const respond = useMutation({
    mutationFn: (args: { inviteId: string; accept: boolean }) =>
      api.post(`/api/squads/invites/${args.inviteId}/respond`, { accept: args.accept }),
    onSuccess: (_res, args) => {
      toast.success(args.accept ? 'You joined the squad' : 'Invitation declined');
      // Accepting creates a membership, so the squad lists move too.
      queryClient.invalidateQueries({ queryKey: squadKeys.all });
    },
    onError: (e: ApiError) => toast.error(e.message || 'Could not respond to that invitation'),
  });

  return {
    invites: query.data ?? [],
    loading: query.isPending,
    error: (query.error as ApiError | null) ?? null,
    refresh: query.refetch,
    respondToInvite: respond.mutateAsync,
    responding: respond.isPending,
  };
}

export function useSquadActivity() {
  const query = useQuery<{ items: ApiSquadActivity[]; squads: number }, ApiError>({
    queryKey: ['squads', 'me', 'activity'],
    queryFn: async () => {
      const res = await api.get<{ data: { items?: ApiSquadActivity[]; squads?: number } }>(
        '/api/squads/me/activity',
      );
      return { items: res.data?.items ?? [], squads: Number(res.data?.squads ?? 0) };
    },
  });

  return {
    activity: query.data?.items ?? [],
    squadCount: query.data?.squads ?? 0,
    loading: query.isPending,
    error: (query.error as ApiError | null) ?? null,
    refresh: query.refetch,
  };
}
