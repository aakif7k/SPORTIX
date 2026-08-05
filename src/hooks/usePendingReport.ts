/**
 * Whether the user has an unsubmitted match report.
 *
 * Returns true only for a real pending report — a new account with no match
 * history always reads false.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import { api } from '@/lib/api';

export interface PendingMatchData {
  matchId: string;
  eventName: string;
  sport: string;
  date: string;
  daysAgo: number;
}

const DISMISS_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Reads the clock and localStorage, so it must not run during render. */
function readDismissed(): boolean {
  const dismissedAt = localStorage.getItem('sportix_pending_dismissed');
  return dismissedAt ? Date.now() - Number(dismissedAt) < DISMISS_WINDOW_MS : false;
}

export function usePendingReport(): {
  hasPending: boolean;
  isLoading: boolean;
  pendingMatch?: PendingMatchData;
} {
  const { user } = useAuth();
  // Read once on mount; the 24h dismissal window does not need watching live.
  const [isDismissed] = useState(readDismissed);

  const enabled = Boolean(user?.id) && !isDismissed;

  // The endpoint returns the actual matches owed a report now. It used to report
  // stats *awaiting validation*, which is the opposite thing, and this hook then
  // substituted a hardcoded "Pro Football 5v5 Championship" for the payload.
  const query = useQuery<PendingMatchData[], ApiError>({
    queryKey: qk.matches.pendingReport(user?.id),
    enabled,
    queryFn: async () => {
      const res = await api.get<{ data: { pending?: Array<Record<string, unknown>> } }>(
        '/api/matches/pending-report/check',
      );
      return (res.data?.pending ?? []).map(row => ({
        matchId: String(row.match_id ?? ''),
        eventName: String(row.event_name ?? 'Match'),
        sport: String(row.sport ?? 'generic'),
        date: String(row.date ?? ''),
        daysAgo: Number(row.days_ago ?? 0),
      }));
    },
    // A banner that nags on every navigation is worse than a slightly stale one.
    staleTime: 5 * 60 * 1000,
  });

  const pending = query.data ?? [];

  return {
    hasPending: enabled && pending.length > 0,
    isLoading: enabled && query.isPending,
    pendingMatch: pending[0],
  };
}
