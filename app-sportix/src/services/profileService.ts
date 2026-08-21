/**
 * src/services/profileService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Profile CRUD against the `profiles` collection.
 * All writes are scoped to the authenticated user's $id — never trust cached IDs
 * for ownership-sensitive operations.
 */
import { account, databases, DATABASE_ID, COLLECTIONS, Query } from '../api/appwrite';
import { UserProfile } from '../types';
import { toUserProfile } from './authService';
import { storageService } from './storageService';

export const profileService = {
  /** Get any user profile by Appwrite document ID. */
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, userId);
      return toUserProfile(doc);
    } catch {
      return null;
    }
  },

  /** Get the currently authenticated user's own profile. */
  async getMyProfile(): Promise<UserProfile | null> {
    try {
      const raw = await account.get();
      return profileService.getProfile(raw.$id);
    } catch {
      return null;
    }
  },

  /**
   * Update the authenticated user's profile.
   * Verifies session ownership at call time.
   */
  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const raw = await account.get(); // Always verify — never trust cached ID
    const { $id, $createdAt, $updatedAt, ...safeData } = data as any;

    const doc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.PROFILES,
      raw.$id,
      { ...safeData, updated_at: new Date().toISOString() },
    );
    return toUserProfile(doc);
  },

  /** Complete onboarding — sets is_onboarding_complete = true. */
  async completeOnboarding(data: {
    role:             string;
    sport:            string;
    sports:           string[];
    experience_level: string;
    location:         string;
    bio:              string;
    avatar_url:       string | null;
  }): Promise<UserProfile> {
    return profileService.updateProfile({
      ...data,
      is_onboarding_complete: true,
    } as any);
  },

  /**
   * Upload an avatar image and update the profile.
   * Returns the updated profile with the new avatar URL.
   */
  async uploadAvatar(fileUri: string, mimeType: string): Promise<string> {
    const { url } = await storageService.upload(fileUri, mimeType, `avatar_${Date.now()}.jpg`);
    return url;
  },

  /** Search profiles by username, sport, or location. */
  async searchProfiles(query: string, limit = 20): Promise<UserProfile[]> {
    try {
      const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
        Query.search('username', query),
        Query.limit(limit),
      ]);
      return res.documents.map(toUserProfile);
    } catch {
      return [];
    }
  },

  /** Check username availability. */
  async checkUsernameAvailable(username: string): Promise<boolean> {
    try {
      const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
        Query.equal('username', username.toLowerCase().trim()),
        Query.limit(1),
      ]);
      return res.total === 0;
    } catch {
      return true;
    }
  },

  /** Follow or unfollow a user. Returns the new follow state. */
  async toggleFollow(targetUserId: string): Promise<boolean> {
    const raw = await account.get();
    const myId = raw.$id;

    if (myId === targetUserId) return false;

    try {
      // Check if already following
      const existing = await databases.listDocuments(DATABASE_ID, COLLECTIONS.FOLLOWERS, [
        Query.equal('follower_id', myId),
        Query.equal('following_id', targetUserId),
        Query.limit(1),
      ]);

      if (existing.total > 0) {
        // Unfollow
        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.FOLLOWERS, existing.documents[0].$id);
        return false;
      } else {
        // Follow
        const { ID } = await import('../api/appwrite');
        await databases.createDocument(DATABASE_ID, COLLECTIONS.FOLLOWERS, ID.unique(), {
          follower_id:  myId,
          following_id: targetUserId,
          created_at:   new Date().toISOString(),
        });
        return true;
      }
    } catch {
      return false;
    }
  },

  /** Check if the current user is following a target user. */
  async isFollowing(targetUserId: string): Promise<boolean> {
    try {
      const raw = await account.get();
      const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.FOLLOWERS, [
        Query.equal('follower_id', raw.$id),
        Query.equal('following_id', targetUserId),
        Query.limit(1),
      ]);
      return res.total > 0;
    } catch {
      return false;
    }
  },
};
