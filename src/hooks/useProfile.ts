import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface ProfileStats {
  posts: number;
  reels: number;
  followers: number;
  following: number;
}

// Module constant so the fallback keeps a stable identity across renders.
const EMPTY_STATS: ProfileStats = { posts: 0, reels: 0, followers: 0, following: 0 };

interface FetchedProfile {
  userId: string;
  profile: any;
  stats: ProfileStats;
}

export function useMyProfile() {
  const { user, refreshUser } = useAuth();

  // Held together with the user it was fetched for, so `profile`, `stats` and
  // `loading` are all derived. That keeps the effect free of synchronous
  // setState (react-hooks/set-state-in-effect) and means a user switch cannot
  // briefly show the previous account's profile.
  const [fetched, setFetched] = useState<FetchedProfile | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    Promise.all([
      api.get<any>('/api/users/me'),
      api.get<any>('/api/users/me/stats'),
    ]).then(([profileRes, statsRes]) => {
      if (!cancelled) {
        setFetched({
          userId,
          profile: profileRes.data,
          // Previously `statsRes.data || stats`, which closed over the current
          // stats without declaring them as a dependency and so could reuse a
          // stale value.
          stats: statsRes.data || EMPTY_STATS,
        });
      }
    }).catch(err => {
      console.error(err);
      if (!cancelled) setFetched({ userId, profile: null, stats: EMPTY_STATS });
    });

    return () => { cancelled = true; };
  }, [userId]);

  const isFresh = fetched !== null && fetched.userId === userId;
  const profile = isFresh ? fetched.profile : null;
  const stats = isFresh ? fetched.stats : EMPTY_STATS;
  const loading = Boolean(userId) && !isFresh;

  const patchProfile = (next: any) => {
    setFetched(prev => (prev ? { ...prev, profile: next(prev.profile) } : prev));
  };

  const updateAvatar = async (file: File) => {
    if (!user) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.upload<any>(
        '/api/upload/avatar', formData
      );
      const url = res.data?.url;
      patchProfile((prev: any) => ({ ...prev, avatar_url: url }));
      await refreshUser();
      toast.success('Profile photo updated!');
      return url;
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const updateProfile = async (updates: any) => {
    try {
      const res = await api.put<any>('/api/users/me', updates);
      patchProfile(() => res.data);
      await refreshUser();
      toast.success('Profile updated!');
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
    }
  };

  return {
    profile, stats, loading,
    uploadingAvatar, updateAvatar, updateProfile
  };
}
