/**
 * usePendingReport.ts — Real DB check for pending match reports
 * Returns true ONLY if the user has an actual unsubmitted report.
 * New users with zero match history always return false.
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
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

// TODO: replace with the real match payload from GET /api/matches/pending-report/check.
// Built at module load rather than per render so the date is stable.
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

  // Read once on mount. Recomputing during render would be impure, and the
  // 24h dismissal window does not need to be watched live.
  const [isDismissed] = useState(readDismissed);

  // The fetch result is keyed by the user it belongs to, which lets both
  // `isLoading` and `hasPending` be derived instead of stored. That keeps the
  // effect free of synchronous setState and makes a user switch self-healing:
  // a stale result no longer matches the current id, so it reads as loading.
  const [result, setResult] = useState<{ userId: string; hasPending: boolean } | null>(null);

  const userId = user?.id;
  const shouldCheck = Boolean(userId) && !isDismissed;

  useEffect(() => {
    if (!shouldCheck || !userId) return;

    let cancelled = false;
    hasPendingMatchReport(userId)
      .then(pending => {
        if (!cancelled) setResult({ userId, hasPending: pending });
      })
      .catch(() => {
        if (!cancelled) setResult({ userId, hasPending: false });
      });

    return () => { cancelled = true; };
  }, [shouldCheck, userId]);

  const isFresh = result !== null && result.userId === userId;
  const hasPending = shouldCheck && isFresh && result.hasPending;

  return {
    hasPending,
    isLoading: shouldCheck && !isFresh,
    pendingMatch: hasPending ? MOCK_PENDING : undefined,
  };
}
