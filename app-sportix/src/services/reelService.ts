/**
 * src/services/reelService.ts
 */
import { account, databases, DATABASE_ID, COLLECTIONS, ID, Query } from '../api/appwrite';
import { Reel } from '../types';
import { storageService } from './storageService';

function toReel(doc: any): Reel {
  return {
    $id:               doc.$id,
    author_id:         doc.author_id,
    author_name:       doc.author_name       ?? '',
    author_username:   doc.author_username   ?? '',
    author_avatar_url: doc.author_avatar_url ?? null,
    author_sport:      doc.author_sport      ?? '',
    video_url:         doc.video_url         ?? '',
    thumbnail_url:     doc.thumbnail_url     ?? null,
    caption:           doc.caption           ?? '',
    sport_tag:         doc.sport_tag         ?? '',
    likes_count:       doc.likes_count       ?? 0,
    comments_count:    doc.comments_count    ?? 0,
    views_count:       doc.views_count       ?? 0,
    $createdAt:        doc.$createdAt,
  };
}

export const reelService = {
  async getReels(offset = 0, limit = 10): Promise<Reel[]> {
    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.REELS, [
      Query.orderDesc('$createdAt'),
      Query.limit(limit),
      Query.offset(offset),
    ]);
    return res.documents.map(toReel);
  },

  async toggleLike(reelId: string): Promise<boolean> {
    const raw = await account.get();
    const existing = await databases.listDocuments(DATABASE_ID, COLLECTIONS.REEL_LIKES, [
      Query.equal('reel_id', reelId),
      Query.equal('user_id', raw.$id),
      Query.limit(1),
    ]);

    const reel = await databases.getDocument(DATABASE_ID, COLLECTIONS.REELS, reelId);

    if (existing.total > 0) {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.REEL_LIKES, existing.documents[0].$id);
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.REELS, reelId, {
        likes_count: Math.max(0, ((reel as any).likes_count ?? 1) - 1),
      });
      return false;
    } else {
      await databases.createDocument(DATABASE_ID, COLLECTIONS.REEL_LIKES, ID.unique(), {
        reel_id:    reelId,
        user_id:    raw.$id,
        created_at: new Date().toISOString(),
      });
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.REELS, reelId, {
        likes_count: ((reel as any).likes_count ?? 0) + 1,
      });
      return true;
    }
  },

  async isLiked(reelId: string): Promise<boolean> {
    try {
      const raw = await account.get();
      const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.REEL_LIKES, [
        Query.equal('reel_id', reelId),
        Query.equal('user_id', raw.$id),
        Query.limit(1),
      ]);
      return res.total > 0;
    } catch {
      return false;
    }
  },

  async uploadReel(data: {
    videoUri:   string;
    caption:    string;
    sport_tag?: string;
  }): Promise<Reel> {
    const raw = await account.get();
    const { profileService } = await import('./profileService');
    const profile = await profileService.getProfile(raw.$id);

    const { url } = await storageService.upload(data.videoUri, 'video/mp4', `reel_${Date.now()}.mp4`);

    const doc = await databases.createDocument(DATABASE_ID, COLLECTIONS.REELS, ID.unique(), {
      author_id:         raw.$id,
      author_name:       profile?.full_name  ?? raw.name,
      author_username:   profile?.username   ?? '',
      author_avatar_url: profile?.avatar_url ?? null,
      author_sport:      profile?.sport      ?? '',
      video_url:         url,
      thumbnail_url:     null,
      caption:           data.caption,
      sport_tag:         data.sport_tag ?? '',
      likes_count:       0,
      comments_count:    0,
      views_count:       0,
    });
    return toReel(doc);
  },
};
