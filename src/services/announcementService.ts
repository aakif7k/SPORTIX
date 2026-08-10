import { databases, DATABASE_ID, COLLECTIONS, ID, Query } from '../lib/appwrite';
import { getEventParticipants } from './eventService';

export interface EventAnnouncement {
  id: string;
  eventId: string;
  authorId: string;
  authorName: string;
  authorUsername?: string;
  title: string;
  message: string;
  category: 'GENERAL' | 'SCHEDULE' | 'IMPORTANT' | 'MATCH' | 'VENUE' | 'REGISTRATION';
  createdAt: string;
}

export interface EventScheduleItem {
  id: string;
  eventId: string;
  title: string;
  time: string;
  description?: string;
  location?: string;
  createdAt: string;
}

/**
 * Fetch all announcements for an event from Appwrite comments collection
 */
export async function getEventAnnouncements(eventId: string): Promise<EventAnnouncement[]> {
  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.COMMENTS,
      [
        Query.equal('post_id', `announcement_${eventId}`),
        Query.orderDesc('$createdAt'),
      ]
    );

    return res.documents.map((doc: any) => {
      let parsedContent: any = {};
      try {
        parsedContent = JSON.parse(doc.content || '{}');
      } catch {
        parsedContent = { title: 'Announcement', message: doc.content || '', category: 'GENERAL' };
      }

      return {
        id: doc.$id,
        eventId,
        authorId: doc.author_id || '',
        authorName: doc.author_name || 'Organizer',
        authorUsername: doc.author_username || 'organizer',
        title: parsedContent.title || 'Announcement',
        message: parsedContent.message || parsedContent.body || doc.content || '',
        category: parsedContent.category || 'GENERAL',
        createdAt: doc.created_at || doc.$createdAt,
      };
    });
  } catch (error) {
    console.error('Error fetching event announcements:', error);
    return [];
  }
}

/**
 * Create a new event announcement and notify all registered participants
 */
export async function createEventAnnouncement(params: {
  eventId: string;
  eventTitle: string;
  organizerId: string;
  organizerName: string;
  organizerUsername?: string;
  title: string;
  message: string;
  category?: 'GENERAL' | 'SCHEDULE' | 'IMPORTANT' | 'MATCH' | 'VENUE' | 'REGISTRATION';
}): Promise<{ success: boolean; announcement?: EventAnnouncement; error?: string }> {
  try {
    const category = params.category || 'GENERAL';
    const contentPayload = JSON.stringify({
      title: params.title,
      message: params.message,
      category,
      published_at: new Date().toISOString(),
    });

    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.COMMENTS,
      ID.unique(),
      {
        post_id: `announcement_${params.eventId}`,
        author_id: params.organizerId,
        author_name: params.organizerName,
        author_username: params.organizerUsername || 'organizer',
        content: contentPayload,
        created_at: new Date().toISOString(),
        is_deleted: false,
      }
    );

    const announcement: EventAnnouncement = {
      id: doc.$id,
      eventId: params.eventId,
      authorId: params.organizerId,
      authorName: params.organizerName,
      authorUsername: params.organizerUsername,
      title: params.title,
      message: params.message,
      category,
      createdAt: doc.created_at || doc.$createdAt,
    };

    // Send notifications to all registered participants asynchronously
    notifyEventParticipants({
      eventId: params.eventId,
      eventTitle: params.eventTitle,
      announcementTitle: params.title,
      announcementMessage: params.message,
      organizerId: params.organizerId,
      organizerName: params.organizerName,
    }).catch(err => console.error('Error notifying participants:', err));

    return { success: true, announcement };
  } catch (error: any) {
    console.error('Error creating event announcement:', error);
    return { success: false, error: error?.message || 'Failed to publish announcement.' };
  }
}

/**
 * Delete an announcement from Appwrite
 */
export async function deleteEventAnnouncement(announcementId: string): Promise<boolean> {
  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.COMMENTS, announcementId);
    return true;
  } catch (error) {
    console.error('Error deleting event announcement:', error);
    return false;
  }
}

/**
 * Notify all registered participants of a new announcement using Appwrite notifications collection
 */
export async function notifyEventParticipants(params: {
  eventId: string;
  eventTitle: string;
  announcementTitle: string;
  announcementMessage: string;
  organizerId: string;
  organizerName: string;
}): Promise<number> {
  try {
    const participants = await getEventParticipants(params.eventId);
    const recipients = participants.filter(p => p.user_id && p.user_id !== params.organizerId);

    let sentCount = 0;
    for (const p of recipients) {
      try {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.NOTIFICATIONS,
          ID.unique(),
          {
            user_id: p.user_id,
            type: 'event_announcement',
            title: `📢 ${params.eventTitle}: ${params.announcementTitle}`,
            body: params.announcementMessage,
            actor_id: params.organizerId,
            actor_name: params.organizerName,
            actor_avatar_url: null,
            entity_id: params.eventId,
            entity_type: 'event',
            is_read: false,
            created_at: new Date().toISOString(),
          }
        );
        sentCount++;
      } catch (err) {
        console.error(`Failed to send notification to participant ${p.user_id}:`, err);
      }
    }
    return sentCount;
  } catch (error) {
    console.error('Error sending announcement notifications:', error);
    return 0;
  }
}

/**
 * Fetch event schedule items from Appwrite comments collection
 */
export async function getEventSchedule(eventId: string): Promise<EventScheduleItem[]> {
  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.COMMENTS,
      [
        Query.equal('post_id', `schedule_${eventId}`),
        Query.orderAsc('$createdAt'),
      ]
    );

    return res.documents.map((doc: any) => {
      let parsedContent: any = {};
      try {
        parsedContent = JSON.parse(doc.content || '{}');
      } catch {
        parsedContent = { title: doc.content || 'Schedule Item', time: 'TBD' };
      }

      return {
        id: doc.$id,
        eventId,
        title: parsedContent.title || 'Schedule Item',
        time: parsedContent.time || 'TBD',
        description: parsedContent.description || '',
        location: parsedContent.location || '',
        createdAt: doc.created_at || doc.$createdAt,
      };
    });
  } catch (error) {
    console.error('Error fetching event schedule:', error);
    return [];
  }
}

/**
 * Create a new event schedule item in Appwrite
 */
export async function createScheduleItem(params: {
  eventId: string;
  organizerId: string;
  title: string;
  time: string;
  description?: string;
  location?: string;
}): Promise<{ success: boolean; item?: EventScheduleItem; error?: string }> {
  try {
    const contentPayload = JSON.stringify({
      title: params.title,
      time: params.time,
      description: params.description || '',
      location: params.location || '',
    });

    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.COMMENTS,
      ID.unique(),
      {
        post_id: `schedule_${params.eventId}`,
        author_id: params.organizerId,
        author_name: 'Organizer',
        content: contentPayload,
        created_at: new Date().toISOString(),
        is_deleted: false,
      }
    );

    const item: EventScheduleItem = {
      id: doc.$id,
      eventId: params.eventId,
      title: params.title,
      time: params.time,
      description: params.description,
      location: params.location,
      createdAt: doc.created_at || doc.$createdAt,
    };

    return { success: true, item };
  } catch (error: any) {
    console.error('Error creating schedule item:', error);
    return { success: false, error: error?.message || 'Failed to create schedule item.' };
  }
}

/**
 * Delete a schedule item from Appwrite
 */
export async function deleteScheduleItem(scheduleId: string): Promise<boolean> {
  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.COMMENTS, scheduleId);
    return true;
  } catch (error) {
    console.error('Error deleting schedule item:', error);
    return false;
  }
}
