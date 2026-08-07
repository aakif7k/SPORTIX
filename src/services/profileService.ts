/**
 * profileService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Full CRUD service for the Appwrite `profiles` collection.
 *
 * Architecture note:
 *   UI  →  profileService  →  Appwrite SDK  →  profiles collection
 *
 * This service is the ONLY place in the app that calls Appwrite databases.*
 * for the profiles collection. Never put these calls directly in components.
 *
 * To migrate other collections later (events, teams, posts…), create a
 * sibling file following the same pattern:
 *   src/services/eventService.ts
 *   src/services/teamService.ts
 *   …etc.
 */

import { databases, storage, Query, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import type { UserProfile } from '@/lib/authService';
import { uploadProfilePicture, getMediaFileUrl, MEDIA_BUCKET_ID } from './storageService';

// ─── Internal Appwrite document shape ────────────────────────────────────────
type AppwriteDocument = Record<string, any> & {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
};

// ─── Re-export UserProfile so callers only need one import ───────────────────
export type { UserProfile };

// ─── Fields we are allowed to write to Appwrite ──────────────────────────────
// (Appwrite rejects $id, $createdAt, $updatedAt, $databaseId, $collectionId)
type ProfileWriteData = Omit<
  Partial<UserProfile>,
  'id' | 'created_at'
>;

// ─── Slim shape used by Discover / Event pages ───────────────────────────────
export interface ProfileSummary {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  profile_image_file_id?: string | null;
  profile_image_url?: string | null;
  sport: string;
  sports: string[];
  role: string;
  location: string;
  experience_level: string;
  is_open_to_recruit: boolean;
  pulse_score: number;
  level: number;
  bio?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAPPER  —  Appwrite document  →  UserProfile
// ─────────────────────────────────────────────────────────────────────────────
function docToProfile(doc: AppwriteDocument): UserProfile {
  let fileUrl = doc.profile_image_url || doc.avatar_url || null;
  if (doc.profile_image_file_id) {
    try {
      fileUrl = storage.getFileView(MEDIA_BUCKET_ID, doc.profile_image_file_id).toString();
    } catch { /* use fallback */ }
  }

  return {
    id:                     doc.$id,
    full_name:              doc.full_name              ?? '',
    username:               doc.username               ?? '',
    email:                  doc.email                  ?? '',
    role:                   doc.role                   ?? 'athlete',
    sport:                  doc.sport                  ?? '',
    sports:                 doc.sports                 ?? [],
    experience_level:       doc.experience_level       ?? 'amateur',
    location:               doc.location               ?? '',
    avatar_url:             fileUrl,
    profile_image_file_id:  doc.profile_image_file_id  ?? null,
    profile_image_url:      fileUrl,
    bio:                    doc.bio                    ?? '',
    is_open_to_recruit:     doc.is_open_to_recruit     ?? false,
    is_active:              doc.is_active              ?? true,
    is_onboarding_complete: doc.is_onboarding_complete ?? false,
    pulse_score:            doc.pulse_score            ?? 100,
    level:                  doc.level                  ?? 1,
    coins_balance:          doc.coins_balance          ?? 0,
    login_streak:           doc.login_streak           ?? 0,
    created_at:             doc.created_at             ?? doc.$createdAt,
    updated_at:             doc.updated_at             ?? doc.$updatedAt,
  };
}

function docToSummary(doc: AppwriteDocument): ProfileSummary {
  let fileUrl = doc.profile_image_url || doc.avatar_url || null;
  if (doc.profile_image_file_id) {
    try {
      fileUrl = storage.getFileView(MEDIA_BUCKET_ID, doc.profile_image_file_id).toString();
    } catch { /* use fallback */ }
  }

  return {
    id:                 doc.$id,
    full_name:          doc.full_name          ?? '',
    username:           doc.username           ?? '',
    avatar_url:         fileUrl,
    sport:              doc.sport              ?? '',
    sports:             doc.sports             ?? [],
    role:               doc.role               ?? 'athlete',
    location:           doc.location           ?? '',
    experience_level:   doc.experience_level   ?? 'amateur',
    is_open_to_recruit: doc.is_open_to_recruit ?? false,
    pulse_score:        doc.pulse_score        ?? 100,
    level:              doc.level              ?? 1,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  READ
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a single profile by its document ID (= Appwrite auth user $id).
 * Returns null if not found or on any Appwrite error.
 */
export async function getProfile(uid: string): Promise<UserProfile | null> {
  if (!uid) return null;

  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, uid);
    return docToProfile(doc as AppwriteDocument);
  } catch {
    try {
      const byUsername = await getProfileByUsername(uid);
      if (byUsername) return byUsername;
    } catch { /* ignore */ }

    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PROFILES,
        [Query.equal('username', uid.toLowerCase().trim()), Query.limit(1)]
      );
      if (res.documents.length > 0) {
        return docToProfile(res.documents[0] as AppwriteDocument);
      }
    } catch { /* ignore */ }

    return null;
  }
}

/** Alias — semantically clearer when fetching your own profile */
export const getMyProfile = getProfile;

/**
 * Fetch a profile by username (unique field lookup).
 * Returns null if username doesn't exist.
 */
export async function getProfileByUsername(username: string): Promise<UserProfile | null> {
  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PROFILES,
      [Query.equal('username', username.toLowerCase().trim()), Query.limit(1)],
    );
    if (res.documents.length === 0) return null;
    return docToProfile(res.documents[0] as AppwriteDocument);
  } catch (err: any) {
    console.error('[profileService] getProfileByUsername error:', err?.message ?? err);
    return null;
  }
}

/**
 * List profiles with optional Appwrite Query filters.
 * Returns up to `limit` profiles (default 50).
 */
export async function listProfiles(
  queries: string[] = [],
  limit = 50,
): Promise<ProfileSummary[]> {
  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PROFILES,
      [...queries, Query.limit(limit), Query.orderDesc('pulse_score')],
    );
    return res.documents.map(d => docToSummary(d as AppwriteDocument));
  } catch (err: any) {
    console.error('[profileService] listProfiles error:', err?.message ?? err);
    return [];
  }
}

/**
 * Search profiles by name, username, or sport.
 * Appwrite free-tier doesn't support full-text search — we fetch a page and
 * filter client-side. For production scale, enable Appwrite Search on the
 * collection, then switch to Query.search().
 */
export async function searchProfiles(
  query: string,
  filters?: { sport?: string; experienceLevel?: string; openToRecruit?: boolean; location?: string },
  limit = 100,
): Promise<ProfileSummary[]> {
  let documents: any[] = [];

  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PROFILES,
      [Query.limit(limit), Query.orderDesc('pulse_score')]
    );
    documents = res.documents;
  } catch {
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PROFILES,
        [Query.limit(limit)]
      );
      documents = res.documents;
    } catch (err: any) {
      console.error('[profileService] searchProfiles error:', err?.message ?? err);
      return [];
    }
  }

  let docs = documents.map(d => docToSummary(d as AppwriteDocument));

  // ── 1. Apply Filters ───────────────────────────────────────────────────────
  if (filters?.sport && filters.sport !== 'all') {
    const s = filters.sport.toLowerCase();
    docs = docs.filter(
      p => p.sport.toLowerCase() === s || (p.sports && p.sports.some(sp => sp.toLowerCase() === s))
    );
  }

  if (filters?.experienceLevel && filters.experienceLevel !== 'all') {
    const el = filters.experienceLevel.toLowerCase().replace(/[-_]/g, '');
    docs = docs.filter(
      p => p.experience_level.toLowerCase().replace(/[-_]/g, '') === el
    );
  }

  if (filters?.openToRecruit !== undefined) {
    docs = docs.filter(p => p.is_open_to_recruit === filters.openToRecruit);
  }

  if (filters?.location?.trim()) {
    const loc = filters.location.toLowerCase().trim();
    docs = docs.filter(p => p.location.toLowerCase().includes(loc));
  }

  // ── 2. Apply Search Query (Case insensitive, partial matching) ─────────────
  if (query.trim()) {
    const q = query.toLowerCase().trim();
    docs = docs.filter(p => {
      const nameMatch     = p.full_name.toLowerCase().includes(q);
      const usernameMatch = p.username.toLowerCase().includes(q);
      const sportMatch    = p.sport.toLowerCase().includes(q) || (p.sports && p.sports.some(s => s.toLowerCase().includes(q)));
      const locationMatch = p.location.toLowerCase().includes(q);
      const levelMatch    = p.experience_level.toLowerCase().includes(q);
      const bioMatch      = (p.bio || '').toLowerCase().includes(q);

      return nameMatch || usernameMatch || sportMatch || locationMatch || levelMatch || bioMatch;
    });
  }

  return docs;
}

/**
 * Batch-fetch multiple profiles by their IDs.
 * Used by Event pages to resolve participant IDs → profile summaries.
 * Returns a Map<uid, ProfileSummary> for O(1) lookup.
 */
export async function batchGetProfiles(uids: string[]): Promise<Map<string, ProfileSummary>> {
  const result = new Map<string, ProfileSummary>();
  if (uids.length === 0) return result;

  try {
    // Appwrite supports up to 100 items in a Query.equal array
    const chunks: string[][] = [];
    for (let i = 0; i < uids.length; i += 100) {
      chunks.push(uids.slice(i, i + 100));
    }

    for (const chunk of chunks) {
      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PROFILES,
        [Query.equal('$id', chunk), Query.limit(chunk.length)],
      );
      res.documents.forEach(doc => {
        result.set(doc.$id, docToSummary(doc as AppwriteDocument));
      });
    }
  } catch (err: any) {
    console.error('[profileService] batchGetProfiles error:', err?.message ?? err);
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
//  CREATE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new profile document.
 * Note: Registration flow (authService.registerUser) already creates the
 * profile document. This method is available for edge cases (e.g. admin tools).
 */
export async function createProfile(
  uid: string,
  data: ProfileWriteData,
): Promise<UserProfile | null> {
  try {
    const now = new Date().toISOString();
    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.PROFILES,
      uid,
      { ...data, created_at: now, updated_at: now },
    );
    return docToProfile(doc as AppwriteDocument);
  } catch (err: any) {
    console.error('[profileService] createProfile error:', err?.message ?? err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  UPDATE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Update an existing profile document.
 * Always stamps updated_at automatically.
 * Returns the fresh UserProfile on success, null on failure.
 */
export async function updateProfile(
  uid: string,
  updates: ProfileWriteData,
): Promise<UserProfile | null> {
  try {
    const doc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.PROFILES,
      uid,
      { ...updates, updated_at: new Date().toISOString() },
    );
    return docToProfile(doc as AppwriteDocument);
  } catch (err: any) {
    console.error('[profileService] updateProfile error:', err?.message ?? err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hard-delete a profile document.
 * The calling component should also delete the Appwrite auth account if needed.
 */
export async function deleteProfile(uid: string): Promise<boolean> {
  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.PROFILES, uid);
    return true;
  } catch (err: any) {
    console.error('[profileService] deleteProfile error:', err?.message ?? err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  AVATAR UPLOAD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Upload an avatar image to Appwrite Storage, then store the public URL
 * in the profile document.
 *
 * Returns the new avatar URL on success, null on failure.
 */
export async function uploadAvatar(uid: string, file: File): Promise<string | null> {
  const result = await uploadProfilePicture(uid, file);
  return result?.fileUrl ?? null;
}

export function profileToUserShape(profile: UserProfile): Record<string, any> {
  const avatarUrl = profile.profile_image_url || profile.avatar_url || (profile.profile_image_file_id ? getMediaFileUrl(profile.profile_image_file_id) : null);
  return {
    id:                  profile.id,
    uid:                 profile.id,
    name:                profile.full_name,
    username:            profile.username,
    email:               profile.email,
    avatar:              avatarUrl || `https://i.pravatar.cc/150?u=${profile.id}`,
    coverImage:          undefined,
    role:                profile.role,
    sport:               profile.sport,
    sports:              profile.sports ?? [],
    location:            profile.location,
    bio:                 profile.bio,
    experienceLevel:     profile.experience_level,
    openToRecruit:       profile.is_open_to_recruit,
    isOnboardingComplete: profile.is_onboarding_complete,
    isOnline:            true,
    isVerified:          false,
    level:               profile.level,
    createdAt:           profile.created_at,
    performanceData:     { speed: 80, strength: 75, endurance: 80, agility: 78, technique: 80, teamwork: 78 },
    stats: {
      matches: 0,
      events: 0,
      followers: 0,
      following: 0,
      wins: 0,
      losses: 0,
      rating: profile.pulse_score ?? 100,
      yearsExperience: 0,
    },
    achievements: [],
  };
}
