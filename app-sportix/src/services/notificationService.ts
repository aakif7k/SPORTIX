/**
 * src/services/notificationService.ts
 */
import { account, databases, DATABASE_ID, COLLECTIONS, Query } from '../api/appwrite';
import { AppNotification } from '../types';

function toNotification(doc: any): AppNotification {
  return {
    $id:        doc.$id,
    user_id:    doc.user_id,
    title:      doc.title    ?? '',
    message:    doc.message  ?? '',
    type:       doc.type     ?? 'system',
    is_read:    doc.is_read  ?? false,
    created_at: doc.created_at ?? doc.$createdAt,
    $createdAt: doc.$createdAt,
  };
}

export const notificationService = {
  async getMyNotifications(limit = 50): Promise<AppNotification[]> {
    const raw = await account.get();
    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, [
      Query.equal('user_id', raw.$id),
      Query.orderDesc('$createdAt'),
      Query.limit(limit),
    ]);
    return res.documents.map(toNotification);
  },

  async markRead(notificationId: string): Promise<void> {
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, notificationId, {
      is_read: true,
    });
  },

  async markAllRead(): Promise<void> {
    const raw = await account.get();
    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, [
      Query.equal('user_id', raw.$id),
      Query.equal('is_read', false),
      Query.limit(100),
    ]);
    await Promise.allSettled(
      res.documents.map((doc: any) =>
        databases.updateDocument(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, doc.$id, { is_read: true })
      )
    );
  },
};
