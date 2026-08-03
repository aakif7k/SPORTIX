/**
 * Notifications, on the API.
 *
 * Replaces notificationStore, which was seeded from MOCK_NOTIFICATIONS: the badge
 * count was computed from a hardcoded array, marking one read only changed local
 * state, and "clear all" cleared nothing that survived a reload.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { useAuth } from '@/context/AuthContext';
import { api, ApiError } from '@/lib/api';

export interface ApiNotification {
  $id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  actor_id: string | null;
  actor_name: string | null;
  actor_avatar_url: string | null;
  entity_id: string | null;
  entity_type: string | null;
  is_read: boolean;
  created_at: string;
  $createdAt: string;
}

export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => ['notifications', 'list'] as const,
  unreadCount: () => ['notifications', 'unread-count'] as const,
};

function unwrapList(data: unknown): ApiNotification[] {
  const d = data as Record<string, unknown> | undefined;
  if (!d) return [];
  for (const key of ['items', 'documents', 'notifications']) {
    if (Array.isArray(d[key])) return d[key] as ApiNotification[];
  }
  return Array.isArray(d) ? (d as ApiNotification[]) : [];
}

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const enabled = Boolean(user?.id);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: notificationKeys.all });

  const list = useQuery<ApiNotification[], ApiError>({
    queryKey: notificationKeys.list(),
    enabled,
    queryFn: async () => unwrapList((await api.get<{ data: unknown }>('/api/notifications/')).data),
  });

  const unread = useQuery<number, ApiError>({
    queryKey: notificationKeys.unreadCount(),
    enabled,
    queryFn: async () => {
      const res = await api.get<{ data: { count?: number; unread_count?: number } }>(
        '/api/notifications/unread-count',
      );
      return res.data?.count ?? res.data?.unread_count ?? 0;
    },
    // The bell should feel live without hammering the endpoint.
    refetchInterval: 60_000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.post(`/api/notifications/${id}/read`),
    // Optimistic: the row must dim on tap, not a round trip later.
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.list() });
      const previous = queryClient.getQueryData<ApiNotification[]>(notificationKeys.list());
      queryClient.setQueryData<ApiNotification[]>(notificationKeys.list(), old =>
        old?.map(n => (n.$id === id ? { ...n, is_read: true } : n)));
      return { previous };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(notificationKeys.list(), ctx.previous);
    },
    onSettled: invalidate,
  });

  const markAllRead = useMutation({
    mutationFn: () => api.post('/api/notifications/read-all'),
    onSuccess: () => { toast.success('All caught up'); invalidate(); },
    onError: (e: ApiError) => toast.error(e.message || 'Could not mark all as read'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/api/notifications/${id}`),
    onSuccess: invalidate,
    onError: (e: ApiError) => toast.error(e.message || 'Could not dismiss that'),
  });

  const clearAll = useMutation({
    mutationFn: () => api.delete<{ data: { deleted: number } }>('/api/notifications/'),
    onSuccess: res => {
      toast.success(`Cleared ${res?.data?.deleted ?? 0} notifications`);
      invalidate();
    },
    onError: (e: ApiError) => toast.error(e.message || 'Could not clear notifications'),
  });

  const notifications = list.data ?? [];

  return {
    notifications,
    // Prefer the server's count, but fall back to the list so the badge is never
    // blank just because the count request is still in flight.
    unreadCount: unread.data ?? notifications.filter(n => !n.is_read).length,
    loading: enabled && list.isPending,
    error: (list.error as ApiError | null) ?? null,
    markRead: (id: string) => markRead.mutate(id),
    markAllRead: () => markAllRead.mutate(),
    dismiss: (id: string) => remove.mutate(id),
    clearAll: () => clearAll.mutate(),
    refresh: () => invalidate(),
  };
}
