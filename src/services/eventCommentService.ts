/**
 * eventCommentService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Full CRUD service for Appwrite `event_comments` collection.
 * Uses fallback mock data if collections are empty or unavailable.
 */

import { databases, ID, Query, DATABASE_ID } from '@/lib/appwrite';

// Local type for EventDiscussion
export interface DiscussionMessage {
  id: string;
  sender: string;
  senderId: string;
  avatar: string;
  content: string;
  type: 'text' | 'poll' | 'announcement' | 'media';
  timestamp: string;
  reactions: { emoji: string; count: number; reacted: boolean }[];
  pinned?: boolean;
  pollData?: { question: string; options: { text: string; votes: number; voted: boolean }[] };
  isAdmin?: boolean;
}

// Mock Data Fallback
export const MOCK_EVENT_COMMENTS: Record<string, DiscussionMessage[]> = {
  'e-1': [
    {
      id: 'm1', sender: 'Event Admin', senderId: 'admin', avatar: '', type: 'announcement',
      content: 'Welcome to the official discussion group for this event! Rules: be respectful, no spam, and coordinate effectively.',
      timestamp: '2 hours ago', reactions: [], pinned: true, isAdmin: true
    },
    {
      id: 'm2', sender: 'Marcus Reid', senderId: 'u1', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80',
      type: 'text', content: 'Who else is joining as solo? Looking for a squad to team up with.',
      timestamp: '1h 45m ago', reactions: [{ emoji: '⚡', count: 4, reacted: false }, { emoji: '✅', count: 2, reacted: false }]
    }
  ]
};

// ─── MAPPER ──────────────────────────────────────────────────────────────────
function docToComment(doc: Record<string, any>): DiscussionMessage {
  return {
    id: doc.$id,
    sender: doc.sender_name || 'Unknown',
    senderId: doc.sender_id || '',
    avatar: doc.sender_avatar || '',
    content: doc.content || '',
    type: doc.type || 'text',
    timestamp: doc.$createdAt || new Date().toISOString(),
    reactions: doc.reactions ? JSON.parse(doc.reactions) : [],
    pinned: doc.pinned || false,
    pollData: doc.poll_data ? JSON.parse(doc.poll_data) : undefined,
    isAdmin: doc.is_admin || false
  } as DiscussionMessage;
}

function commentToDoc(eventId: string, msg: Partial<DiscussionMessage>): Record<string, any> {
  const doc: Record<string, any> = { event_id: eventId };
  if (msg.sender) doc.sender_name = msg.sender;
  if (msg.senderId) doc.sender_id = msg.senderId;
  if (msg.avatar !== undefined) doc.sender_avatar = msg.avatar;
  if (msg.content !== undefined) doc.content = msg.content;
  if (msg.type !== undefined) doc.type = msg.type;
  if (msg.reactions !== undefined) doc.reactions = JSON.stringify(msg.reactions);
  if (msg.pinned !== undefined) doc.pinned = msg.pinned;
  if (msg.pollData !== undefined) doc.poll_data = JSON.stringify(msg.pollData);
  if (msg.isAdmin !== undefined) doc.is_admin = msg.isAdmin;
  return doc;
}

// ─── READ ────────────────────────────────────────────────────────────────────
export async function getEventComments(eventId: string): Promise<DiscussionMessage[]> {
  try {
    const res = await databases.listDocuments(DATABASE_ID, 'event_comments', [
      Query.equal('event_id', eventId),
      Query.orderAsc('$createdAt'),
      Query.limit(100)
    ]);
    
    if (res.documents.length === 0) {
      return MOCK_EVENT_COMMENTS[eventId] || MOCK_EVENT_COMMENTS['e-1']; // Fallback
    }
    
    return res.documents.map(docToComment);
  } catch (err) {
    console.warn(`[eventCommentService] getEventComments failed for ${eventId}, using mock data:`, err);
    return MOCK_EVENT_COMMENTS[eventId] || MOCK_EVENT_COMMENTS['e-1'];
  }
}

// ─── CREATE ──────────────────────────────────────────────────────────────────
export async function createEventComment(eventId: string, message: Omit<DiscussionMessage, 'id' | 'timestamp'>): Promise<DiscussionMessage | null> {
  try {
    const doc = await databases.createDocument(
      DATABASE_ID,
      'event_comments',
      ID.unique(),
      commentToDoc(eventId, message)
    );
    return docToComment(doc);
  } catch (err) {
    console.error('[eventCommentService] createEventComment failed:', err);
    return null;
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────────────
export async function deleteEventComment(commentId: string): Promise<boolean> {
  try {
    if (commentId.startsWith('m')) return false; // Mock ID
    await databases.deleteDocument(DATABASE_ID, 'event_comments', commentId);
    return true;
  } catch (err) {
    console.error('[eventCommentService] deleteEventComment failed:', err);
    return false;
  }
}
