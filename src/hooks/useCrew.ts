/**
 * Event crews and the event discussion thread.
 *
 * EventCrewPage held its roster in a component array and EventDiscussion held its
 * messages in component state, so neither survived a navigation and no teammate
 * ever saw either one. Both collections existed from phase 2.
 */
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { api, ApiError } from '@/lib/api';
import { subscribeToCollection } from '@/lib/realtime';
import type { ApiMessage } from '@/types/api.types';

export const crewKeys = {
  all: ['crews'] as const,
  forEvent: (eventId: string | undefined) => ['crews', 'event', eventId ?? null] as const,
  discussion: (eventId: string | undefined) =>
    ['events', eventId ?? null, 'discussion'] as const,
};

export interface ApiCrewMember {
  $id: string;
  crew_id: string;
  user_id: string;
  role: string;
  position: string | null;
  joined_at: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  sport: string;
  level: number;
  pulse_score: number;
  /** Straight from the athlete's event entry, not a second copy on the crew row. */
  entry_status: string;
  readiness: 'ready' | 'maybe' | 'unavailable';
}

export interface ApiCrew {
  $id: string;
  event_id: string;
  name: string;
  captain_id: string;
  logo_url: string | null;
  members_count: number;
  created_at: string;
  members: ApiCrewMember[];
  is_captain: boolean;
  ready_count: number;
}

export function useCrew(eventId?: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: crewKeys.all });

  const query = useQuery<ApiCrew | null, ApiError>({
    queryKey: crewKeys.forEvent(eventId),
    enabled: Boolean(eventId),
    // Null is a valid answer: having no crew yet is the starting state.
    queryFn: async () =>
      (await api.get<{ data: { crew: ApiCrew | null } }>(
        `/api/crews/event/${eventId}`)).data.crew,
  });

  const create = useMutation({
    mutationFn: async (name: string) =>
      (await api.post<{ data: ApiCrew }>(`/api/crews/event/${eventId}`, { name })).data,
    onSuccess: () => { toast.success('Crew formed'); invalidate(); },
    onError: (e: ApiError) => toast.error(e.message || 'Could not form the crew'),
  });

  const rename = useMutation({
    mutationFn: async (args: { crewId: string; name: string }) =>
      (await api.put<{ data: ApiCrew }>(`/api/crews/${args.crewId}`, { name: args.name })).data,
    onSuccess: () => { toast.success('Crew renamed'); invalidate(); },
    onError: (e: ApiError) => toast.error(e.message || 'Could not rename the crew'),
  });

  const addMember = useMutation({
    mutationFn: (args: { crewId: string; userId: string; position?: string }) =>
      api.post(`/api/crews/${args.crewId}/members`, {
        user_id: args.userId, position: args.position ?? null,
      }),
    onSuccess: () => { toast.success('Athlete added'); invalidate(); },
    onError: (e: ApiError) => toast.error(e.message || 'Could not add that athlete'),
  });

  const removeMember = useMutation({
    mutationFn: (args: { crewId: string; userId: string }) =>
      api.delete(`/api/crews/${args.crewId}/members/${args.userId}`),
    onSuccess: () => { toast.success('Removed from the crew'); invalidate(); },
    onError: (e: ApiError) => toast.error(e.message || 'Could not remove that athlete'),
  });

  const disband = useMutation({
    mutationFn: (crewId: string) => api.delete(`/api/crews/${crewId}`),
    onSuccess: () => { toast.success('Crew disbanded'); invalidate(); },
    onError: (e: ApiError) => toast.error(e.message || 'Could not disband the crew'),
  });

  return {
    crew: query.data ?? null,
    loading: Boolean(eventId) && query.isPending,
    error: (query.error as ApiError | null) ?? null,
    refresh: query.refetch,
    createCrew: create.mutateAsync,
    renameCrew: rename.mutateAsync,
    addMember: addMember.mutateAsync,
    removeMember: removeMember.mutateAsync,
    disbandCrew: disband.mutateAsync,
    busy: create.isPending || rename.isPending || addMember.isPending
      || removeMember.isPending || disband.isPending,
  };
}

/**
 * The event's discussion thread, delivered live.
 *
 * It rides the messaging backend, so the same read grants that make DM realtime
 * work apply here — a message from an entrant arrives without a refetch.
 */
export function useEventDiscussion(eventId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery<{ conversationId: string | null; messages: ApiMessage[] }, ApiError>({
    queryKey: crewKeys.discussion(eventId),
    enabled: Boolean(eventId),
    queryFn: async () => {
      const res = await api.get<{
        data: { conversation?: { $id?: string }; items?: ApiMessage[] };
      }>(`/api/events/${eventId}/discussion`);
      return {
        conversationId: res.data?.conversation?.$id ?? null,
        messages: res.data?.items ?? [],
      };
    },
  });

  const conversationId = query.data?.conversationId ?? null;

  useEffect(() => {
    if (!conversationId) return;
    return subscribeToCollection<ApiMessage>('messages', ({ event, document }) => {
      if (event !== 'create' || document.conversation_id !== conversationId) return;
      queryClient.setQueryData<{ conversationId: string | null; messages: ApiMessage[] }>(
        crewKeys.discussion(eventId),
        current => {
          if (!current) return current;
          if (current.messages.some(m => m.$id === document.$id)) return current;
          return { ...current, messages: [...current.messages, document] };
        },
      );
    });
  }, [conversationId, eventId, queryClient]);

  const send = useMutation({
    mutationFn: async (content: string) =>
      (await api.post<{ data: ApiMessage }>(
        `/api/events/${eventId}/discussion`, { content })).data,
    onSuccess: message => {
      queryClient.setQueryData<{ conversationId: string | null; messages: ApiMessage[] }>(
        crewKeys.discussion(eventId),
        current => (current && !current.messages.some(m => m.$id === message.$id)
          ? { ...current, messages: [...current.messages, message] }
          : current),
      );
    },
    onError: (e: ApiError) => toast.error(e.message || 'Message not sent'),
  });

  return {
    messages: query.data?.messages ?? [],
    loading: Boolean(eventId) && query.isPending,
    error: (query.error as ApiError | null) ?? null,
    refresh: query.refetch,
    sendMessage: send.mutateAsync,
    sending: send.isPending,
  };
}
