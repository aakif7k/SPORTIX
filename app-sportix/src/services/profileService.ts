import { databases, Query, DATABASE_ID, COLLECTIONS } from '../api/appwrite';
import { UserProfile } from '../types';
import { getMediaFileUrl } from './storageService';

function docToProfile(doc: any): UserProfile {
  const fileUrl = doc.profile_image_url || getMediaFileUrl(doc.profile_image_file_id) || doc.avatar_url || null;

  return {
    id: doc.$id,
    full_name: doc.full_name || '',
    username: doc.username || '',
    email: doc.email || '',
    avatar_url: fileUrl,
    profile_image_file_id: doc.profile_image_file_id || null,
    profile_image_url: fileUrl,
    sport: doc.sport || 'Multi-Sport',
    sports: doc.sports || [],
    role: doc.role || 'athlete',
    location: doc.location || '',
    experience_level: doc.experience_level || 'amateur',
    is_open_to_recruit: doc.is_open_to_recruit ?? true,
    pulse_score: doc.pulse_score || 100,
    level: doc.level || 1,
    bio: doc.bio || '',
    created_at: doc.$createdAt,
  };
}

export async function getProfile(uid: string): Promise<UserProfile | null> {
  if (!uid) return null;

  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, uid);
    return docToProfile(doc);
  } catch {
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PROFILES,
        [Query.equal('username', uid.toLowerCase().trim()), Query.limit(1)]
      );
      if (res.documents.length > 0) {
        return docToProfile(res.documents[0]);
      }
    } catch { /* ignore */ }

    return null;
  }
}

export async function searchProfiles(
  searchTerm: string = '',
  filters?: {
    sport?: string;
    experienceLevel?: string;
    openToRecruit?: boolean;
    location?: string;
  }
): Promise<UserProfile[]> {
  try {
    const queries: string[] = [Query.limit(50)];

    if (filters?.openToRecruit) {
      queries.push(Query.equal('is_open_to_recruit', true));
    }

    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, queries);
    let profiles = res.documents.map(docToProfile);

    if (filters?.sport && filters.sport !== 'all') {
      const s = filters.sport.toLowerCase();
      profiles = profiles.filter(p =>
        p.sport.toLowerCase() === s || p.sports?.some(sp => sp.toLowerCase() === s)
      );
    }

    if (filters?.experienceLevel && filters.experienceLevel !== 'all') {
      const l = filters.experienceLevel.toLowerCase();
      profiles = profiles.filter(p => p.experience_level?.toLowerCase() === l);
    }

    if (filters?.location?.trim()) {
      const loc = filters.location.toLowerCase().trim();
      profiles = profiles.filter(p => p.location?.toLowerCase().includes(loc));
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      profiles = profiles.filter(p =>
        p.full_name.toLowerCase().includes(term) ||
        p.username.toLowerCase().includes(term) ||
        p.sport.toLowerCase().includes(term) ||
        (p.location && p.location.toLowerCase().includes(term)) ||
        (p.experience_level && p.experience_level.toLowerCase().includes(term)) ||
        (p.bio && p.bio.toLowerCase().includes(term))
      );
    }

    return profiles;
  } catch (err: any) {
    console.error('[profileService] searchProfiles error:', err?.message ?? err);
    return [];
  }
}
