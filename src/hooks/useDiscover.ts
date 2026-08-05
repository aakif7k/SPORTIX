/**
 * Discovery: people search, event search, and the sport breakdown.
 *
 * SearchPage filtered MOCK_USERS and MOCK_EVENTS in the browser, so it searched
 * eight fictional athletes and never saw a real one. The "Global Sports
 * Breakdown" chart was Math.random() counts generated once at module load.
 */
import { useQuery } from '@tanstack/react-query';

import { api, ApiError } from '@/lib/api';
import { SPORT_CATEGORIES } from '@/constants/sports';
import type { ApiEvent } from '@/types/api.types';

export interface DiscoverAthlete {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  sport: string;
  city: string;
  bio: string;
  level: number;
  pulse_score: number;
  is_verified: boolean;
}

const toAthlete = (row: Record<string, unknown>): DiscoverAthlete => ({
  id: String(row.$id ?? ''),
  name: String(row.full_name ?? ''),
  username: String(row.username ?? ''),
  avatar_url: (row.avatar_url as string | null) ?? null,
  sport: String(row.sport ?? ''),
  city: String(row.city ?? row.location ?? ''),
  bio: String(row.bio ?? ''),
  level: Number(row.level ?? 1),
  pulse_score: Number(row.pulse_score ?? 0),
  is_verified: Boolean(row.is_verified),
});

function listOf(data: unknown, ...keys: string[]): Array<Record<string, unknown>> {
  const d = data as Record<string, unknown> | undefined;
  for (const key of ['items', 'documents', ...keys]) {
    if (Array.isArray(d?.[key])) return d[key] as Array<Record<string, unknown>>;
  }
  return [];
}

/**
 * With no query this shows suggested athletes and upcoming events rather than an
 * empty screen — browsing discovery without typing is the common case.
 */
export function useDiscover(query: string) {
  const trimmed = query.trim();
  const searching = trimmed.length >= 2;

  const athletes = useQuery<DiscoverAthlete[], ApiError>({
    queryKey: ['discover', 'athletes', searching ? trimmed : null],
    queryFn: async () => {
      const url = searching
        ? `/api/search/?type=users&q=${encodeURIComponent(trimmed)}`
        : '/api/users/suggested';
      const res = await api.get<{ data: unknown }>(url);
      return listOf(res.data, 'users').map(toAthlete);
    },
  });

  const events = useQuery<ApiEvent[], ApiError>({
    queryKey: ['discover', 'events', searching ? trimmed : null],
    queryFn: async () => {
      const url = searching
        ? `/api/search/?type=events&q=${encodeURIComponent(trimmed)}`
        : '/api/events/';
      const res = await api.get<{ data: unknown }>(url);
      return listOf(res.data, 'events') as unknown as ApiEvent[];
    },
  });

  return {
    athletes: athletes.data ?? [],
    athletesLoading: athletes.isPending,
    athletesError: (athletes.error as ApiError | null) ?? null,
    refreshAthletes: athletes.refetch,
    events: events.data ?? [],
    eventsLoading: events.isPending,
    eventsError: (events.error as ApiError | null) ?? null,
    refreshEvents: events.refetch,
    searching,
  };
}

export interface SportCount { sport: string; label: string; emoji: string; count: number }

export function useSportBreakdown() {
  const shown = SPORT_CATEGORIES.slice(0, 6);

  const query = useQuery<SportCount[], ApiError>({
    // Participation totals move slowly, so this does not need to be fresh on
    // every visit to the tab.
    staleTime: 5 * 60 * 1000,
    queryKey: ['discover', 'sport-breakdown', shown.map(s => s.id).join(',')],
    queryFn: async () => {
      const res = await api.get<{ data: { items: Array<{ sport: string; count: number }> } }>(
        `/api/search/sport-breakdown?sports=${shown.map(s => s.id).join(',')}`,
      );
      const counts = new Map(res.data.items.map(i => [i.sport, i.count]));
      return shown
        .filter(s => counts.has(s.id))
        .map(s => ({ sport: s.id, label: s.label, emoji: s.emoji, count: counts.get(s.id)! }));
    },
  });

  return {
    breakdown: query.data ?? [],
    loading: query.isPending,
    error: (query.error as ApiError | null) ?? null,
    refresh: query.refetch,
  };
}
