import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export function useMyProfile() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    posts: 0, reels: 0,
    followers: 0, following: 0
  });
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    Promise.all([
      api.get<any>('/api/users/me'),
      api.get<any>('/api/users/me/stats'),
    ]).then(([profileRes, statsRes]) => {
      setProfile(profileRes.data);
      setStats(statsRes.data || stats);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id]);

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
      setProfile((prev: any) => ({ ...prev, avatar_url: url }));
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
      setProfile(res.data);
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