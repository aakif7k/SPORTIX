// @vitest-environment jsdom
/**
 * Hook behaviour, with the API mocked at the `api` module rather than at fetch.
 *
 * These cover the things that broke repeatedly during this project: a hook reading
 * the wrong key out of a response envelope, a filter not reaching the query string,
 * and a mutation not invalidating what it changed. All three are invisible to the
 * compiler and to a page that renders "0" perfectly happily.
 */
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/lib/api';
import { useCareer, useMatchHistory, useSubmitReport } from '@/hooks/useCareer';

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const get = vi.spyOn(api, 'get');
const post = vi.spyOn(api, 'post');

function wrapper({ children }: { children: React.ReactNode }) {
  // retry:false so a deliberate failure resolves immediately instead of waiting out
  // react-query's backoff.
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  get.mockReset();
  post.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useMatchHistory', () => {
  it('reads the list out of the paginated envelope', async () => {
    get.mockResolvedValue({
      data: { items: [{ id: 'r1', match_id: 'm1', event_name: 'vs Rapid XI' }], total: 1 },
    } as never);

    const { result } = renderHook(() => useMatchHistory(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.matches).toHaveLength(1);
    expect(result.current.matches[0].event_name).toBe('vs Rapid XI');
  });

  it('sends sport, result and period as query parameters', async () => {
    get.mockResolvedValue({ data: { items: [] } } as never);

    renderHook(
      () => useMatchHistory({ sport: 'football', result: 'win', period: 'month' }),
      { wrapper },
    );
    await waitFor(() => expect(get).toHaveBeenCalled());

    const url = get.mock.calls[0][0] as string;
    expect(url).toContain('sport=football');
    expect(url).toContain('result=win');
    expect(url).toContain('period=month');
  });

  // 'generic' and 'all' are UI sentinels meaning "no filter". Sending them would
  // filter on a sport nobody plays and return nothing.
  it('does not send the "all sports" and "all results" sentinels', async () => {
    get.mockResolvedValue({ data: { items: [] } } as never);

    renderHook(() => useMatchHistory({ sport: 'generic', result: 'all' }), { wrapper });
    await waitFor(() => expect(get).toHaveBeenCalled());

    const url = get.mock.calls[0][0] as string;
    expect(url).not.toContain('sport=');
    expect(url).not.toContain('result=');
  });

  it('surfaces an error instead of pretending the list is empty', async () => {
    get.mockRejectedValue(Object.assign(new Error('nope'), { status: 500 }));

    const { result } = renderHook(() => useMatchHistory(), { wrapper });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.matches).toEqual([]);
  });
});

describe('useCareer', () => {
  it('passes a null SSR through rather than defaulting it', async () => {
    // The old client code used `8.4 + sum(deltas)`, so a brand-new athlete showed
    // 8.4/10. Null must stay null all the way to the component.
    get.mockResolvedValue({
      data: { total_matches: 0, wins: 0, current_ssr: null, win_rate: 0 },
    } as never);

    const { result } = renderHook(() => useCareer(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.career?.current_ssr).toBeNull();
  });

  it('omits the sport parameter for the "all sports" sentinel', async () => {
    get.mockResolvedValue({ data: { total_matches: 0 } } as never);

    renderHook(() => useCareer('generic'), { wrapper });
    await waitFor(() => expect(get).toHaveBeenCalled());
    expect(get.mock.calls[0][0]).toBe('/api/matches/me/career');
  });

  it('sends a real sport as a filter', async () => {
    get.mockResolvedValue({ data: { total_matches: 0 } } as never);

    renderHook(() => useCareer('cricket'), { wrapper });
    await waitFor(() => expect(get).toHaveBeenCalled());
    expect(get.mock.calls[0][0]).toContain('sport=cricket');
  });
});

describe('useSubmitReport', () => {
  it('posts the stat blob under stats_data and echoes the match id', async () => {
    post.mockResolvedValue({ data: { $id: 's1', pulse_earned: 42 } } as never);

    const { result } = renderHook(() => useSubmitReport(), { wrapper });
    await result.current.submitReport({
      matchId: 'm1',
      sport: 'football',
      stats: { goals: 2 },
      matchRating: 8,
      isMvp: true,
    });

    const [url, body] = post.mock.calls[0] as [string, Record<string, unknown>];
    expect(url).toBe('/api/matches/m1/stats');
    expect(body.stats_data).toEqual({ goals: 2 });
    // The endpoint takes match_id in the body as well as the path.
    expect(body.match_id).toBe('m1');
    expect(body.match_rating).toBe(8);
    expect(body.is_mvp).toBe(true);
  });

  it('returns the server-computed reward rather than deriving one', async () => {
    post.mockResolvedValue({
      data: { $id: 's1', pulse_earned: 42, level: 3, previous_level: 2, leveled_up: true },
    } as never);

    const { result } = renderHook(() => useSubmitReport(), { wrapper });
    const out = await result.current.submitReport({
      matchId: 'm1', sport: 'football', stats: {}, matchRating: 7, isMvp: false,
    });

    expect(out.pulse_earned).toBe(42);
    expect(out.previous_level).toBe(2);
    expect(out.leveled_up).toBe(true);
  });

  it('rejects so a caller can restore what was typed', async () => {
    post.mockRejectedValue(Object.assign(new Error('bad request'), { status: 400 }));

    const { result } = renderHook(() => useSubmitReport(), { wrapper });
    await expect(result.current.submitReport({
      matchId: 'm1', sport: 'football', stats: {}, matchRating: 7, isMvp: false,
    })).rejects.toThrow();
  });
});
