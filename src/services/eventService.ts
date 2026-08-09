/**
 * eventService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Full CRUD service for the Appwrite `events` and `event_participants` collections.
 *
 * Appwrite schema facts (verified by inspecting live collection):
 *   events:
 *     - required: title, sport, format (enum), skill_level (enum), organizer_id, starts_at, created_at
 *     - format enum:     solo | team | tournament | league
 *     - skill_level enum: beginner | amateur | semi_pro | pro | elite
 *     - current_participants: integer (tracks count; participants array is in event_participants)
 *
 *   event_participants:
 *     - required: event_id, user_id, joined_at (datetime), created_at (datetime)
 *     - entry_type enum: solo | squad | crew | team
 *     - status enum:     registered | confirmed | withdrawn
 *
 * FALLBACK: If Appwrite is empty or unreachable, returns MOCK_EVENTS.
 */

import { databases, storage, ID, Query, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { MEDIA_BUCKET_ID } from './storageService';
import type { Event } from '@/types';
import { MOCK_EVENTS } from './mockData';

type AppwriteDocument = Record<string, any> & {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
};

export interface DbEventParticipant {
  $id: string;
  event_id: string;
  user_id: string;
  joined_at: string;
  created_at: string;
  status: 'registered' | 'confirmed' | 'withdrawn';
  entry_type: 'solo' | 'team' | 'squad' | 'crew';
  team_id?: string | null;
}

// Valid Appwrite enum values
const FORMAT_ENUM = ['solo', 'team', 'tournament', 'league'] as const;
const SKILL_ENUM  = ['beginner', 'amateur', 'semi_pro', 'pro', 'elite'] as const;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function isMockId(id: string): boolean {
  return !id || id.length < 10 || id.startsWith('local_');
}

// ─── MAPPERS ─────────────────────────────────────────────────────────────────

/** Map Appwrite document → local Event interface */
function docToEvent(doc: AppwriteDocument): Event {
  const startsAt = doc.starts_at ? new Date(doc.starts_at) : new Date();
  const dateStr  = startsAt.toISOString().split('T')[0];

  const rawFormat = doc.format || 'tournament';
  const format = (FORMAT_ENUM as readonly string[]).includes(rawFormat) ? rawFormat : 'tournament';

  const rawSkill = doc.skill_level || 'amateur';
  const skillMap: Record<string, string> = {
    beginner: 'beginner',
    amateur:  'amateur',
    semi_pro: 'semi-pro',
    pro:      'pro',
    elite:    'elite',
  };
  const skillLevel = skillMap[rawSkill] ?? rawSkill;

  const participantCount = doc.current_participants || 0;

  let bannerUrl = doc.banner_image_url || doc.banner_url || undefined;
  if (doc.banner_image_file_id) {
    try {
      bannerUrl = storage.getFileView(MEDIA_BUCKET_ID, doc.banner_image_file_id).toString();
    } catch { /* fallback */ }
  }

  return {
    id:                   doc.$id,
    title:                doc.title || 'Untitled Event',
    description:          doc.description || '',
    date:                 dateStr,
    location:             doc.location || '',
    venue:                doc.venue || '',
    sport:                doc.sport || 'football',
    format:               format as Event['format'],
    skillLevel:           skillLevel as Event['skillLevel'],
    maxParticipants:      doc.max_participants || 10,
    participants:         participantCount > 0 ? Array(participantCount).fill('__db__') : [],
    teams:                [],
    organizerId:          doc.organizer_id || '',
    prizePool:            doc.prize_pool   || undefined,
    entryFee:             doc.entry_fee    || undefined,
    status:               doc.status       || 'upcoming',
    banner_image_file_id: doc.banner_image_file_id || undefined,
    banner_image_url:     bannerUrl,
    bannerImage:          bannerUrl,
    rules:                doc.rules        || [],
    tags:                 doc.tags         || [],
    aiTeamAvailable:      doc.ai_team_available || false,
    aiGenerated:          doc.ai_generated || false,
    bracket:              undefined,
    createdAt:            doc.created_at   || doc.$createdAt || new Date().toISOString(),
  };
}

/** Map local Event interface → Appwrite write payload */
function eventToDoc(event: Partial<Event>): Record<string, any> {
  const doc: Record<string, any> = {};

  if (event.title       !== undefined) doc.title       = event.title;
  if (event.description !== undefined) doc.description = event.description;
  if (event.sport       !== undefined) doc.sport       = event.sport;

  if (event.format !== undefined) {
    doc.format = (FORMAT_ENUM as readonly string[]).includes(event.format)
      ? event.format
      : 'tournament';
  }

  if (event.skillLevel !== undefined) {
    const skillMap: Record<string, string> = {
      beginner:     'beginner',
      amateur:      'amateur',
      'semi-pro':   'semi_pro',
      semi_pro:     'semi_pro',
      pro:          'pro',
      professional: 'pro',
      elite:        'elite',
    };
    doc.skill_level = skillMap[event.skillLevel] ?? event.skillLevel.replace(/-/g, '_');
    if (!(SKILL_ENUM as readonly string[]).includes(doc.skill_level)) {
      doc.skill_level = 'amateur';
    }
  }

  if (event.organizerId         !== undefined) doc.organizer_id          = event.organizerId;
  if (event.venue               !== undefined) doc.venue                 = event.venue;
  if (event.location            !== undefined) doc.location              = event.location;
  if (event.maxParticipants     !== undefined) doc.max_participants      = event.maxParticipants;
  if (event.status              !== undefined) doc.status                = event.status;
  if (event.banner_image_file_id!== undefined) doc.banner_image_file_id = event.banner_image_file_id;
  if (event.banner_image_url    !== undefined) doc.banner_image_url     = event.banner_image_url;
  if (event.bannerImage         !== undefined) {
    doc.banner_url       = event.bannerImage;
    doc.banner_image_url = event.bannerImage;
  }
  if (event.prizePool           !== undefined) doc.prize_pool            = event.prizePool;
  if (event.entryFee            !== undefined) doc.entry_fee             = event.entryFee;
  if (event.rules               !== undefined) doc.rules                 = event.rules;
  if (event.tags                !== undefined) doc.tags                  = event.tags;
  if (event.aiTeamAvailable!== undefined) doc.ai_team_available = event.aiTeamAvailable;
  if ((event as any).aiGenerated !== undefined) doc.ai_generated = (event as any).aiGenerated;

  if (event.date && event.date.trim()) {
    try {
      const dt = new Date(`${event.date}T00:00:00`);
      if (!isNaN(dt.getTime())) doc.starts_at = dt.toISOString();
    } catch { /* ignore */ }
  }
  if (!doc.starts_at) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    doc.starts_at = tomorrow.toISOString();
  }

  return doc;
}

// ─── INTERNAL PARTICIPANT HELPER ──────────────────────────────────────────────

async function addParticipantRecord(
  eventId: string,
  userId:  string,
  status:  'registered' | 'confirmed' = 'registered',
  entryType: 'solo' | 'team' | 'squad' | 'crew' = 'solo',
  teamId?: string | null
): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    const payload: Record<string, any> = {
      event_id:   eventId,
      user_id:    userId,
      joined_at:  now,
      created_at: now,
      status,
      entry_type: entryType,
    };
    if (teamId) {
      payload.team_id = teamId;
    }
    try {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.EVENT_PARTICIPANTS,
        ID.unique(),
        payload
      );
      return true;
    } catch (err: any) {
      if (teamId && err?.message?.includes('team_id')) {
        delete payload.team_id;
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.EVENT_PARTICIPANTS,
          ID.unique(),
          payload
        );
        return true;
      }
      throw err;
    }
  } catch (err: any) {
    console.error('[eventService] addParticipantRecord failed:', err?.message ?? err);
    return false;
  }
}

// Helper to filter active registration status
export function isActiveParticipant(status?: string | null): boolean {
  if (!status) return true;
  const s = status.toLowerCase();
  return s !== 'withdrawn' && s !== 'cancelled' && s !== 'removed' && s !== 'rejected';
}

/**
 * Fetch all active participant records for an event from event_participants (Source of Truth).
 */
export async function getEventParticipants(
  eventId: string
): Promise<DbEventParticipant[]> {
  if (isMockId(eventId)) return [];
  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.EVENT_PARTICIPANTS,
      [Query.equal('event_id', eventId), Query.orderAsc('joined_at'), Query.limit(200)]
    );
    const docs = res.documents.map(d => ({
      $id:        d.$id,
      event_id:   d.event_id,
      user_id:    d.user_id,
      joined_at:  d.joined_at || d.$createdAt,
      created_at: d.created_at || d.$createdAt,
      status:     (d.status || 'registered') as 'registered' | 'confirmed' | 'withdrawn',
      entry_type: d.entry_type || d.registration_type || 'solo',
      team_id:    d.team_id || d.squad_id || d.crew_id || null,
    }));
    return docs.filter(d => isActiveParticipant(d.status));
  } catch (err: any) {
    console.error('[eventService] getEventParticipants failed:', err?.message ?? err);
    return [];
  }
}

/** Single source of truth helper for active participant count */
export async function getEventParticipantCount(eventId: string): Promise<number> {
  const activeParts = await getEventParticipants(eventId);
  return activeParts.length;
}

// ─── READ ────────────────────────────────────────────────────────────────────

export async function getEvents(): Promise<Event[]> {
  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.EVENTS,
      [Query.limit(100), Query.orderDesc('$createdAt')]
    );
    if (res.documents.length === 0) {
      console.warn('[eventService] No events in Appwrite — using mock data.');
      return MOCK_EVENTS;
    }

    // Reconcile active participant count from event_participants for all events
    const events = await Promise.all(
      res.documents.map(async (doc) => {
        const event = docToEvent(doc as AppwriteDocument);
        if (!isMockId(event.id)) {
          const dbParts = await getEventParticipants(event.id);
          const activeCount = dbParts.length;
          const userIds = dbParts.map(p => p.user_id);

          event.participants = userIds.length > 0 ? userIds : Array(activeCount).fill('__db__');

          // Reconcile current_participants in Appwrite if mismatched
          if (doc.current_participants !== activeCount) {
            databases.updateDocument(DATABASE_ID, COLLECTIONS.EVENTS, event.id, {
              current_participants: activeCount,
            }).catch(() => null);
          }
        }
        return event;
      })
    );

    return events;
  } catch (err: any) {
    console.error('[eventService] getEvents failed (using mocks):', err?.message ?? err);
    return MOCK_EVENTS;
  }
}

export async function getEvent(id: string): Promise<Event | null> {
  if (isMockId(id)) {
    return MOCK_EVENTS.find(e => e.id === id) ?? null;
  }
  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.EVENTS, id);
    const event = docToEvent(doc as AppwriteDocument);
    const dbParts = await getEventParticipants(id);
    const activeCount = dbParts.length;
    const userIds = dbParts.map(p => p.user_id);

    event.participants = userIds.length > 0 ? userIds : Array(activeCount).fill('__db__');

    if (doc.current_participants !== activeCount) {
      databases.updateDocument(DATABASE_ID, COLLECTIONS.EVENTS, id, {
        current_participants: activeCount,
      }).catch(() => null);
    }

    return event;
  } catch (err: any) {
    const mock = MOCK_EVENTS.find(e => e.id === id);
    if (mock) {
      console.warn(`[eventService] Event ${id} not in Appwrite — using mock.`);
      return mock;
    }
    console.error('[eventService] getEvent failed:', err?.message ?? err);
    return null;
  }
}

// ─── CREATE ──────────────────────────────────────────────────────────────────

export async function createEvent(event: Omit<Event, 'id'>): Promise<Event | null> {
  try {
    const data = eventToDoc(event as Partial<Event>);

    data.created_at           = new Date().toISOString();
    data.current_participants = 1;

    console.log('[eventService] Creating event...', {
      title:        data.title,
      sport:        data.sport,
      organizer_id: data.organizer_id,
    });

    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.EVENTS,
      ID.unique(),
      data
    );

    console.log('[eventService] ✅ Event saved — Appwrite ID:', doc.$id);

    // Automatically register organizer as first participant in event_participants
    await addParticipantRecord(doc.$id, event.organizerId, 'confirmed', 'solo', null);

    const saved = docToEvent(doc as AppwriteDocument);
    saved.participants = [event.organizerId];
    return saved;
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error('[eventService] ❌ createEvent failed:', msg);
    return null;
  }
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────

export async function updateEvent(id: string, updates: Partial<Event>): Promise<Event | null> {
  if (isMockId(id)) {
    console.warn(`[eventService] Skipping update for non-Appwrite ID: ${id}`);
    return null;
  }
  try {
    const data = eventToDoc(updates);
    const doc  = await databases.updateDocument(DATABASE_ID, COLLECTIONS.EVENTS, id, data);
    return docToEvent(doc as AppwriteDocument);
  } catch (err: any) {
    console.error('[eventService] updateEvent failed:', err?.message ?? err);
    return null;
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

export async function deleteEvent(id: string): Promise<boolean> {
  if (isMockId(id)) {
    console.warn(`[eventService] Skipping delete for non-Appwrite ID: ${id}`);
    return false;
  }
  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.EVENTS, id);
    return true;
  } catch (err: any) {
    console.error('[eventService] deleteEvent failed:', err?.message ?? err);
    return false;
  }
}

// ─── JOIN / LEAVE ─────────────────────────────────────────────────────────────

export async function joinEvent(
  eventId: string,
  userId: string,
  entryType: 'solo' | 'team' | 'squad' | 'crew' = 'solo',
  teamId?: string | null,
  teamMembers?: string[]
): Promise<{ success: boolean; message: string; addedCount?: number }> {
  if (isMockId(eventId)) return { success: true, message: 'Joined event' };

  try {
    const eventDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.EVENTS, eventId);
    const maxParticipants = eventDoc.max_participants || 32;

    const existingRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.EVENT_PARTICIPANTS,
      [Query.equal('event_id', eventId), Query.limit(200)]
    );
    const currentCount = existingRes.documents.length;

    const alreadyJoined = existingRes.documents.some(d => d.user_id === userId);
    if (alreadyJoined) {
      return { success: false, message: 'You are already registered for this event.' };
    }

    const membersToAdd = (teamMembers && teamMembers.length > 0) ? teamMembers : [userId];

    if (currentCount + membersToAdd.length > maxParticipants) {
      return { success: false, message: 'Registration closed — event capacity full.' };
    }

    let addedCount = 0;
    for (const memberId of membersToAdd) {
      const isMemberJoined = existingRes.documents.some(d => d.user_id === memberId);
      if (!isMemberJoined) {
        const ok = await addParticipantRecord(eventId, memberId, 'registered', entryType, teamId || null);
        if (ok) addedCount++;
      }
    }

    const updatedCount = currentCount + addedCount;
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.EVENTS, eventId, {
      current_participants: updatedCount,
    });

    return { success: true, message: 'Successfully registered for event!', addedCount };
  } catch (err: any) {
    console.error('[eventService] joinEvent failed:', err?.message ?? err);
    return { success: false, message: err?.message || 'Could not join event.' };
  }
}

export async function leaveEvent(
  eventId: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  if (isMockId(eventId)) return { success: true, message: 'Left event' };

  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.EVENT_PARTICIPANTS,
      [Query.equal('event_id', eventId), Query.equal('user_id', userId), Query.limit(10)]
    );

    if (res.documents.length === 0) {
      return { success: false, message: 'You are not registered for this event.' };
    }

    for (const doc of res.documents) {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.EVENT_PARTICIPANTS, doc.$id);
    }

    const remainingRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.EVENT_PARTICIPANTS,
      [Query.equal('event_id', eventId), Query.limit(200)]
    );
    const newCount = remainingRes.documents.length;

    await databases.updateDocument(DATABASE_ID, COLLECTIONS.EVENTS, eventId, {
      current_participants: newCount,
    });

    return { success: true, message: 'Registration cancelled.' };
  } catch (err: any) {
    console.error('[eventService] leaveEvent failed:', err?.message ?? err);
    return { success: false, message: err?.message || 'Could not leave event.' };
  }
}
