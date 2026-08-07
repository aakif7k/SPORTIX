/**
 * useProfiles.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Debounced search hook for the Discover page.
 * Fetches real profile data from Appwrite via profileService and subscribes to Realtime.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { searchProfiles } from '@/services/profileService';
import type { ProfileSummary } from '@/services/profileService';
import { client, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';

export interface ProfileFilters {
  sport?: string;
  experienceLevel?: string;
  openToRecruit?: boolean;
  location?: string;
}

export interface UseProfilesResult {
  profiles: ProfileSummary[];
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  refetch: () => Promise<void>;
}

const DEBOUNCE_MS = 350;

export function useProfiles(
  query: string = '',
  filters?: ProfileFilters,
): UseProfilesResult {
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProfiles = useCallback(async () => {
    try {
      const results = await searchProfiles(query, filters);
      setProfiles(results);
      setError(null);
    } catch (err: any) {
      console.error('[useProfiles] fetch error:', err);
      setError(err?.message ?? 'Failed to load profiles');
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [query, filters?.sport, filters?.experienceLevel, filters?.openToRecruit, filters?.location]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    setLoading(true);

    debounceRef.current = setTimeout(() => {
      fetchProfiles();
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchProfiles]);

  // Real-time subscription to Appwrite profiles collection
  useEffect(() => {
    const channel = `databases.${DATABASE_ID}.collections.${COLLECTIONS.PROFILES}.documents`;
    const unsubscribe = client.subscribe(channel, () => {
      fetchProfiles();
    });

    return () => {
      unsubscribe();
    };
  }, [fetchProfiles]);

  return {
    profiles,
    loading,
    error,
    isEmpty: !loading && profiles.length === 0,
    refetch: fetchProfiles,
  };
}
