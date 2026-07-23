/**
 * usePendingReport.ts — Real DB check for pending match reports
 * Returns true ONLY if the user has an actual unsubmitted report.
 * New users with zero match history always return false.
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { hasPendingMatchReport } from '@/services/socialService';

export function usePendingReport(): {
  hasPending: boolean;
  isLoading: boolean;
} {
  const { currentUser } = useAuth();
  const [hasPending, setHasPending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user dismissed within 24h
  const dismissedAt = localStorage.getItem('sportix_pending_dismissed');
  const isDismissed = dismissedAt
    ? Date.now() - Number(dismissedAt) < 24 * 60 * 60 * 1000
    : false;

  useEffect(() => {
    if (!currentUser || isDismissed) {
      setHasPending(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    hasPendingMatchReport(currentUser.id)
      .then(pending => setHasPending(pending))
      .catch(() => setHasPending(false))
      .finally(() => setIsLoading(false));
  }, [currentUser?.id, isDismissed]);

  return { hasPending: hasPending && !isDismissed, isLoading };
}
