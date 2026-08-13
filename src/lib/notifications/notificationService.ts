import { databases, ID, Query, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';

export type NotificationType =
  // Auth
  | 'welcome'
  | 'email_verified'
  | 'password_reset'
  | 'new_login_detected'
  // Social
  | 'post_like'
  | 'post_comment'
  | 'new_follower'
  // Events
  | 'event_registered'
  | 'event_reminder'
  | 'event_cancelled'
  | 'event_updated'
  | 'slot_available'
  | 'registration_approved'
  | 'registration_rejected'
  // Squads
  | 'squad_invitation'
  | 'squad_formed'
  | 'autosquad_ready'
  | 'captain_nominated'
  // Matches
  | 'match_scheduled'
  | 'match_reminder'
  | 'match_result'
  | 'stat_validation_request'
  | 'stat_accepted'
  | 'stat_disputed'
  | 'match_report_due'
  // Crew / Huddle
  | 'new_message'
  | 'crew_invitation'
  | 'crew_event'
  // Pulse / Missions
  | 'level_up'
  | 'badge_unlocked'
  | 'achievement_unlocked'
  | 'mission_complete'
  | 'daily_reward_ready'
  | 'streak_reminder'
  | 'streak_milestone'
  | 'coins_earned'
  // Recruiter
  | 'recruiter_viewed'
  | 'recruiter_message';

export interface NotificationPayload {
  type: NotificationType | string;
  title: string;
  message: string;
  recipientId: string;       // auth_uid — NEVER send to wrong user
  referenceType?: string;
  referenceId?: string;
  deepLink?: string;
  imageUrl?: string;
  actorId?: string;
  actorName?: string;
  actorAvatar?: string;
  metadata?: Record<string, unknown>;
}

// Duplicate prevention: track recently created notifications
const recentNotifKeys = new Set<string>();

export async function createNotification(
  payload: NotificationPayload
): Promise<void> {
  if (!payload.recipientId) return;

  // Duplicate prevention key
  const dedupKey = [
    payload.recipientId,
    payload.type,
    payload.referenceId || '',
    Math.floor(Date.now() / 5000), // 5-second window
  ].join('|');

  if (recentNotifKeys.has(dedupKey)) {
    console.warn('[NotificationService] Duplicate notification prevented:', dedupKey);
    return;
  }
  recentNotifKeys.add(dedupKey);
  setTimeout(() => recentNotifKeys.delete(dedupKey), 10000);

  try {
    const docData: Record<string, any> = {
      user_id: payload.recipientId,
      type: payload.type,
      title: payload.title,
      body: payload.message,
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (payload.actorId) docData.actor_id = payload.actorId;
    if (payload.actorName) docData.actor_name = payload.actorName;
    if (payload.actorAvatar || payload.imageUrl) {
      docData.actor_avatar_url = payload.actorAvatar || payload.imageUrl;
    }
    if (payload.referenceId) docData.entity_id = payload.referenceId;
    if (payload.referenceType) docData.entity_type = payload.referenceType;

    await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.NOTIFICATIONS,
      ID.unique(),
      docData
    );
  } catch (error) {
    // Log but don't throw — notification failure must never block main action
    console.error('[NotificationService] Notification creation failed:', error);
  }
}

export async function getNotifications(
  userId: string,
  limit = 30,
  cursor?: string
) {
  if (!userId) return { total: 0, documents: [] };

  const queries = [
    Query.equal('user_id', userId),
    Query.orderDesc('created_at'),
    Query.limit(limit),
  ];
  if (cursor) queries.push(Query.cursorAfter(cursor));

  return await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.NOTIFICATIONS,
    queries
  );
}

export async function getUnreadCount(userId: string): Promise<number> {
  if (!userId) return 0;

  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.NOTIFICATIONS,
      [
        Query.equal('user_id', userId),
        Query.equal('is_read', false),
        Query.limit(1),
      ]
    );
    return result.total;
  } catch {
    return 0;
  }
}

export async function markRead(
  notificationId: string,
  _userId?: string
): Promise<void> {
  if (!notificationId || notificationId.startsWith('n')) return;

  try {
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.NOTIFICATIONS,
      notificationId,
      { is_read: true, updated_at: new Date().toISOString() }
    );
  } catch (error) {
    console.error('[NotificationService] markRead failed:', error);
  }
}

export async function markAllRead(userId: string): Promise<void> {
  if (!userId) return;

  try {
    const unread = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.NOTIFICATIONS,
      [
        Query.equal('user_id', userId),
        Query.equal('is_read', false),
        Query.limit(100),
      ]
    );

    await Promise.all(
      unread.documents.map(doc =>
        databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.NOTIFICATIONS,
          doc.$id,
          { is_read: true, updated_at: new Date().toISOString() }
        )
      )
    );
  } catch (error) {
    console.error('[NotificationService] markAllRead failed:', error);
  }
}

// Deep link resolver — maps notification to route
export function resolveDeepLink(
  type: NotificationType | string,
  referenceId?: string
): string {
  const routes: Record<string, string> = {
    welcome:                  '/home',
    email_verified:           '/home',
    password_reset:           '/login',
    new_login_detected:       '/settings/security',
    post_like:                referenceId ? `/post/${referenceId}` : '/home',
    post_comment:             referenceId ? `/post/${referenceId}` : '/home',
    new_follower:             referenceId ? `/profile/${referenceId}` : '/home',
    event_registered:         referenceId ? `/clashhub/event/${referenceId}` : '/clashhub',
    event_reminder:           referenceId ? `/clashhub/event/${referenceId}` : '/clashhub',
    event_cancelled:          referenceId ? `/clashhub/event/${referenceId}` : '/clashhub',
    event_updated:            referenceId ? `/clashhub/event/${referenceId}` : '/clashhub',
    slot_available:           referenceId ? `/clashhub/event/${referenceId}` : '/clashhub',
    registration_approved:    referenceId ? `/clashhub/event/${referenceId}` : '/clashhub',
    registration_rejected:    referenceId ? `/clashhub/event/${referenceId}` : '/clashhub',
    squad_invitation:         referenceId ? `/pulse/squad/${referenceId}` : '/autosquad',
    squad_formed:             referenceId ? `/pulse/squad/${referenceId}` : '/autosquad',
    autosquad_ready:          '/autosquad',
    captain_nominated:        referenceId ? `/pulse/squad/${referenceId}` : '/autosquad',
    match_scheduled:          referenceId ? `/clashhub/match/${referenceId}` : '/clashhub',
    match_reminder:           referenceId ? `/clashhub/match/${referenceId}` : '/clashhub',
    match_result:             referenceId ? `/clashhub/match/${referenceId}` : '/clashhub',
    stat_validation_request:  referenceId ? `/clashhub/report/${referenceId}` : '/clashhub',
    stat_accepted:            referenceId ? `/clashhub/report/${referenceId}` : '/clashhub',
    stat_disputed:            referenceId ? `/clashhub/report/${referenceId}` : '/clashhub',
    match_report_due:         referenceId ? `/clashhub/report/${referenceId}` : '/clashhub',
    new_message:              referenceId ? `/huddle/${referenceId}` : '/huddle',
    crew_invitation:          referenceId ? `/huddle/crew/${referenceId}` : '/huddle',
    crew_event:               referenceId ? `/clashhub/event/${referenceId}` : '/clashhub',
    level_up:                 '/pulse',
    badge_unlocked:           '/pulse',
    achievement_unlocked:     '/pulse',
    mission_complete:         '/pulse',
    daily_reward_ready:       '/pulse',
    streak_reminder:          '/pulse',
    streak_milestone:         '/pulse',
    coins_earned:             '/pulse',
    recruiter_viewed:         '/playerdna',
    recruiter_message:        referenceId ? `/huddle/${referenceId}` : '/huddle',
  };

  return routes[type] || '/home';
}
