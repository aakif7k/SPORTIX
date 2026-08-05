// @vitest-environment jsdom
/**
 * The messaging hooks, including the realtime path.
 *
 * The realtime rules here are the ones worth pinning: a socket payload is a
 * notification and not a source of truth, a message that arrives twice must not be
 * rendered twice, and a payload for another thread must be ignored. Getting any of
 * those wrong produces duplicated or cross-posted messages, which no type checks.
 */
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/lib/api';
import * as realtime from '@/lib/realtime';
import { useThread, useConversationFilter } from '@/hooks/useMessages';
import type { ApiConversation } from '@/types/api.types';

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

const get = vi.spyOn(api, 'get');
const post = vi.spyOn(api, 'post');
const subscribe = vi.spyOn(realtime, 'subscribeToCollection');

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const message = (id: string, conversationId = 'c1') => ({
  $id: id,
  conversation_id: conversationId,
  sender_id: 'u1',
  content: `message ${id}`,
  media_url: null,
  media_type: null,
  read_by: [],
  created_at: '2026-08-05T10:00:00.000+00:00',
  $createdAt: '2026-08-05T10:00:00.000+00:00',
});

beforeEach(() => {
  get.mockReset();
  post.mockReset();
  subscribe.mockReset();
  subscribe.mockReturnValue(() => {});
});

describe('useThread realtime', () => {
  it('appends a message that arrives on the socket', async () => {
    get.mockResolvedValue({ data: { items: [message('m1')] } } as never);
    let deliver: ((m: { event: 'create'; document: unknown }) => void) | undefined;
    subscribe.mockImplementation((_collection, handler) => {
      deliver = handler as typeof deliver;
      return () => {};
    });

    const { result } = renderHook(() => useThread('c1'), { wrapper });
    await waitFor(() => expect(result.current.messages).toHaveLength(1));

    act(() => deliver!({ event: 'create', document: message('m2') }));
    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    expect(result.current.messages[1].$id).toBe('m2');
  });

  it('ignores a message belonging to another thread', async () => {
    get.mockResolvedValue({ data: { items: [message('m1')] } } as never);
    let deliver: ((m: { event: 'create'; document: unknown }) => void) | undefined;
    subscribe.mockImplementation((_c, handler) => {
      deliver = handler as typeof deliver;
      return () => {};
    });

    const { result } = renderHook(() => useThread('c1'), { wrapper });
    await waitFor(() => expect(result.current.messages).toHaveLength(1));

    // Appwrite pushes every document this user may read, so another conversation's
    // message does arrive here — the conversation_id is what filters it.
    act(() => deliver!({ event: 'create', document: message('m9', 'c2') }));
    expect(result.current.messages).toHaveLength(1);
  });

  it('does not duplicate a message already in the cache', async () => {
    get.mockResolvedValue({ data: { items: [message('m1')] } } as never);
    let deliver: ((m: { event: 'create'; document: unknown }) => void) | undefined;
    subscribe.mockImplementation((_c, handler) => {
      deliver = handler as typeof deliver;
      return () => {};
    });

    const { result } = renderHook(() => useThread('c1'), { wrapper });
    await waitFor(() => expect(result.current.messages).toHaveLength(1));

    // The sender already has the row from the POST response, and the socket
    // delivers it too.
    act(() => deliver!({ event: 'create', document: message('m1') }));
    expect(result.current.messages).toHaveLength(1);
  });

  it('ignores update and delete events, which the server owns', async () => {
    get.mockResolvedValue({ data: { items: [message('m1')] } } as never);
    let deliver: ((m: { event: string; document: unknown }) => void) | undefined;
    subscribe.mockImplementation((_c, handler) => {
      deliver = handler as typeof deliver;
      return () => {};
    });

    const { result } = renderHook(() => useThread('c1'), { wrapper });
    await waitFor(() => expect(result.current.messages).toHaveLength(1));

    act(() => deliver!({ event: 'update', document: message('m5') }));
    expect(result.current.messages).toHaveLength(1);
  });

  it('unsubscribes on unmount so a handler cannot fire into a dead component', async () => {
    get.mockResolvedValue({ data: { items: [] } } as never);
    const unsubscribe = vi.fn();
    subscribe.mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useThread('c1'), { wrapper });
    await waitFor(() => expect(subscribe).toHaveBeenCalled());
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('does not subscribe or fetch without a conversation', () => {
    renderHook(() => useThread(undefined), { wrapper });
    expect(get).not.toHaveBeenCalled();
    expect(subscribe).not.toHaveBeenCalled();
  });

  it('appends the sent message, which carries the joined sender', async () => {
    get.mockResolvedValue({ data: { items: [] } } as never);
    post.mockResolvedValue({
      data: { ...message('m7'), sender: { user_id: 'u1', full_name: 'Ada', username: 'ada', avatar_url: null, sport: '' } },
    } as never);

    const { result } = renderHook(() => useThread('c1'), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.sendMessage({ content: 'hi' }); });
    // waitFor, not a bare expect: the cache write happens in the mutation's
    // onSuccess and the hook re-renders after it.
    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    expect(result.current.messages[0].sender?.full_name).toBe('Ada');
  });
});

describe('useConversationFilter', () => {
  const conversation = (over: Partial<ApiConversation>): ApiConversation => ({
    $id: 'c1', participant_ids: [], is_event_chat: false, event_id: null,
    event_name: null, last_message: null, last_message_at: null,
    created_at: '', $createdAt: '', participants: [], unread_count: 0,
    last_read_at: null, ...over,
  });

  const threads = [
    conversation({ $id: 'a', participants: [{ user_id: 'u1', full_name: 'Marcus Reid', username: 'marcus', avatar_url: null, sport: 'football' }] }),
    conversation({ $id: 'b', is_event_chat: true, event_name: 'Metro League Open' }),
  ];

  it('filters to direct threads', () => {
    const { result } = renderHook(() => useConversationFilter(threads));
    act(() => result.current.setTab('direct'));
    expect(result.current.filtered.map(c => c.$id)).toEqual(['a']);
  });

  it('filters to event threads', () => {
    const { result } = renderHook(() => useConversationFilter(threads));
    act(() => result.current.setTab('squad'));
    expect(result.current.filtered.map(c => c.$id)).toEqual(['b']);
  });

  it('searches a participant name and an event name', () => {
    const { result } = renderHook(() => useConversationFilter(threads));
    act(() => result.current.setSearch('marcus'));
    expect(result.current.filtered.map(c => c.$id)).toEqual(['a']);

    act(() => result.current.setSearch('metro'));
    expect(result.current.filtered.map(c => c.$id)).toEqual(['b']);
  });

  it('matches case-insensitively on the handle too', () => {
    const { result } = renderHook(() => useConversationFilter(threads));
    act(() => result.current.setSearch('MARCUS'));
    expect(result.current.filtered).toHaveLength(1);
  });
});
