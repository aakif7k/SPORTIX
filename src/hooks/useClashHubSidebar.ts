import { useState, useEffect, useCallback } from 'react';
import { databases, account, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite';
import { useAuthStore } from '@/store/authStore';

export interface SidebarUpcomingEvent {
  id: string;
  title: string;
  sport: string;
  dateStr: string;
  venue: string;
  location: string;
  status: 'UPCOMING' | 'LIVE NOW';
  currentParticipants: number;
  maxParticipants: number;
  daysLeftText: string;
}

export type SidebarReportStatus =
  | 'NO_REPORT'
  | 'DRAFT'
  | 'SUBMITTED'
  | 'VERIFICATION_PENDING'
  | 'VERIFIED'
  | 'CORRECTION_REQUESTED'
  | 'DISPUTED'
  | 'RESOLVED';

export interface SidebarMatchItem {
  id: string;
  matchId: string;
  eventName: string;
  sport: string;
  date: string;
  result: 'WIN' | 'LOSS' | 'DRAW' | 'PENDING';
  reportStatus: SidebarReportStatus;
  pulseEarned?: number;
}

export interface SidebarPerformance {
  matchesCount: number;
  pulse: number;
  winRate: number;
  ssr: string;
}

export function useClashHubSidebar() {
  const currentUser = useAuthStore(state => state.user);
  const userId = currentUser?.id || currentUser?.uid;

  const userPulse = (currentUser as any)?.pulseScore || (currentUser as any)?.pulse_score || 100;

  const [upcomingEvents, setUpcomingEvents] = useState<SidebarUpcomingEvent[]>([]);
  const [previousMatches, setPreviousMatches] = useState<SidebarMatchItem[]>([]);
  const [performance, setPerformance] = useState<SidebarPerformance>({
    matchesCount: 0,
    pulse: userPulse,
    winRate: 0,
    ssr: 'Provisional',
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [eventsError, setEventsError] = useState<boolean>(false);
  const [matchesError, setMatchesError] = useState<boolean>(false);

  // Helper: compute days left
  const calculateDaysLeft = (startsAtIso?: string, dateStr?: string): string => {
    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const target = startsAtIso ? new Date(startsAtIso) : dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
      const targetDay = new Date(target);
      targetDay.setHours(0, 0, 0, 0);

      const diffTime = targetDay.getTime() - now.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'TODAY';
      if (diffDays === 1) return '1 DAY LEFT';
      if (diffDays > 1) return `${diffDays} DAYS LEFT`;
      return 'TODAY';
    } catch {
      return 'UPCOMING';
    }
  };

  // Helper: read dismissed event IDs from Appwrite account prefs + localStorage
  const getDismissedEventIds = async (uid: string): Promise<Set<string>> => {
    const set = new Set<string>();

    // Check localStorage
    try {
      const local = localStorage.getItem(`sportix_dismissed_events_${uid}`);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) parsed.forEach(id => set.add(id));
      }
    } catch {
      // ignore
    }

    // Check Appwrite account prefs
    try {
      const prefs = await account.getPrefs();
      if (prefs && Array.isArray(prefs.dismissedEvents)) {
        prefs.dismissedEvents.forEach((id: string) => set.add(id));
      }
    } catch {
      // ignore
    }

    return set;
  };

  const fetchData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setUpcomingEvents([]);
      setPreviousMatches([]);
      setPerformance({
        matchesCount: 0,
        pulse: 100,
        winRate: 0,
        ssr: 'Provisional',
      });
      return;
    }

    setLoading(true);
    setEventsError(false);
    setMatchesError(false);

    const dismissedSet = await getDismissedEventIds(userId);

    // 1. FETCH UPCOMING REGISTERED EVENTS
    try {
      // Step A: Find event_participants rows where user_id == userId
      const epRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.EVENT_PARTICIPANTS,
        [Query.equal('user_id', userId), Query.limit(50)]
      );

      const epDocs = epRes.documents || [];
      const eventIds = Array.from(new Set(epDocs.map(d => d.event_id).filter(Boolean)));

      const eventsList: SidebarUpcomingEvent[] = [];

      for (const eventId of eventIds) {
        if (dismissedSet.has(eventId)) continue;

        try {
          const evDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.EVENTS, eventId);
          const evData = evDoc.data ? evDoc.data : evDoc;

          const startsAtStr = evData.starts_at || evData.date;
          const startsAt = startsAtStr ? new Date(startsAtStr) : new Date();
          const endsAt = evData.ends_at ? new Date(evData.ends_at) : new Date(startsAt.getTime() + 4 * 3600 * 1000);
          const now = new Date();

          // Exclude completed / past events
          const isCompleted = evData.status === 'completed' || evData.status === 'cancelled';
          if (isCompleted || (now > endsAt && evData.status !== 'live')) {
            continue;
          }

          const isLive = evData.status === 'live' || (now >= startsAt && now <= endsAt);
          const daysLeftText = isLive ? 'LIVE' : calculateDaysLeft(evData.starts_at, evData.date);

          const dateDisplay = startsAt.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });

          eventsList.push({
            id: evDoc.$id,
            title: evData.title || 'Untitled Event',
            sport: evData.sport || 'football',
            dateStr: dateDisplay,
            venue: evData.venue || evData.location || 'Local Grounds',
            location: evData.location || '',
            status: isLive ? 'LIVE NOW' : 'UPCOMING',
            currentParticipants: evData.current_participants || 1,
            maxParticipants: evData.max_participants || 32,
            daysLeftText,
          });
        } catch (err) {
          console.warn(`[useClashHubSidebar] Could not fetch event ${eventId}:`, err);
        }
      }

      setUpcomingEvents(eventsList);
    } catch (err) {
      console.error('[useClashHubSidebar] Error fetching upcoming events:', err);
      setEventsError(true);
    }

    // 2. FETCH PREVIOUS MATCHES & PLAYER STATS & PERFORMANCE
    try {
      // Fetch player_stats for user
      const psRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PLAYER_STATS,
        [Query.equal('user_id', userId), Query.orderDesc('created_at'), Query.limit(20)]
      );

      // Fetch matches for user directly as well
      const matchesRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MATCHES,
        [Query.equal('user_id', userId), Query.orderDesc('created_at'), Query.limit(20)]
      );

      const psDocs = psRes.documents || [];
      const mDocs = matchesRes.documents || [];

      const rawMatches: SidebarMatchItem[] = [];

      // Process player_stats records
      for (const psDoc of psDocs) {
        const psData = psDoc.data ? psDoc.data : psDoc;
        let matchName = 'Match Report';
        let matchDate = psData.created_at || psData.submitted_at || new Date().toISOString();

        if (psData.match_id) {
          try {
            const mDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.MATCHES, psData.match_id);
            const mData = mDoc.data ? mDoc.data : mDoc;
            if (mData.opponent_name) matchName = `vs ${mData.opponent_name}`;
            else if (mData.event_name) matchName = mData.event_name;
            if (mData.played_at || mData.created_at) matchDate = mData.played_at || mData.created_at;
          } catch {
            // ignore
          }
        }

        // Map status
        let reportStatus: SidebarReportStatus = 'NO_REPORT';
        const rawStatus = (psData.validation_status || psData.status || '').toLowerCase();
        if (rawStatus === 'draft') reportStatus = 'DRAFT';
        else if (rawStatus === 'submitted') reportStatus = 'SUBMITTED';
        else if (rawStatus === 'pending' || rawStatus === 'verification_pending') reportStatus = 'VERIFICATION_PENDING';
        else if (rawStatus === 'verified' || rawStatus === 'validated') reportStatus = 'VERIFIED';
        else if (rawStatus === 'correction_requested') reportStatus = 'CORRECTION_REQUESTED';
        else if (rawStatus === 'disputed') reportStatus = 'DISPUTED';
        else if (rawStatus === 'resolved') reportStatus = 'RESOLVED';
        else if (psData.stats_data) reportStatus = 'VERIFIED';

        rawMatches.push({
          id: psDoc.$id,
          matchId: psData.match_id || psDoc.$id,
          eventName: matchName,
          sport: psData.sport || 'football',
          date: new Date(matchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          result: (psData.result || 'WIN').toUpperCase() as any,
          reportStatus,
          pulseEarned: psData.pulse_earned || 0,
        });
      }

      // Process matches collection records if any
      for (const mDoc of mDocs) {
        const mData = mDoc.data ? mDoc.data : mDoc;
        if (rawMatches.some(m => m.matchId === mDoc.$id)) continue;

        let resultStr: 'WIN' | 'LOSS' | 'DRAW' | 'PENDING' = 'PENDING';
        if (mData.result) resultStr = mData.result.toUpperCase() as any;

        rawMatches.push({
          id: mDoc.$id,
          matchId: mDoc.$id,
          eventName: mData.opponent_name ? `vs ${mData.opponent_name}` : mData.event_name || 'Competitive Match',
          sport: mData.sport || 'football',
          date: new Date(mData.played_at || mData.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          result: resultStr,
          reportStatus: mData.status === 'completed' ? 'VERIFIED' : 'NO_REPORT',
        });
      }

      setPreviousMatches(rawMatches.slice(0, 5));

      // Calculate performance metrics
      const verifiedMatches = rawMatches.filter(m => m.reportStatus === 'VERIFIED' || m.reportStatus === 'RESOLVED');
      const verifiedWins = verifiedMatches.filter(m => m.result === 'WIN').length;

      const totalMatches = verifiedMatches.length;
      const winRate = totalMatches > 0 ? Math.round((verifiedWins / totalMatches) * 100) : 0;

      // Pulse calculation
      let pulse = (currentUser as any)?.pulseScore || (currentUser as any)?.pulse_score || 100;

      // SSR calculation
      let ssr = 'Provisional';
      if (totalMatches > 0) {
        const calculatedSsr = 8.0 + (verifiedWins * 0.3) - ((totalMatches - verifiedWins) * 0.1);
        ssr = Math.max(5.0, Math.min(9.9, Math.round(calculatedSsr * 10) / 10)).toFixed(1);
      }

      setPerformance({
        matchesCount: totalMatches,
        pulse,
        winRate,
        ssr,
      });

    } catch (err) {
      console.error('[useClashHubSidebar] Error fetching match history:', err);
      setMatchesError(true);
    } finally {
      setLoading(false);
    }
  }, [userId, (currentUser as any)?.pulseScore, (currentUser as any)?.pulse_score]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Dismiss an event from the user's sidebar
  const dismissEvent = async (eventId: string) => {
    if (!userId) return;

    // Immediately remove from UI
    setUpcomingEvents(prev => prev.filter(e => e.id !== eventId));

    try {
      const dismissedSet = await getDismissedEventIds(userId);
      dismissedSet.add(eventId);
      const arr = Array.from(dismissedSet);

      // Save locally
      localStorage.setItem(`sportix_dismissed_events_${userId}`, JSON.stringify(arr));

      // Save in Appwrite prefs
      try {
        const currentPrefs = await account.getPrefs();
        await account.updatePrefs({ ...currentPrefs, dismissedEvents: arr });
      } catch (err) {
        console.warn('[useClashHubSidebar] Could not update account prefs:', err);
      }
    } catch (err) {
      console.error('[useClashHubSidebar] Error dismissing event:', err);
    }
  };

  return {
    upcomingEvents,
    previousMatches,
    performance,
    loading,
    eventsError,
    matchesError,
    dismissEvent,
    refresh: fetchData,
  };
}
