import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  getMyProfile,
  updateProfile,
  uploadAvatar,
} from '@/services/profileService';
import type { UserProfile } from '@/services/profileService';
import toast from 'react-hot-toast';

// ─── Stats shape ─────────────────────────────────────────────────────────────
interface ProfileStats {
  posts: number;
  reels: number;
  followers: number;
  following: number;
}

// ─────────────────────────────────────────────────────────────────────────────
//  useMyProfile
//  Fetch the currently authenticated user's full profile from Appwrite.
//  Provides helpers for updating profile fields and uploading an avatar.
// ─────────────────────────────────────────────────────────────────────────────
export function useMyProfile() {
  const { user, profile: contextProfile, refreshUser } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(contextProfile);
  const [stats, setStats] = useState<ProfileStats>({
    posts: 0, reels: 0,
    followers: 0, following: 0,
  });
  const [loading, setLoading] = useState(!contextProfile);
  const [error, setError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ── Load / refresh profile ────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getMyProfile(user.id);
      if (data) {
        setProfile(data);
        // Derive basic stats from profile fields where available
        setStats(prev => ({
          ...prev,
          // Future migration: replace with real counts from followers/posts collections
          followers: 0,
          following: 0,
        }));
      } else {
        setError('Profile not found in database.');
      }
    } catch (err: any) {
      console.error('[useMyProfile] load error:', err);
      setError(err?.message ?? 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    // Use context profile as initial value while fetching the fresh copy
    if (contextProfile) setProfile(contextProfile);
    loadProfile();
  }, [user?.id]);

  // ── Avatar upload ─────────────────────────────────────────────────────────
  const handleUpdateAvatar = async (file: File): Promise<string | undefined> => {
    if (!user?.id) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadAvatar(user.id, file);
      if (url) {
        setProfile(prev => prev ? { ...prev, avatar_url: url } : prev);
        await refreshUser();
        toast.success('Profile photo updated!');
        return url;
      } else {
        toast.error('Avatar upload failed. Please try again.');
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ── Profile update ────────────────────────────────────────────────────────
  const handleUpdateProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user?.id) return;
    try {
      const updated = await updateProfile(user.id, updates);
      if (updated) {
        setProfile(updated);
        await refreshUser();
        toast.success('Profile updated!');
      } else {
        toast.error('Update failed. Please try again.');
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Update failed');
    }
  };

  return {
    profile,
    stats,
    loading,
    error,
    uploadingAvatar,
    updateAvatar: handleUpdateAvatar,
    updateProfile: handleUpdateProfile,
    reload: loadProfile,
  };
}