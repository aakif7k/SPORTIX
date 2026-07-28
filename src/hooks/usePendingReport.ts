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

export function usePendingReport(): {
  hasPending: boolean;
  isLoading: boolean;
  pendingMatch?: PendingMatchData;
} {
  const { user } = useAuth();
  const [hasPending, setHasPending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user dismissed within 24h
  const dismissedAt = localStorage.getItem('sportix_pending_dismissed');
  const isDismissed = dismissedAt
    ? Date.now() - Number(dismissedAt) < 24 * 60 * 60 * 1000
    : false;

  useEffect(() => {
    if (!user || isDismissed) {
      setHasPending(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    hasPendingMatchReport(user.id)
      .then(pending => setHasPending(pending))
      .catch(() => setHasPending(false))
      .finally(() => setIsLoading(false));
  }, [user?.id, isDismissed]);

  const mockPending: PendingMatchData = {
    matchId: 'm-pending-01',
    eventName: 'Pro Football 5v5 Championship',
    sport: 'football',
    date: new Date(Date.now() - 86400000).toISOString(),
    daysAgo: 1,
  };

  return {
    hasPending: hasPending && !isDismissed,
    isLoading,
    pendingMatch: hasPending ? mockPending : undefined,
  };
}
