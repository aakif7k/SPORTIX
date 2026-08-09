import { databases, ID, Query, DATABASE_ID, COLLECTIONS } from '../api/appwrite';
import { ConversationSummary, DbMessage } from '../types';
import { getProfile } from './profileService';

export async function getOrCreateConversation(
  currentUserId: string,
  targetUserId: string
): Promise<string | null> {
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) return null;

  try {
    const currentMembers = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.CONVERSATION_MEMBERS,
      [Query.equal('user_id', currentUserId), Query.limit(100)]
    );

    const targetMembers = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.CONVERSATION_MEMBERS,
      [Query.equal('user_id', targetUserId), Query.limit(100)]
    );

    const currentConvIds = new Set(currentMembers.documents.map(d => d.conversation_id));
    const sharedConv = targetMembers.documents.find(d => currentConvIds.has(d.conversation_id));

    if (sharedConv) {
      return sharedConv.conversation_id;
    }

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
        { created_at: now, updated_at: now }
      );
    }

    const convId = convDoc.$id;

    await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.CONVERSATION_MEMBERS,
      ID.unique(),
      { conversation_id: convId, user_id: currentUserId, joined_at: now, unread_count: 0 }
    );

    await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.CONVERSATION_MEMBERS,
      ID.unique(),
      { conversation_id: convId, user_id: targetUserId, joined_at: now, unread_count: 0 }
    );

    return convId;
  } catch (err: any) {
    console.error('[messageService] getOrCreateConversation error:', err?.message ?? err);
    return null;
  }
}

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
            partnerInfo = {
              id: partnerProfile.id,
              name: partnerProfile.full_name || 'Athlete',
              username: partnerProfile.username || 'athlete',
              avatar: partnerProfile.avatar_url || `https://i.pravatar.cc/150?u=${partnerProfile.id}`,
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
      } catch { /* ignore individual conv fetch failure */ }
    }

    return summaries.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (err: any) {
    console.error('[messageService] getUserConversations error:', err?.message ?? err);
    return [];
  }
}

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
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.CONVERSATIONS, conversationId, {
        last_message: messageText.trim(),
        last_message_time: now,
        updated_at: now,
      });
    } catch { /* fallback */ }

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
