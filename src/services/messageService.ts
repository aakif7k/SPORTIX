/**
 * messageService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Real-time chat service for Appwrite `conversations`, `conversation_members`, `messages`, and `notifications`.
 */

import { databases, ID, Query, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { getProfile, profileToUserShape } from './profileService';

export interface DbConversation {
  $id: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
  last_message_time?: string;
  is_group?: boolean;
}

export interface DbConversationMember {
  $id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  unread_count: number;
  last_read_at?: string;
}

export interface DbMessage {
  $id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  message_type: 'text' | 'image';
  created_at: string;
  edited_at?: string;
  read_at?: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

export interface ConversationSummary {
  id: string;
  partner: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    isOnline: boolean;
  };
  lastMessage?: {
    content: string;
    timestamp: string;
    senderId: string;
  };
  unreadCount: number;
  updatedAt: string;
  isEventChat?: boolean;
  eventName?: string;
}

/**
 * Get or create a 1-to-1 conversation between currentUserId and targetUserId.
 * Reuses existing conversation if one exists, otherwise creates a new conversation document
 * and two conversation_members documents.
 */
export async function getOrCreateConversation(
  currentUserId: string,
  targetUserId: string
): Promise<string | null> {
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) return null;

  try {
    // 1. Resolve real profile document IDs if handles/usernames were passed
    const currentProfile = await getProfile(currentUserId);
    const targetProfile  = await getProfile(targetUserId);

    const realCurrentId = currentProfile?.id || currentUserId;
    const realTargetId  = targetProfile?.id  || targetUserId;

    if (realCurrentId === realTargetId) return null;

    // 2. Fetch current user's conversation memberships
    const currentMembers = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.CONVERSATION_MEMBERS,
      [Query.equal('user_id', realCurrentId), Query.limit(100)]
    );

    // 3. Fetch target user's conversation memberships
    const targetMembers = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.CONVERSATION_MEMBERS,
      [Query.equal('user_id', realTargetId), Query.limit(100)]
    );

    // 4. Intersect conversation IDs to find existing 1-to-1 chat
    const currentConvIds = new Set(currentMembers.documents.map(d => d.conversation_id));
    const sharedConv = targetMembers.documents.find(d => currentConvIds.has(d.conversation_id));

    if (sharedConv) {
      return sharedConv.conversation_id;
    }

    // 5. No existing conversation found — create a new conversation document
    const now = new Date().toISOString();
    let convDoc: any = null;

    try {
      convDoc = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.CONVERSATIONS,
        ID.unique(),
        {
          created_at: now,
          updated_at: now,
          last_message: 'Started a new conversation',
          last_message_time: now,
          is_group: false,
        }
      );
    } catch {
      convDoc = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.CONVERSATIONS,
        ID.unique(),
        {
          created_at: now,
          updated_at: now,
        }
      );
    }

    const convId = convDoc.$id;

    // Create member records for both users
    try {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.CONVERSATION_MEMBERS,
        ID.unique(),
        {
          conversation_id: convId,
          user_id: realCurrentId,
          joined_at: now,
          unread_count: 0,
        }
      );
    } catch (e1) {
      console.error('[messageService] create member current user error:', e1);
    }

    try {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.CONVERSATION_MEMBERS,
        ID.unique(),
        {
          conversation_id: convId,
          user_id: realTargetId,
          joined_at: now,
          unread_count: 0,
        }
      );
    } catch (e2) {
      console.error('[messageService] create member target user error:', e2);
    }

    return convId;
  } catch (err: any) {
    console.error('[messageService] getOrCreateConversation error:', err?.message ?? err);
    return null;
  }
}

/**
 * Fetch all active conversations for currentUserId from Appwrite.
 */
export async function getUserConversations(currentUserId: string): Promise<ConversationSummary[]> {
  if (!currentUserId) return [];

  try {
    const userMembers = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.CONVERSATION_MEMBERS,
      [Query.equal('user_id', currentUserId), Query.limit(100)]
    );

    if (userMembers.documents.length === 0) return [];

    const memberMap = new Map<string, number>();
    const convIds: string[] = [];

    userMembers.documents.forEach(doc => {
      convIds.push(doc.conversation_id);
      memberMap.set(doc.conversation_id, doc.unread_count || 0);
    });

    const summaries: ConversationSummary[] = [];

    for (const convId of convIds) {
      try {
        const convDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.CONVERSATIONS, convId);
        
        const membersRes = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.CONVERSATION_MEMBERS,
          [Query.equal('conversation_id', convId), Query.limit(10)]
        );

        const partnerMember = membersRes.documents.find(d => d.user_id !== currentUserId);
        const partnerId = partnerMember?.user_id;

        let partnerInfo = {
          id: partnerId || 'unknown',
          name: 'Athlete',
          username: 'athlete',
          avatar: 'https://i.pravatar.cc/150?u=athlete',
          isOnline: true,
        };

        if (partnerId) {
          const partnerProfile = await getProfile(partnerId);
          if (partnerProfile) {
            const userShape = profileToUserShape(partnerProfile);
            partnerInfo = {
              id: partnerProfile.id,
              name: partnerProfile.full_name || 'Athlete',
              username: partnerProfile.username || 'athlete',
              avatar: userShape.avatar,
              isOnline: true,
            };
          }
        }

        summaries.push({
          id: convId,
          partner: partnerInfo,
          lastMessage: convDoc.last_message ? {
            content: convDoc.last_message,
            timestamp: convDoc.last_message_time || convDoc.updated_at || convDoc.$createdAt,
            senderId: '',
          } : undefined,
          unreadCount: memberMap.get(convId) || 0,
          updatedAt: convDoc.last_message_time || convDoc.updated_at || convDoc.$createdAt,
        });
      } catch (err) {
        console.warn(`[messageService] Error fetching conv ${convId}:`, err);
      }
    }

    return summaries.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (err: any) {
    console.error('[messageService] getUserConversations error:', err?.message ?? err);
    return [];
  }
}

/**
 * Fetch messages for a specific conversation.
 */
export async function getConversationMessages(conversationId: string): Promise<DbMessage[]> {
  if (!conversationId) return [];

  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.MESSAGES,
      [Query.equal('conversation_id', conversationId), Query.limit(100), Query.orderAsc('created_at')]
    );

    return res.documents.map(d => ({
      $id: d.$id,
      conversation_id: d.conversation_id,
      sender_id: d.sender_id,
      message: d.message || d.content || '',
      message_type: d.message_type || 'text',
      created_at: d.created_at || d.$createdAt,
      edited_at: d.edited_at,
      read_at: d.read_at,
      status: d.status || 'sent',
    }));
  } catch (err: any) {
    console.error('[messageService] getConversationMessages error:', err?.message ?? err);
    return [];
  }
}

/**
 * Send a message in a conversation.
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  messageText: string,
  messageType: 'text' | 'image' = 'text'
): Promise<DbMessage | null> {
  if (!conversationId || !senderId || !messageText.trim()) return null;

  try {
    const now = new Date().toISOString();

    const msgDoc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.MESSAGES,
      ID.unique(),
      {
        conversation_id: conversationId,
        sender_id: senderId,
        message: messageText.trim(),
        message_type: messageType,
        created_at: now,
        status: 'sent',
      }
    );

    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.CONVERSATIONS,
        conversationId,
        {
          last_message: messageText.trim(),
          last_message_time: now,
          updated_at: now,
        }
      );
    } catch { /* fallback if attribute schema differs */ }

    try {
      const membersRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CONVERSATION_MEMBERS,
        [Query.equal('conversation_id', conversationId)]
      );

      for (const memberDoc of membersRes.documents) {
        if (memberDoc.user_id !== senderId) {
          await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.CONVERSATION_MEMBERS,
            memberDoc.$id,
            {
              unread_count: (memberDoc.unread_count || 0) + 1,
            }
          );
        }
      }
    } catch { /* ignore member updates if failing */ }

    return {
      $id: msgDoc.$id,
      conversation_id: conversationId,
      sender_id: senderId,
      message: messageText.trim(),
      message_type: messageType,
      created_at: now,
      status: 'sent',
    };
  } catch (err: any) {
    console.error('[messageService] sendMessage error:', err?.message ?? err);
    return null;
  }
}

/**
 * Mark a conversation as read for a user.
 */
export async function markConversationAsRead(conversationId: string, userId: string): Promise<void> {
  if (!conversationId || !userId) return;

  try {
    const memberRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.CONVERSATION_MEMBERS,
      [Query.equal('conversation_id', conversationId), Query.equal('user_id', userId), Query.limit(1)]
    );

    if (memberRes.documents.length > 0) {
      const memberDoc = memberRes.documents[0];
      if (memberDoc.unread_count > 0) {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.CONVERSATION_MEMBERS,
          memberDoc.$id,
          {
            unread_count: 0,
            last_read_at: new Date().toISOString(),
          }
        );
      }
    }
  } catch (err: any) {
    console.error('[messageService] markConversationAsRead error:', err?.message ?? err);
  }
}

export async function getMessages(squadOrConvId: string): Promise<any[]> {
  const dbMsgs = await getConversationMessages(squadOrConvId);
  return dbMsgs.map(m => ({
    msgId: m.$id,
    senderId: m.sender_id,
    senderName: 'Athlete',
    senderAvatar: `https://i.pravatar.cc/150?u=${m.sender_id}`,
    content: m.message,
    timestamp: m.created_at,
    type: m.message_type || 'text',
  }));
}

export async function createMessage(squadOrConvId: string, msg: any) {
  const senderId = msg.senderId || msg.sender_id || 'cu1';
  const text = msg.content || msg.message || 'Squad message';
  return sendMessage(squadOrConvId, senderId, text);
}
