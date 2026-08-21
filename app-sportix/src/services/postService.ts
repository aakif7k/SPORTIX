/**
 * src/services/postService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * HypeZone Feed — posts, likes, comments. Zero mock data.
 */
import { account, databases, DATABASE_ID, COLLECTIONS, ID, Query } from '../api/appwrite';
import { Post, Comment } from '../types';
import { storageService } from './storageService';

function toPost(doc: any): Post {
  return {
    $id:               doc.$id,
    author_id:         doc.author_id,
    author_full_name:  doc.author_full_name  ?? '',
    author_username:   doc.author_username   ?? '',
    author_avatar_url: doc.author_avatar_url ?? null,
    author_sport:      doc.author_sport      ?? '',
    content:           doc.content           ?? '',
    media_urls:        doc.media_urls        ?? [],
    media_type:        doc.media_type        ?? null,
    post_type:         doc.post_type         ?? 'general',
    sport_tag:         doc.sport_tag         ?? '',
    location_tag:      doc.location_tag      ?? '',
    likes_count:       doc.likes_count       ?? 0,
    comments_count:    doc.comments_count    ?? 0,
    $createdAt:        doc.$createdAt,
  };
}

function toComment(doc: any): Comment {
  return {
    $id:               doc.$id,
    post_id:           doc.post_id,
    author_id:         doc.author_id,
    author_name:       doc.author_name       ?? '',
    author_avatar_url: doc.author_avatar_url ?? null,
    content:           doc.content           ?? '',
    created_at:        doc.created_at        ?? doc.$createdAt,
    $createdAt:        doc.$createdAt,
  };
}

export const postService = {
  /** Get paginated feed posts. */
  async getFeed(offset = 0, limit = 15): Promise<Post[]> {
    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.POSTS, [
      Query.orderDesc('$createdAt'),
      Query.limit(limit),
      Query.offset(offset),
    ]);
    return res.documents.map(toPost);
  },

  /** Get a single post. */
  async getPost(postId: string): Promise<Post | null> {
    try {
      const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.POSTS, postId);
      return toPost(doc);
    } catch {
      return null;
    }
  },

  /** Create a new post (text only or with media). */
  async createPost(data: {
    content:      string;
    sport_tag?:   string;
    location_tag?:string;
    mediaUri?:    string;
    mimeType?:    string;
  }): Promise<Post> {
    const raw = await account.get();
    const { profileService } = await import('./profileService');
    const profile = await profileService.getProfile(raw.$id);

    let media_urls: string[] = [];
    let media_type: 'image' | 'video' | null = null;

    if (data.mediaUri && data.mimeType) {
      const { url } = await storageService.upload(data.mediaUri, data.mimeType);
      media_urls = [url];
      media_type = data.mimeType.startsWith('video/') ? 'video' : 'image';
    }

    const doc = await databases.createDocument(DATABASE_ID, COLLECTIONS.POSTS, ID.unique(), {
      author_id:         raw.$id,
      author_full_name:  profile?.full_name  ?? raw.name,
      author_username:   profile?.username   ?? raw.email.split('@')[0],
      author_avatar_url: profile?.avatar_url ?? null,
      author_sport:      profile?.sport      ?? '',
      content:           data.content.trim(),
      media_urls,
      media_type,
      post_type:         'general',
      sport_tag:         data.sport_tag    ?? '',
      location_tag:      data.location_tag ?? '',
      likes_count:       0,
      comments_count:    0,
    });
    return toPost(doc);
  },

  /** Toggle like on a post. Returns new liked state. */
  async toggleLike(postId: string): Promise<boolean> {
    const raw = await account.get();
    const myId = raw.$id;

    const existing = await databases.listDocuments(DATABASE_ID, COLLECTIONS.POST_LIKES, [
      Query.equal('post_id', postId),
      Query.equal('user_id', myId),
      Query.limit(1),
    ]);

    const post = await databases.getDocument(DATABASE_ID, COLLECTIONS.POSTS, postId);

    if (existing.total > 0) {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.POST_LIKES, existing.documents[0].$id);
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.POSTS, postId, {
        likes_count: Math.max(0, (post as any).likes_count - 1),
      });
      return false;
    } else {
      await databases.createDocument(DATABASE_ID, COLLECTIONS.POST_LIKES, ID.unique(), {
        post_id:    postId,
        user_id:    myId,
        created_at: new Date().toISOString(),
      });
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.POSTS, postId, {
        likes_count: ((post as any).likes_count ?? 0) + 1,
      });
      return true;
    }
  },

  /** Check if the current user has liked a post. */
  async isLiked(postId: string): Promise<boolean> {
    try {
      const raw = await account.get();
      const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.POST_LIKES, [
        Query.equal('post_id', postId),
        Query.equal('user_id', raw.$id),
        Query.limit(1),
      ]);
      return res.total > 0;
    } catch {
      return false;
    }
  },

  /** Batch-check liked posts from a list of IDs. */
  async getLikedPostIds(postIds: string[]): Promise<Set<string>> {
    try {
      const raw = await account.get();
      const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.POST_LIKES, [
        Query.equal('user_id', raw.$id),
        Query.equal('post_id', postIds),
        Query.limit(postIds.length),
      ]);
      return new Set(res.documents.map((d: any) => d.post_id));
    } catch {
      return new Set();
    }
  },

  /** Get comments for a post. */
  async getComments(postId: string): Promise<Comment[]> {
    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.COMMENTS, [
      Query.equal('post_id', postId),
      Query.orderAsc('$createdAt'),
    ]);
    return res.documents.map(toComment);
  },

  /** Add a comment to a post. */
  async addComment(postId: string, content: string): Promise<Comment> {
    const raw = await account.get();
    const { profileService } = await import('./profileService');
    const profile = await profileService.getProfile(raw.$id);

    const doc = await databases.createDocument(DATABASE_ID, COLLECTIONS.COMMENTS, ID.unique(), {
      post_id:           postId,
      author_id:         raw.$id,
      author_name:       profile?.full_name  ?? raw.name,
      author_avatar_url: profile?.avatar_url ?? null,
      content:           content.trim(),
      created_at:        new Date().toISOString(),
    });

    // Increment comment count
    const post = await databases.getDocument(DATABASE_ID, COLLECTIONS.POSTS, postId);
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.POSTS, postId, {
      comments_count: ((post as any).comments_count ?? 0) + 1,
    });

    return toComment(doc);
  },
};
