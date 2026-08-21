/**
 * usePendingReport.ts — Real DB check for pending match reports
 * Returns true ONLY if the user has an actual unsubmitted report.
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getPendingReportsForUser, type PendingReportEvent } from '@/services/eventReportService';

export interface PendingMatchData {
  eventId: string;
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
  pendingList: PendingReportEvent[];
} {
  const { user } = useAuth();
  const [pendingList, setPendingList] = useState<PendingReportEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user dismissed within 24h
  const dismissedAt = localStorage.getItem('sportix_pending_dismissed');
  const isDismissed = dismissedAt
    ? Date.now() - Number(dismissedAt) < 24 * 60 * 60 * 1000
    : false;

  useEffect(() => {
    if (!user?.id || isDismissed) {
      setPendingList([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    getPendingReportsForUser(user.id)
      .then(res => setPendingList(res))
      .catch(() => setPendingList([]))
      .finally(() => setIsLoading(false));
  }, [user?.id, isDismissed]);

  const firstPending = pendingList[0];
  const pendingMatch: PendingMatchData | undefined = firstPending
    ? {
        eventId: firstPending.eventId,
        matchId: firstPending.eventId,
        eventName: firstPending.eventName,
        sport: firstPending.sport,
        date: firstPending.date,
        daysAgo: Math.max(0, Math.floor((Date.now() - new Date(firstPending.date).getTime()) / (1000 * 60 * 60 * 24))),
      }
    : undefined;

  return {
    hasPending: pendingList.length > 0 && !isDismissed,
    isLoading,
    pendingMatch,
    pendingList,
  };
}
