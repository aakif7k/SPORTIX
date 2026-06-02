import { useMatchReportStore, MOCK_PENDING_MATCH } from '../store/matchReportStore';
import type { PendingMatch } from '../types/performance.types';

// ─── usePendingReport ────────────────────────────────────────────────────────
// Returns pending report state. Checks localStorage for 24h dismiss.

export function usePendingReport(): {
  hasPending: boolean;
  pendingMatch: PendingMatch | null;
  isLoading: boolean;
} {
  const { hasPendingReport } = useMatchReportStore();

  // Check if dismissed within 24h
  const dismissedAt = localStorage.getItem('sportix_pending_dismissed');
  const isDismissed = dismissedAt
    ? Date.now() - Number(dismissedAt) < 24 * 60 * 60 * 1000
    : false;

  const hasPending = hasPendingReport && !isDismissed;

  return {
    hasPending,
    pendingMatch: hasPending ? MOCK_PENDING_MATCH : null,
    isLoading: false,
  };
}
