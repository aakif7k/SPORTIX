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
import { hasPendingMatchReport } from '@/services/socialService';

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

// TODO: replace with the real match payload from the pending-report endpoint,
// which currently reports only whether one exists. Built at module load so the
// date is stable across renders.
const MOCK_PENDING: PendingMatchData = {
  matchId: 'm-pending-01',
  eventName: 'Pro Football 5v5 Championship',
  sport: 'football',
  date: new Date(Date.now() - 86400000).toISOString(),
  daysAgo: 1,
};

export function usePendingReport(): {
  hasPending: boolean;
  isLoading: boolean;
  pendingMatch?: PendingMatchData;
} {
  const { user } = useAuth();
  // Read once on mount; the 24h dismissal window does not need watching live.
  const [isDismissed] = useState(readDismissed);

  const enabled = Boolean(user?.id) && !isDismissed;

  const query = useQuery<boolean, ApiError>({
    queryKey: qk.matches.pendingReport(user?.id),
    enabled,
    queryFn: () => hasPendingMatchReport(user!.id),
    // A banner that nags on every navigation is worse than a slightly stale one.
    staleTime: 5 * 60 * 1000,
  });

  const hasPending = enabled && query.data === true;

  return {
    hasPending,
    isLoading: enabled && query.isPending,
    pendingMatch: hasPending ? MOCK_PENDING : undefined,
  };
}
