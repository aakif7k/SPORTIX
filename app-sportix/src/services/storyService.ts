/**
 * src/services/storyService.ts
 */
import { account, databases, DATABASE_ID, COLLECTIONS, ID, Query } from '../api/appwrite';
import { Story } from '../types';
import { storageService } from './storageService';

function toStory(doc: any): Story {
  return {
    $id:             doc.$id,
    author_id:       doc.author_id,
    author_name:     doc.author_name     ?? '',
    author_username: doc.author_username ?? '',
    author_avatar:   doc.author_avatar   ?? null,
    media_url:       doc.media_url       ?? '',
    media_type:      doc.media_type      ?? 'image',
    caption:         doc.caption         ?? '',
    sport_tag:       doc.sport_tag       ?? '',
    view_count:      doc.view_count      ?? 0,
    expires_at:      doc.expires_at      ?? '',
    $createdAt:      doc.$createdAt,
  };
}

export const storyService = {
  /** Get active (non-expired) stories. */
  async getActiveStories(): Promise<Story[]> {
    const now = new Date().toISOString();
    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.STORIES, [
      Query.greaterThan('expires_at', now),
      Query.orderDesc('$createdAt'),
      Query.limit(50),
    ]);
    return res.documents.map(toStory);
  },

  /** Create a story (24h expiry). */
  async createStory(data: {
    mediaUri:   string;
    mimeType:   string;
    caption?:   string;
    sport_tag?: string;
  }): Promise<Story> {
    const raw = await account.get();
    const { profileService } = await import('./profileService');
    const profile = await profileService.getProfile(raw.$id);

    const { url } = await storageService.upload(data.mediaUri, data.mimeType);
    const media_type = data.mimeType.startsWith('video/') ? 'video' : 'image';

    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const doc = await databases.createDocument(DATABASE_ID, COLLECTIONS.STORIES, ID.unique(), {
      author_id:       raw.$id,
      author_name:     profile?.full_name  ?? raw.name,
      author_username: profile?.username   ?? '',
      author_avatar:   profile?.avatar_url ?? null,
      media_url:       url,
      media_type,
      caption:         data.caption   ?? '',
      sport_tag:       data.sport_tag ?? '',
      view_count:      0,
      expires_at,
    });
    return toStory(doc);
  },

  /** Mark a story as viewed. Idempotent. */
  async viewStory(storyId: string): Promise<void> {
    try {
      const raw = await account.get();
      const existing = await databases.listDocuments(DATABASE_ID, COLLECTIONS.STORY_VIEWS, [
        Query.equal('story_id', storyId),
        Query.equal('viewer_id', raw.$id),
        Query.limit(1),
      ]);
      if (existing.total === 0) {
        await databases.createDocument(DATABASE_ID, COLLECTIONS.STORY_VIEWS, ID.unique(), {
          story_id:  storyId,
          viewer_id: raw.$id,
          viewed_at: new Date().toISOString(),
        });
        // Increment view count
        const story = await databases.getDocument(DATABASE_ID, COLLECTIONS.STORIES, storyId);
        await databases.updateDocument(DATABASE_ID, COLLECTIONS.STORIES, storyId, {
          view_count: ((story as any).view_count ?? 0) + 1,
        });
      }
    } catch { /* non-critical */ }
  },
};
