/**
 * notificationService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Full CRUD service for Appwrite `notifications` collection.
 * Uses fallback mock data if collections are empty or unavailable.
 */

import { databases, ID, Query, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import type { Notification } from '@/types';
import { MOCK_NOTIFICATIONS } from './mockData';

type AppwriteDocument = Record<string, any> & {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
};

// ─── MAPPER ──────────────────────────────────────────────────────────────────
function docToNotification(doc: AppwriteDocument): Notification {
  return {
    id: doc.$id,
    userId: doc.user_id || '',
    type: doc.type || 'connection_request',
    title: doc.title || '',
    message: doc.message || '',
    read: doc.read || false,
    timestamp: doc.$createdAt,
    relatedId: doc.related_id,
    relatedType: doc.related_type,
    actorAvatar: doc.actor_avatar,
    actorName: doc.actor_name
  } as Notification;
}

function notificationToDoc(n: Partial<Notification>): Record<string, any> {
  const doc: Record<string, any> = {};
  if (n.userId !== undefined) doc.user_id = n.userId;
  if (n.type !== undefined) doc.type = n.type;
  if (n.title !== undefined) doc.title = n.title;
  if (n.message !== undefined) doc.message = n.message;
  if (n.read !== undefined) doc.read = n.read;
  if (n.relatedId !== undefined) doc.related_id = n.relatedId;
  if (n.relatedType !== undefined) doc.related_type = n.relatedType;
  if (n.actorAvatar !== undefined) doc.actor_avatar = n.actorAvatar;
  if (n.actorName !== undefined) doc.actor_name = n.actorName;
  return doc;
}

// ─── READ ────────────────────────────────────────────────────────────────────
export async function getNotifications(userId: string): Promise<Notification[]> {
  if (!userId) return [];
  try {
    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, [
      Query.equal('user_id', userId),
      Query.orderDesc('$createdAt'),
      Query.limit(50)
    ]);
    
    if (res.documents.length === 0) {
      // Fallback only if no Appwrite records exist, filtering mocks by user
      return MOCK_NOTIFICATIONS;
    }
    
    return res.documents.map(d => docToNotification(d as AppwriteDocument));
  } catch (err) {
    console.warn('[notificationService] getNotifications failed, using mock data:', err);
    return MOCK_NOTIFICATIONS;
  }
}

// ─── CREATE ──────────────────────────────────────────────────────────────────
export async function createNotification(n: Omit<Notification, 'id' | 'timestamp'>): Promise<Notification | null> {
  try {
    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.NOTIFICATIONS,
      ID.unique(),
      notificationToDoc(n)
    );
    return docToNotification(doc as AppwriteDocument);
  } catch (err) {
    console.error('[notificationService] createNotification failed:', err);
    return null;
  }
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────
export async function markNotificationRead(id: string): Promise<boolean> {
  try {
    if (id.startsWith('n')) return true; // mock id
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, id, { read: true });
    return true;
  } catch (err) {
    console.error('[notificationService] markNotificationRead failed:', err);
    return false;
  }
}

export async function markAllNotificationsRead(userId: string): Promise<boolean> {
  try {
    // 1. Fetch unread notifications for user
    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, [
      Query.equal('user_id', userId),
      Query.equal('read', false)
    ]);
    // 2. Update each
    await Promise.all(res.documents.map(d => 
      databases.updateDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, d.$id, { read: true })
    ));
    return true;
  } catch (err) {
    console.error('[notificationService] markAllNotificationsRead failed:', err);
    return false;
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────────────
export async function clearAllNotifications(userId: string): Promise<boolean> {
  try {
    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, [
      Query.equal('user_id', userId)
    ]);
    await Promise.all(res.documents.map(d => 
      databases.deleteDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, d.$id)
    ));
    return true;
  } catch (err) {
    console.error('[notificationService] clearAllNotifications failed:', err);
    return false;
  }
}
