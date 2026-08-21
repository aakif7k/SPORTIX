/**
 * src/services/eventService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * ClashHub Events — browse, create, join, leave.
 * Handles schema variations (starts_at vs date, banner_url vs banner_image_url).
 */
import { account, databases, DATABASE_ID, COLLECTIONS, ID, Query } from '../api/appwrite';
import { SportixEvent, EventParticipant } from '../types';

function toEvent(doc: any): SportixEvent {
  return {
    $id:                  doc.$id,
    title:                doc.title               ?? '',
    description:          doc.description         ?? '',
    sport:                doc.sport               ?? 'Football',
    event_type:           doc.format              ?? doc.event_type ?? 'casual',
    date:                 doc.starts_at           ?? doc.date ?? doc.$createdAt ?? new Date().toISOString(),
    location:             doc.venue               ?? doc.location ?? doc.city ?? 'Local Stadium',
    organizer_id:         doc.organizer_id        ?? '',
    max_participants:     Number(doc.max_participants ?? 32),
    current_participants: Number(doc.current_participants ?? 0),
    status:               doc.status              ?? 'upcoming',
    target_squad_size:    Number(doc.target_squad_size ?? 5),
    banner_image_url:     doc.banner_url          ?? doc.banner_image_url ?? null,
    entry_fee:            Number(doc.entry_fee ?? 0),
    skill_level:          doc.skill_level         ?? doc.skillLevel ?? 'Amateur',
    $createdAt:           doc.$createdAt,
  };
}

function toParticipant(doc: any): EventParticipant {
  return {
    $id:           doc.$id,
    event_id:      doc.event_id,
    user_id:       doc.user_id,
    role:          doc.role          ?? '',
    selected_role: doc.selected_role ?? doc.role ?? '',
    status:        doc.status        ?? 'registered',
    $createdAt:    doc.$createdAt,
  };
}

export const eventService = {
  /** Get events with optional sport filter and pagination. */
  async getEvents(opts: {
    sport?:  string;
    status?: string;
    limit?:  number;
    offset?: number;
  } = {}): Promise<SportixEvent[]> {
    try {
      const queries: any[] = [
        Query.orderDesc('$createdAt'),
        Query.limit(opts.limit ?? 20),
        Query.offset(opts.offset ?? 0),
      ];
      if (opts.sport && opts.sport !== 'All') {
        queries.push(Query.equal('sport', opts.sport));
      }
      if (opts.status) {
        queries.push(Query.equal('status', opts.status));
      }
      const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.EVENTS, queries);
      return res.documents.map(toEvent);
    } catch (err) {
      console.warn('[eventService] getEvents with filters failed, using fallback list:', err);
      try {
        const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.EVENTS, [Query.limit(50)]);
        let docs = res.documents.map(toEvent);
        if (opts.sport && opts.sport !== 'All') {
          docs = docs.filter(d => d.sport.toLowerCase() === opts.sport?.toLowerCase());
        }
        return docs;
      } catch (fallbackErr) {
        console.error('[eventService] fallback getEvents failed:', fallbackErr);
        return [];
      }
    }
  },

  /** Get a single event. */
  async getEvent(eventId: string): Promise<SportixEvent | null> {
    try {
      const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.EVENTS, eventId);
      return toEvent(doc);
    } catch {
      return null;
    }
  },

  /** Create a new event (organizer flow). */
  async createEvent(data: {
    title:              string;
    description:        string;
    sport:              string;
    event_type:         string;
    date:               string;
    location:           string;
    max_participants:   number;
    target_squad_size?: number;
    entry_fee?:         number | string;
    prize_pool?:        string;
    banner_image_url?:  string;
    skill_level?:       string;
  }): Promise<SportixEvent> {
    const raw = await account.get();
    const nowIso = new Date().toISOString();

    // Ensure valid ISO date for starts_at
    let startsAtIso = nowIso;
    if (data.date) {
      try {
        const d = new Date(data.date.includes('T') ? data.date : `${data.date}T09:00:00.000Z`);
        if (!isNaN(d.getTime())) startsAtIso = d.toISOString();
      } catch {
        startsAtIso = nowIso;
      }
    }

    const doc = await databases.createDocument(DATABASE_ID, COLLECTIONS.EVENTS, ID.unique(), {
      title:                data.title,
      description:          data.description || 'No description provided.',
      sport:                data.sport,
      format:               data.event_type || 'tournament',
      starts_at:            startsAtIso,
      created_at:           nowIso,
      location:             data.location,
      venue:                data.location,
      city:                 data.location,
      max_participants:     Number(data.max_participants) || 32,
      current_participants: 1,
      status:               'upcoming',
      entry_fee:            typeof data.entry_fee === 'string' ? data.entry_fee : (data.entry_fee ? `€${data.entry_fee}` : '€20'),
      prize_pool:           data.prize_pool || '€1,000',
      skill_level:          data.skill_level || 'amateur',
      banner_url:           data.banner_image_url ?? null,
      organizer_id:         raw.$id,
      ai_team_available:    true,
      ai_generated:         false,
    });

    // Automatically register organizer in event_participants
    try {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.EVENT_PARTICIPANTS,
        ID.unique(),
        {
          event_id:      doc.$id,
          user_id:       raw.$id,
          role:          'Captain',
          selected_role: 'Captain',
          status:        'confirmed',
          entry_type:    'solo',
          joined_at:     nowIso,
          created_at:    nowIso,
        }
      );
    } catch (partErr) {
      console.warn('[eventService] Auto-register organizer participant error:', partErr);
    }

    return toEvent(doc);
  },

  /** Get participants for an event. */
  async getParticipants(eventId: string): Promise<EventParticipant[]> {
    try {
      const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.EVENT_PARTICIPANTS, [
        Query.equal('event_id', eventId),
        Query.limit(100),
      ]);
      return res.documents.map(toParticipant);
    } catch (err) {
      console.warn('[eventService] getParticipants failed:', err);
      return [];
    }
  },

  /** Check if the current user is participating in an event. */
  async getMyParticipation(eventId: string): Promise<EventParticipant | null> {
    try {
      const raw = await account.get();
      const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.EVENT_PARTICIPANTS, [
        Query.equal('event_id', eventId),
        Query.equal('user_id', raw.$id),
        Query.limit(1),
      ]);
      return res.total > 0 ? toParticipant(res.documents[0]) : null;
    } catch {
      return null;
    }
  },

  /**
   * Join an event with role selection.
   */
  async joinEvent(eventId: string, selectedRole: string): Promise<EventParticipant> {
    const raw = await account.get();
    const nowIso = new Date().toISOString();

    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.EVENT_PARTICIPANTS,
      ID.unique(),
      {
        event_id:      eventId,
        user_id:       raw.$id,
        role:          selectedRole,
        selected_role: selectedRole,
        status:        'registered',
        entry_type:    'solo',
        joined_at:     nowIso,
        created_at:    nowIso,
      },
    );

    try {
      const event = await databases.getDocument(DATABASE_ID, COLLECTIONS.EVENTS, eventId);
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.EVENTS, eventId, {
        current_participants: ((event as any).current_participants ?? 0) + 1,
      });
    } catch (err) {
      console.warn('[eventService] increment participant count:', err);
    }

    return toParticipant(doc);
  },

  /** Leave an event. */
  async leaveEvent(eventId: string): Promise<void> {
    const raw = await account.get();

    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.EVENT_PARTICIPANTS, [
      Query.equal('event_id', eventId),
      Query.equal('user_id', raw.$id),
      Query.limit(1),
    ]);

    if (res.total === 0) return;

    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTIONS.EVENT_PARTICIPANTS,
      res.documents[0].$id,
    );

    try {
      const event = await databases.getDocument(DATABASE_ID, COLLECTIONS.EVENTS, eventId);
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.EVENTS, eventId, {
        current_participants: Math.max(0, ((event as any).current_participants ?? 1) - 1),
      });
    } catch (err) {
      console.warn('[eventService] decrement participant count:', err);
    }
  },

  /** Organizer-only: update event status. */
  async updateEventStatus(eventId: string, status: SportixEvent['status']): Promise<void> {
    const raw = await account.get();
    const event = await databases.getDocument(DATABASE_ID, COLLECTIONS.EVENTS, eventId);
    if ((event as any).organizer_id !== raw.$id) {
      throw new Error('Only the organizer can update event status.');
    }
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.EVENTS, eventId, { status });
  },
};

// Aliases for compatibility
export const getEvents = eventService.getEvents;
export const getEventById = eventService.getEvent;
export const getEventParticipants = eventService.getParticipants;
export const joinEvent = eventService.joinEvent;
