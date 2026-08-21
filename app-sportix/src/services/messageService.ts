/**
 * src/services/messageService.ts
 */
import { account, databases, DATABASE_ID, COLLECTIONS, ID, Query } from '../api/appwrite';
import { Conversation, Message } from '../types';
import { toUserProfile } from './authService';

function toConversation(doc: any): Conversation {
  return {
    $id:              doc.$id,
    name:             doc.name             ?? '',
    is_group:         doc.is_group         ?? false,
    avatar_url:       doc.avatar_url       ?? null,
    last_message:     doc.last_message     ?? null,
    last_message_at:  doc.last_message_at  ?? null,
    $createdAt:       doc.$createdAt,
  };
}

function toMessage(doc: any): Message {
  return {
    $id:             doc.$id,
    conversation_id: doc.conversation_id,
    sender_id:       doc.sender_id,
    content:         doc.content    ?? '',
    $createdAt:      doc.$createdAt,
  };
}

export const messageService = {
  async getMyConversations(): Promise<Conversation[]> {
    const raw = await account.get();
    const memberRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CONVERSATION_MEMBERS, [
      Query.equal('user_id', raw.$id),
      Query.limit(50),
    ]);
    if (memberRes.total === 0) return [];

    const convIds = memberRes.documents.map((d: any) => d.conversation_id);
    const convs: Conversation[] = [];
    for (const cid of convIds) {
      try {
        const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.CONVERSATIONS, cid);
        convs.push(toConversation(doc));
      } catch { /* deleted */ }
    }
    return convs.sort((a, b) =>
      (b.last_message_at ?? b.$createdAt) > (a.last_message_at ?? a.$createdAt) ? 1 : -1
    );
  },

  async getMessages(conversationId: string, limit = 50): Promise<Message[]> {
    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.MESSAGES, [
      Query.equal('conversation_id', conversationId),
      Query.orderDesc('$createdAt'),
      Query.limit(limit),
    ]);
    const messages = res.documents.map(toMessage).reverse();
    // Enrich with sender profiles
    for (const msg of messages) {
      try {
        const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, msg.sender_id);
        msg.sender = toUserProfile(doc);
      } catch { /* profile unavailable */ }
    }
    return messages;
  },

  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const raw = await account.get();
    const doc = await databases.createDocument(DATABASE_ID, COLLECTIONS.MESSAGES, ID.unique(), {
      conversation_id: conversationId,
      sender_id:       raw.$id,
      content:         content.trim(),
    });
    // Update conversation last_message
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.CONVERSATIONS, conversationId, {
      last_message:    content.trim().substring(0, 80),
      last_message_at: new Date().toISOString(),
    });
    return toMessage(doc);
  },

  /** Start a 1:1 conversation or return existing. */
  async getOrCreateDirectConversation(otherUserId: string): Promise<Conversation> {
    const raw = await account.get();
    const myId = raw.$id;

    // Check if a DM conversation already exists
    const myMemberships = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CONVERSATION_MEMBERS, [
      Query.equal('user_id', myId),
      Query.limit(100),
    ]);

    for (const m of myMemberships.documents) {
      const members = await databases.listDocuments(DATABASE_ID, COLLECTIONS.CONVERSATION_MEMBERS, [
        Query.equal('conversation_id', (m as any).conversation_id),
        Query.limit(10),
      ]);
      const memberIds = members.documents.map((d: any) => d.user_id);
      if (memberIds.length === 2 && memberIds.includes(otherUserId)) {
        const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.CONVERSATIONS, (m as any).conversation_id);
        if (!(doc as any).is_group) return toConversation(doc);
      }
    }

    // Create new DM
    const { profileService } = await import('./profileService');
    const other = await profileService.getProfile(otherUserId);

    const conv = await databases.createDocument(DATABASE_ID, COLLECTIONS.CONVERSATIONS, ID.unique(), {
      name:      other?.full_name ?? 'Direct Message',
      is_group:  false,
      avatar_url:other?.avatar_url ?? null,
    });

    await Promise.all([
      databases.createDocument(DATABASE_ID, COLLECTIONS.CONVERSATION_MEMBERS, ID.unique(), {
        conversation_id: conv.$id,
        user_id:         myId,
      }),
      databases.createDocument(DATABASE_ID, COLLECTIONS.CONVERSATION_MEMBERS, ID.unique(), {
        conversation_id: conv.$id,
        user_id:         otherUserId,
      }),
    ]);

    return toConversation(conv);
  },
};
