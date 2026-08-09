import { databases, ID, Query, DATABASE_ID, COLLECTIONS } from '../api/appwrite';
import { Event, EventParticipant } from '../types';
import { getMediaFileUrl } from './storageService';

function docToEvent(doc: any): Event {
  const bannerUrl = doc.banner_image_url || getMediaFileUrl(doc.banner_image_file_id) || null;

  return {
    id: doc.$id,
    title: doc.title || 'SportiX Clash Event',
    sport: doc.sport || 'Multi-Sport',
    date: doc.date || new Date().toISOString(),
    time: doc.time || '18:00',
    location: doc.location || 'Stadium Arena',
    venue: doc.venue || doc.location || 'Stadium Arena',
    description: doc.description || '',
    format: doc.format || '5v5',
    max_participants: doc.max_participants || 32,
    current_participants: doc.current_participants || 0,
    entry_fee: doc.entry_fee || 0,
    organizer_id: doc.organizer_id || 'organizer',
    organizer_name: doc.organizer_name || 'SportiX Arena',
    status: doc.status || 'upcoming',
    banner_image_file_id: doc.banner_image_file_id || null,
    banner_image_url: bannerUrl,
    created_at: doc.$createdAt,
  };
}

export async function getEvents(): Promise<Event[]> {
  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.EVENTS,
      [Query.limit(50), Query.orderAsc('date')]
    );
    return res.documents.map(docToEvent);
  } catch (err: any) {
    console.error('[eventService] getEvents error:', err?.message ?? err);
    return [];
  }
}

export async function getEventById(eventId: string): Promise<Event | null> {
  if (!eventId) return null;
  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.EVENTS, eventId);
    return docToEvent(doc);
  } catch (err: any) {
    console.error('[eventService] getEventById error:', err?.message ?? err);
    return null;
  }
}

export async function getEventParticipants(eventId: string): Promise<EventParticipant[]> {
  if (!eventId) return [];
  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.EVENT_PARTICIPANTS,
      [Query.equal('event_id', eventId), Query.limit(100)]
    );
    return res.documents.map(d => ({
      $id: d.$id,
      event_id: d.event_id,
      user_id: d.user_id,
      user_name: d.user_name || 'Athlete',
      user_avatar: d.user_avatar,
      status: d.status || 'confirmed',
      joined_at: d.joined_at || d.$createdAt,
    }));
  } catch (err: any) {
    console.error('[eventService] getEventParticipants error:', err?.message ?? err);
    return [];
  }
}

export async function joinEvent(
  eventId: string,
  userId: string,
  userName: string = 'Athlete',
  userAvatar?: string
): Promise<boolean> {
  if (!eventId || !userId) return false;

  try {
    const existing = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.EVENT_PARTICIPANTS,
      [Query.equal('event_id', eventId), Query.equal('user_id', userId), Query.limit(1)]
    );

    if (existing.documents.length > 0) return true;

    await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.EVENT_PARTICIPANTS,
      ID.unique(),
      {
        event_id: eventId,
        user_id: userId,
        user_name: userName,
        user_avatar: userAvatar || '',
        status: 'confirmed',
        joined_at: new Date().toISOString(),
      }
    );

    const eventDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.EVENTS, eventId);
    const newCount = (eventDoc.current_participants || 0) + 1;

    await databases.updateDocument(DATABASE_ID, COLLECTIONS.EVENTS, eventId, {
      current_participants: newCount,
    });

    return true;
  } catch (err: any) {
    console.error('[eventService] joinEvent error:', err?.message ?? err);
    return false;
  }
}
