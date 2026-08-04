/**
 * Messaging, on the API.
 *
 * MessagesPage rendered MOCK_CONVERSATIONS and kept anything typed in local
 * state; SquadChat pushed into a zustand store. Neither sent anything anywhere.
 *
 * Reads and writes go through FastAPI. A realtime subscription is used only as a
 * hint that something changed: the socket delivers the row Appwrite already
 * granted this user read on, and the hook appends it to the cache rather than
 * recomputing anything from it. Unread counts, ordering and the conversation's
 * last-message preview are all server-owned, so an arriving message invalidates
 * the thread list instead of adjusting the numbers here.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { api, ApiError } from '@/lib/api';
import { subscribeToCollection } from '@/lib/realtime';
import type {
  ApiConversation, ApiMessage, ApiSquadMessage, SquadMessageType,
} from '@/types/api.types';

export const messageKeys = {
  all: ['messaging'] as const,
  conversations: () => ['messaging', 'conversations'] as const,
  thread: (id: string | undefined) => ['messaging', 'thread', id ?? null] as const,
  squadChannel: (id: string | undefined) => ['messaging', 'squad', id ?? null] as const,
};

function unwrapItems<T>(data: unknown): T[] {
  const d = data as { items?: unknown } | undefined;
  return Array.isArray(d?.items) ? (d.items as T[]) : [];
}

// ─── Conversation list ────────────────────────────────────────────────────────
export function useConversations() {
  const queryClient = useQueryClient();

  const query = useQuery<ApiConversation[], ApiError>({
    queryKey: messageKeys.conversations(),
    queryFn: async () => unwrapItems<ApiConversation>(
      (await api.get<{ data: unknown }>('/api/conversations/')).data,
    ),
  });

  // A message in any thread changes this list: its preview, its order and its
  // unread count all live on the server, so refetch rather than patch.
  useEffect(() => {
    const unsubscribe = subscribeToCollection<ApiMessage>('messages', ({ event }) => {
      if (event === 'create') {
        queryClient.invalidateQueries({ queryKey: messageKeys.conversations() });
      }
    });
    return unsubscribe;
  }, [queryClient]);

  return {
    conversations: query.data ?? [],
    loading: query.isPending,
    error: (query.error as ApiError | null) ?? null,
    refresh: query.refetch,
  };
}

export function useOpenConversation() {
  const queryClient = useQueryClient();

  const open = useMutation({
    // Idempotent on the server: opening a chat from a profile twice returns the
    // same thread rather than minting a second one.
    mutationFn: async (userId: string) =>
      (await api.post<{ data: ApiConversation }>('/api/conversations/', { user_id: userId })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: messageKeys.conversations() }),
    onError: (e: ApiError) => toast.error(e.message || 'Could not open that conversation'),
  });

  return { openConversation: open.mutateAsync, opening: open.isPending };
}

// ─── One thread ───────────────────────────────────────────────────────────────
export function useThread(conversationId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery<ApiMessage[], ApiError>({
    queryKey: messageKeys.thread(conversationId),
    enabled: Boolean(conversationId),
    queryFn: async () => unwrapItems<ApiMessage>(
      (await api.get<{ data: unknown }>(
        `/api/conversations/${conversationId}/messages`)).data,
    ),
  });

  // Appwrite pushes only documents this user was granted read on, so a message
  // from another thread can still arrive here; the conversation_id decides.
  useEffect(() => {
    if (!conversationId) return;
    return subscribeToCollection<ApiMessage>('messages', ({ event, document }) => {
      if (event !== 'create' || document.conversation_id !== conversationId) return;
      queryClient.setQueryData<ApiMessage[]>(
        messageKeys.thread(conversationId),
        current => {
          if (!current) return current;
          // The sender already has this row from the POST response, which also
          // carries the joined sender profile the socket payload lacks.
          if (current.some(m => m.$id === document.$id)) return current;
          return [...current, document];
        },
      );
    });
  }, [conversationId, queryClient]);

  const send = useMutation({
    mutationFn: async (input: { content: string; media_url?: string | null }) =>
      (await api.post<{ data: ApiMessage }>(
        `/api/conversations/${conversationId}/messages`,
        { content: input.content, media_url: input.media_url ?? null },
      )).data,
    onSuccess: message => {
      queryClient.setQueryData<ApiMessage[]>(
        messageKeys.thread(conversationId),
        current => (current?.some(m => m.$id === message.$id)
          ? current
          : [...(current ?? []), message]),
      );
      queryClient.invalidateQueries({ queryKey: messageKeys.conversations() });
    },
    onError: (e: ApiError) => toast.error(e.message || 'Message not sent'),
  });

  const markRead = useMutation({
    mutationFn: () => api.post(`/api/conversations/${conversationId}/read`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: messageKeys.conversations() }),
    // Failing to move a read marker is not worth a toast; the count corrects
    // itself the next time the thread is opened.
    onError: () => {},
  });

  return {
    messages: query.data ?? [],
    loading: Boolean(conversationId) && query.isPending,
    error: (query.error as ApiError | null) ?? null,
    refresh: query.refetch,
    sendMessage: send.mutateAsync,
    sending: send.isPending,
    markRead: markRead.mutate,
  };
}

/**
 * Move the read marker once per thread opened, and again when a message arrives
 * while the thread is on screen. Kept out of useThread so a page that only lists
 * conversations does not accidentally mark them read.
 */
export function useMarkReadOnView(conversationId: string | undefined,
                                 markRead: () => void,
                                 latestMessageId: string | undefined) {
  useEffect(() => {
    if (!conversationId) return;
    markRead();
    // markRead is a stable mutate; the marker moves when the thread changes or a
    // new message lands, which is exactly when it is stale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, latestMessageId]);
}

// ─── Squad channel ────────────────────────────────────────────────────────────
export interface SquadMessageInput {
  content: string;
  type?: SquadMessageType;
  attachment_url?: string | null;
  poll_data?: Record<string, unknown> | null;
  tactical_data?: Record<string, unknown> | null;
  announcement_data?: Record<string, unknown> | null;
}

export function useSquadChannel(squadId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery<ApiSquadMessage[], ApiError>({
    queryKey: messageKeys.squadChannel(squadId),
    enabled: Boolean(squadId),
    queryFn: async () => unwrapItems<ApiSquadMessage>(
      (await api.get<{ data: unknown }>(`/api/squads/${squadId}/messages`)).data,
    ),
  });

  useEffect(() => {
    if (!squadId) return;
    return subscribeToCollection<ApiSquadMessage>('squad_messages', ({ event, document }) => {
      if (event !== 'create' || document.squad_id !== squadId) return;
      // The socket carries the raw row, where the poll, tactical and
      // announcement payloads are still JSON strings — the API parses them on
      // read. Refetching keeps one shape in the cache instead of two.
      queryClient.invalidateQueries({ queryKey: messageKeys.squadChannel(squadId) });
    });
  }, [squadId, queryClient]);

  const send = useMutation({
    mutationFn: async (input: SquadMessageInput) =>
      (await api.post<{ data: ApiSquadMessage }>(`/api/squads/${squadId}/messages`, {
        content: input.content,
        type: input.type ?? 'text',
        attachment_url: input.attachment_url ?? null,
        poll_data: input.poll_data ?? null,
        tactical_data: input.tactical_data ?? null,
        announcement_data: input.announcement_data ?? null,
      })).data,
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: messageKeys.squadChannel(squadId),
    }),
    onError: (e: ApiError) => toast.error(e.message || 'Message not sent'),
  });

  return {
    messages: query.data ?? [],
    loading: Boolean(squadId) && query.isPending,
    error: (query.error as ApiError | null) ?? null,
    refresh: query.refetch,
    sendMessage: send.mutateAsync,
    sending: send.isPending,
  };
}

/**
 * Read one of the squad message JSON payloads.
 *
 * The API parses these before sending them, but the same field is a raw string
 * on a realtime payload and on anything written before the parse existed, so a
 * renderer that assumed an object would show nothing. This accepts both.
 */
export function readBlob(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === 'object') return value as Record<string, unknown>;
  if (typeof value !== 'string') return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

export function blobString(value: unknown, key: string): string {
  const blob = readBlob(value);
  const found = blob?.[key];
  return typeof found === 'string' || typeof found === 'number' ? String(found) : '';
}

export interface PollOption { text: string; votes: number }

export function blobPollOptions(value: unknown): PollOption[] {
  const options = readBlob(value)?.options;
  if (!Array.isArray(options)) return [];
  return options.map(option => {
    const o = (option ?? {}) as Record<string, unknown>;
    return {
      text: typeof o.text === 'string' ? o.text : String(o.text ?? ''),
      votes: Number(o.votes ?? 0),
    };
  });
}

/**
 * Client-side filtering for the conversation sidebar: the endpoint returns every
 * thread the caller is in, and the tabs and search box are presentation.
 */
export function useConversationFilter(conversations: ApiConversation[]) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'direct' | 'squad'>('all');

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return conversations.filter(c => {
      if (tab === 'squad' && !c.is_event_chat) return false;
      if (tab === 'direct' && c.is_event_chat) return false;
      if (!needle) return true;
      const names = [
        c.event_name ?? '',
        ...(c.participants ?? []).flatMap(p => [p.full_name, p.username]),
      ];
      return names.some(n => n.toLowerCase().includes(needle));
    });
  }, [conversations, search, tab]);

  const reset = useCallback(() => { setSearch(''); setTab('all'); }, []);

  return { filtered, search, setSearch, tab, setTab, reset };
}
