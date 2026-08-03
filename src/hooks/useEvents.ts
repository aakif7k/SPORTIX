/**
 * Events, on the API.
 *
 * These screens read from eventStore, which is seeded from mockData: nothing
 * persisted, and a refresh discarded every event anyone created. These hooks
 * replace that store page by page.
 *
 * event_service.browse returns Appwrite's raw list ({documents, total}) rather
 * than the paginated envelope, so `unwrapList` accepts either. That is a real
 * inconsistency in the backend rather than defensive noise — worth normalising
 * once every list endpoint is confirmed to agree.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { api, ApiError } from '@/lib/api';
import type { ApiEvent, ApiEventParticipant } from '@/types/api.types';

export const eventKeys = {
  all: ['events'] as const,
  browse: (filters?: EventFilters) => ['events', 'browse', filters ?? null] as const,
  detail: (id: string | undefined) => ['events', 'detail', id ?? null] as const,
  mine: () => ['events', 'mine'] as const,
  participants: (id: string | undefined) => ['events', id ?? null, 'participants'] as const,
};

export interface EventFilters {
  sport?: string;
  city?: string;
  status?: string;
  skill_level?: string;
  event_type?: string;
}

function unwrapList<T>(data: unknown): T[] {
  const d = data as Record<string, unknown> | undefined;
  if (!d) return [];
  for (const key of ['items', 'documents', 'events']) {
    if (Array.isArray(d[key])) return d[key] as T[];
  }
  return Array.isArray(d) ? (d as T[]) : [];
}

function queryString(filters?: EventFilters): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters ?? {})) {
    if (v) params.append(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}

// ─── Reads ────────────────────────────────────────────────────────────────────
export function useEvents(filters?: EventFilters) {
  const query = useQuery<ApiEvent[], ApiError>({
    queryKey: eventKeys.browse(filters),
    queryFn: async () => {
      const res = await api.get<{ data: unknown }>(`/api/events/${queryString(filters)}`);
      return unwrapList<ApiEvent>(res.data);
    },
  });

  return {
    events: query.data ?? [],
    loading: query.isPending,
    error: (query.error as ApiError | null) ?? null,
    refresh: query.refetch,
  };
}

export function useEvent(eventId?: string) {
  const query = useQuery<ApiEvent, ApiError>({
    queryKey: eventKeys.detail(eventId),
    enabled: Boolean(eventId),
    queryFn: async () =>
      (await api.get<{ data: ApiEvent }>(`/api/events/${eventId}`)).data,
  });

  return {
    event: query.data ?? null,
    loading: query.isPending && Boolean(eventId),
    error: (query.error as ApiError | null) ?? null,
  };
}

export function useEventParticipants(eventId?: string) {
  const query = useQuery<ApiEventParticipant[], ApiError>({
    queryKey: eventKeys.participants(eventId),
    enabled: Boolean(eventId),
    queryFn: async () => {
      const res = await api.get<{ data: unknown }>(`/api/events/${eventId}/participants`);
      return unwrapList<ApiEventParticipant>(res.data);
    },
  });

  return {
    participants: query.data ?? [],
    loading: query.isPending && Boolean(eventId),
    error: (query.error as ApiError | null) ?? null,
  };
}

export function useMyEvents() {
  const query = useQuery<{ created: ApiEvent[]; joined: ApiEventParticipant[] }, ApiError>({
    queryKey: eventKeys.mine(),
    queryFn: async () => {
      const res = await api.get<{ data: { created?: unknown; joined?: unknown } }>(
        '/api/events/me',
      );
      return {
        created: unwrapList<ApiEvent>(res.data?.created),
        joined: unwrapList<ApiEventParticipant>(res.data?.joined),
      };
    },
  });

  return {
    created: query.data?.created ?? [],
    joined: query.data?.joined ?? [],
    loading: query.isPending,
    error: (query.error as ApiError | null) ?? null,
  };
}

// ─── Writes ───────────────────────────────────────────────────────────────────
export interface CreateEventInput {
  title: string;
  description?: string;
  sport: string;
  format: string;
  skill_level: string;
  venue?: string;
  city?: string;
  event_date: string;
  end_date?: string | null;
  registration_deadline?: string | null;
  max_participants: number;
  min_participants?: number | null;
  entry_fee?: string | null;
  prize_pool?: string | null;
  rules?: string[];
  is_ai_managed?: boolean;
}

export function useEventMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: eventKeys.all });

  const create = useMutation({
    mutationFn: async (input: CreateEventInput) =>
      (await api.post<{ data: ApiEvent }>('/api/events/', input)).data,
    onSuccess: () => { toast.success('Event created'); invalidate(); },
    onError: (err: ApiError) => toast.error(err.message || 'Could not create the event'),
  });

  const update = useMutation({
    mutationFn: async (args: { eventId: string; updates: Partial<CreateEventInput> }) =>
      (await api.put<{ data: ApiEvent }>(`/api/events/${args.eventId}`, args.updates)).data,
    onSuccess: () => { toast.success('Event updated'); invalidate(); },
    onError: (err: ApiError) => toast.error(err.message || 'Could not update the event'),
  });

  const cancel = useMutation({
    mutationFn: (eventId: string) => api.delete(`/api/events/${eventId}`),
    onSuccess: () => { toast.success('Event cancelled'); invalidate(); },
    onError: (err: ApiError) => toast.error(err.message || 'Could not cancel the event'),
  });

  const join = useMutation({
    mutationFn: (args: { eventId: string; squadId?: string; entryType?: string }) =>
      api.post(`/api/events/${args.eventId}/join`, {
        squad_id: args.squadId ?? null,
        entry_type: args.entryType ?? 'solo',
      }),
    onSuccess: () => { toast.success("You're in"); invalidate(); },
    // "Already registered" arrives as a 400 and is not really a failure; the
    // useful outcome is that the user ends up registered either way.
    onError: (err: ApiError) => toast.error(err.message || 'Could not join the event'),
  });

  const leave = useMutation({
    mutationFn: (eventId: string) => api.delete(`/api/events/${eventId}/join`),
    onSuccess: () => { toast.success('You left the event'); invalidate(); },
    onError: (err: ApiError) => toast.error(err.message || 'Could not leave the event'),
  });

  return {
    createEvent: create.mutateAsync,
    updateEvent: update.mutateAsync,
    cancelEvent: cancel.mutateAsync,
    joinEvent: join.mutateAsync,
    leaveEvent: leave.mutateAsync,
    creating: create.isPending,
    joining: join.isPending,
  };
}
