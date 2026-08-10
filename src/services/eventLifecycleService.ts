import type { Event } from '@/types';

export type EventLifecycleState =
  | 'DRAFT'
  | 'UPCOMING'
  | 'REGISTRATION_OPEN'
  | 'REGISTRATION_CLOSED'
  | 'LIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ARCHIVED';

export interface LifecycleInfo {
  state: EventLifecycleState;
  label: string;
  badgeText: string;
  badgeSubtext: string;
  colorDark: string;       // Accent color for dark mode (e.g. #CCFF00)
  colorLight: string;      // Accent color for light mode (e.g. rgb(45, 122, 31))
  isEnded: boolean;
  isLive: boolean;
  isCancelled: boolean;
  canJoin: boolean;
  canAutoSquad: boolean;
  timeRemainingText: string;
  startsAtDate: Date;
  endsAtDate: Date;
}

/**
 * Safely parse date from various formats on the Event object or Appwrite document.
 */
export function parseEventDates(event: Partial<Event> & Record<string, any>): { startsAtDate: Date; endsAtDate: Date } {
  let startsAtDate: Date | null = null;
  let endsAtDate: Date | null = null;

  // 1. Try ISO starts_at or startsAt
  const rawStarts = event.starts_at || event.startsAt;
  if (rawStarts) {
    const d = new Date(rawStarts);
    if (!isNaN(d.getTime())) startsAtDate = d;
  }

  // 2. Fallback to event.date
  if (!startsAtDate && event.date) {
    const d = new Date(event.date);
    if (!isNaN(d.getTime())) {
      startsAtDate = d;
    }
  }

  // Fallback if still invalid
  if (!startsAtDate) {
    startsAtDate = new Date();
  }

  // 3. Try ISO ends_at or endsAt or endDate
  const rawEnds = event.ends_at || event.endsAt || event.endDate;
  if (rawEnds) {
    const d = new Date(rawEnds);
    if (!isNaN(d.getTime())) endsAtDate = d;
  }

  // If endsAtDate is not explicitly provided, default to 3 hours after startsAtDate
  if (!endsAtDate) {
    endsAtDate = new Date(startsAtDate.getTime() + 3 * 60 * 60 * 1000);
  }

  return { startsAtDate, endsAtDate };
}

/**
 * Primary single source of truth for Event Lifecycle State.
 */
export function getEventLifecycleState(
  event: Partial<Event> & Record<string, any>,
  now: Date = new Date()
): LifecycleInfo {
  const { startsAtDate, endsAtDate } = parseEventDates(event);

  const rawStatus = (event.status || '').toLowerCase().trim();
  const maxPart = event.maxParticipants || event.max_participants || 10;
  const currentPart = Array.isArray(event.participants)
    ? event.participants.length
    : (typeof event.current_participants === 'number' ? event.current_participants : (event.participantsCount || 0));

  const isFull = currentPart >= maxPart;

  // Manual override statuses
  if (rawStatus === 'cancelled') {
    return {
      state: 'CANCELLED',
      label: 'Cancelled',
      badgeText: '✕ EVENT CANCELLED',
      badgeSubtext: 'This event was cancelled by the organizer',
      colorDark: '#FF4D4D',
      colorLight: '#D32F2F',
      isEnded: true,
      isLive: false,
      isCancelled: true,
      canJoin: false,
      canAutoSquad: false,
      timeRemainingText: 'EVENT CANCELLED',
      startsAtDate,
      endsAtDate,
    };
  }

  if (rawStatus === 'draft') {
    return {
      state: 'DRAFT',
      label: 'Draft',
      badgeText: '📝 DRAFT',
      badgeSubtext: 'Not published yet',
      colorDark: '#999999',
      colorLight: '#666666',
      isEnded: false,
      isLive: false,
      isCancelled: false,
      canJoin: false,
      canAutoSquad: false,
      timeRemainingText: 'DRAFT',
      startsAtDate,
      endsAtDate,
    };
  }

  if (rawStatus === 'archived') {
    return {
      state: 'ARCHIVED',
      label: 'Archived',
      badgeText: '✓ ARCHIVED',
      badgeSubtext: 'Event records archived',
      colorDark: '#888888',
      colorLight: '#555555',
      isEnded: true,
      isLive: false,
      isCancelled: false,
      canJoin: false,
      canAutoSquad: false,
      timeRemainingText: 'ARCHIVED',
      startsAtDate,
      endsAtDate,
    };
  }

  // Time-based calculations
  const nowMs = now.getTime();
  const startMs = startsAtDate.getTime();
  const endMs = endsAtDate.getTime();

  // Completed check: if end time has passed OR manual status is 'completed'
  if (nowMs >= endMs || rawStatus === 'completed') {
    return {
      state: 'COMPLETED',
      label: 'Completed',
      badgeText: '✓ EVENT COMPLETED',
      badgeSubtext: 'Event has finished. Thanks to all participants!',
      colorDark: '#8899A6',
      colorLight: '#4A5568',
      isEnded: true,
      isLive: false,
      isCancelled: false,
      canJoin: false,
      canAutoSquad: false,
      timeRemainingText: 'EVENT COMPLETED',
      startsAtDate,
      endsAtDate,
    };
  }

  // Live check: between start and end time
  if (nowMs >= startMs && nowMs < endMs) {
    return {
      state: 'LIVE',
      label: 'Live Now',
      badgeText: '● LIVE NOW',
      badgeSubtext: 'Event is currently in progress',
      colorDark: '#00FF66',
      colorLight: 'rgb(45, 122, 31)',
      isEnded: false,
      isLive: true,
      isCancelled: false,
      canJoin: false,
      canAutoSquad: true,
      timeRemainingText: 'LIVE NOW',
      startsAtDate,
      endsAtDate,
    };
  }

  // Registration closed check: event hasn't started yet but capacity is full
  if (isFull) {
    return {
      state: 'REGISTRATION_CLOSED',
      label: 'Registration Closed',
      badgeText: '🔒 REGISTRATION FULL',
      badgeSubtext: 'Maximum capacity reached',
      colorDark: '#FFB800',
      colorLight: '#D97706',
      isEnded: false,
      isLive: false,
      isCancelled: false,
      canJoin: false,
      canAutoSquad: true,
      timeRemainingText: formatCountdown(startMs - nowMs),
      startsAtDate,
      endsAtDate,
    };
  }

  // Registration Open / Upcoming
  return {
    state: 'REGISTRATION_OPEN',
    label: 'Registration Open',
    badgeText: '● REGISTRATION OPEN',
    badgeSubtext: 'Spots available',
    colorDark: '#CCFF00',
    colorLight: 'rgb(45, 122, 31)',
    isEnded: false,
    isLive: false,
    isCancelled: false,
    canJoin: true,
    canAutoSquad: true,
    timeRemainingText: formatCountdown(startMs - nowMs),
    startsAtDate,
    endsAtDate,
  };
}

/**
 * Format remaining milliseconds into human readable countdown ("Starts in 2d 4h 15m")
 * Prevents negative values.
 */
function formatCountdown(diffMs: number): string {
  if (diffMs <= 0) return 'Starts soon';

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) {
    return `Starts in ${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `Starts in ${hours}h ${minutes}m`;
  }
  return `Starts in ${minutes}m`;
}
