/**
 * messageService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Real-time chat service for Appwrite `conversations`, `conversation_members`, `messages`, and `notifications`.
 * Features schema-resilient fallbacks for attribute and index variations.
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

    // Collect all candidate user IDs for current and target
    const currentIds = Array.from(new Set([currentUserId, realCurrentId])).filter(Boolean);
    const targetIds  = Array.from(new Set([targetUserId, realTargetId])).filter(Boolean);

    // 2. Fetch current user's conversation memberships
    const currentMembersDocs: any[] = [];
    for (const uid of currentIds) {
      try {
        const res = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.CONVERSATION_MEMBERS,
          [Query.equal('user_id', uid), Query.limit(100)]
        );
        currentMembersDocs.push(...res.documents);
      } catch {}
    }

    // 3. Fetch target user's conversation memberships
    const targetMembersDocs: any[] = [];
    for (const uid of targetIds) {
      try {
        const res = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.CONVERSATION_MEMBERS,
          [Query.equal('user_id', uid), Query.limit(100)]
        );
        targetMembersDocs.push(...res.documents);
      } catch {}
    }

    // 4. Intersect conversation IDs to find existing 1-to-1 chat
    const currentConvIds = new Set(currentMembersDocs.map(d => d.conversation_id));
    const sharedConv = targetMembersDocs.find(d => currentConvIds.has(d.conversation_id));

    if (sharedConv) {
      return sharedConv.conversation_id;
    }

    // 5. No existing conversation found — create a new conversation document
    const now = new Date().toISOString();
    let convDoc: any = null;

    const convPayloads = [
      {
        created_at: now,
        updated_at: now,
        last_message: 'Started a new conversation',
        last_message_time: now,
        is_group: false,
      },
      {
        created_at: now,
        updated_at: now,
      },
      {}
    ];

    for (const payload of convPayloads) {
      try {
        convDoc = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.CONVERSATIONS,
          ID.unique(),
          payload
        );
        if (convDoc?.$id) break;
      } catch {}
    }

    if (!convDoc?.$id) return null;
    const convId = convDoc.$id;

    // Create member records for both users with fallback
    for (const uid of [realCurrentId, realTargetId]) {
      const memberPayloads = [
        { conversation_id: convId, user_id: uid, joined_at: now, unread_count: 0 },
        { conversation_id: convId, user_id: uid },
      ];
      for (const payload of memberPayloads) {
        try {
          await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.CONVERSATION_MEMBERS,
            ID.unique(),
            payload
          );
          break;
        } catch {}
      }
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
    const currentProfile = await getProfile(currentUserId);
    const realCurrentId  = currentProfile?.id || currentUserId;
    const userIds = Array.from(new Set([currentUserId, realCurrentId])).filter(Boolean);

    const userMembersDocs: any[] = [];
    for (const uid of userIds) {
      try {
        const res = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.CONVERSATION_MEMBERS,
          [Query.equal('user_id', uid), Query.limit(100)]
        );
        userMembersDocs.push(...res.documents);
      } catch {}
    }

    if (userMembersDocs.length === 0) return [];

    const memberMap = new Map<string, number>();
    const convIdsSet = new Set<string>();

    userMembersDocs.forEach(doc => {
      if (doc.conversation_id) {
        convIdsSet.add(doc.conversation_id);
        memberMap.set(doc.conversation_id, doc.unread_count || 0);
      }
    });

    const convIds = Array.from(convIdsSet);
    const summaries: ConversationSummary[] = [];

    for (const convId of convIds) {
      try {
        const convDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.CONVERSATIONS, convId);
        
        let membersRes = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.CONVERSATION_MEMBERS,
          [Query.equal('conversation_id', convId), Query.limit(10)]
        ).catch(() => ({ documents: [] }));

        const partnerMember = membersRes.documents.find(d => !userIds.includes(d.user_id));
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
              name: partnerProfile.full_name || partnerProfile.username || 'Athlete',
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
 * Fetch messages for a specific conversation with unindexed fallback.
 */
export async function getConversationMessages(conversationId: string): Promise<DbMessage[]> {
  if (!conversationId) return [];

  let docs: any[] = [];
  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.MESSAGES,
      [Query.equal('conversation_id', conversationId), Query.limit(100), Query.orderAsc('created_at')]
    );
    docs = res.documents;
  } catch {
    // Unindexed fallback query
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        [Query.equal('conversation_id', conversationId), Query.limit(100)]
      );
      docs = res.documents.sort(
        (a, b) => new Date(a.created_at || a.$createdAt).getTime() - new Date(b.created_at || b.$createdAt).getTime()
      );
    } catch (err: any) {
      console.error('[messageService] getConversationMessages fallback failed:', err?.message ?? err);
      docs = [];
    }
  }

  return docs.map(d => ({
    $id: d.$id,
    conversation_id: d.conversation_id,
    sender_id: d.sender_id || d.user_id || d.userId || '',
    message: d.message || d.content || d.text || '',
    message_type: d.message_type || 'text',
    created_at: d.created_at || d.$createdAt,
    edited_at: d.edited_at,
    read_at: d.read_at,
    status: d.status || 'sent',
  }));
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
    const cleanText = messageText.trim();
    let msgDoc: any = null;

    const messagePayloads = [
      {
        conversation_id: conversationId,
        sender_id: senderId,
        message: cleanText,
        message_type: messageType,
        created_at: now,
        status: 'sent',
      },
      {
        conversation_id: conversationId,
        sender_id: senderId,
        message: cleanText,
        created_at: now,
      },
      {
        conversation_id: conversationId,
        sender_id: senderId,
        content: cleanText,
        created_at: now,
      },
      {
        conversation_id: conversationId,
        user_id: senderId,
        message: cleanText,
      }
    ];

    for (const payload of messagePayloads) {
      try {
        msgDoc = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.MESSAGES,
          ID.unique(),
          payload
        );
        if (msgDoc?.$id) break;
      } catch {}
    }

    if (!msgDoc?.$id) {
      console.error('[messageService] Could not create message document with any payload variant.');
      return null;
    }

    // Update conversation last_message asynchronously
    databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.CONVERSATIONS,
      conversationId,
      {
        last_message: cleanText,
        last_message_time: now,
        updated_at: now,
      }
    ).catch(() => null);

    // Update member unread count asynchronously
    databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.CONVERSATION_MEMBERS,
      [Query.equal('conversation_id', conversationId)]
    ).then(membersRes => {
      for (const memberDoc of membersRes.documents) {
        if (memberDoc.user_id !== senderId) {
          databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.CONVERSATION_MEMBERS,
            memberDoc.$id,
            { unread_count: (memberDoc.unread_count || 0) + 1 }
          ).catch(() => null);
        }
      }
    }).catch(() => null);

    return {
      $id: msgDoc.$id,
      conversation_id: conversationId,
      sender_id: senderId,
      message: cleanText,
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
    ).catch(() => ({ documents: [] }));

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
        ).catch(() => null);
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
