import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { useAuth } from '@/context/AuthContext';
import { api, ApiError } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

interface ProfileStats {
  posts: number;
  reels: number;
  followers: number;
  following: number;
}

const EMPTY_STATS: ProfileStats = { posts: 0, reels: 0, followers: 0, following: 0 };

/**
 * The signed-in user's profile and stats.
 *
 * Profile and stats are separate queries because they change at different rates
 * and are invalidated by different things: posting moves the stats but not the
 * profile, editing a bio moves the profile but not the stats. Fetching them as
 * one blob meant every post refetched the whole profile.
 */
export function useMyProfile() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const enabled = Boolean(user?.id);

  const profileQuery = useQuery<any, ApiError>({
    queryKey: qk.profile.me(),
    enabled,
    queryFn: async () => (await api.get<{ data: any }>('/api/users/me')).data,
  });

  const statsQuery = useQuery<ProfileStats, ApiError>({
    queryKey: qk.profile.stats(),
    enabled,
    queryFn: async () => {
      const res = await api.get<{ data: Partial<ProfileStats> }>('/api/users/me/stats');
      return { ...EMPTY_STATS, ...(res.data ?? {}) };
    },
  });

  const avatar = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const res = await api.upload<{ data: { url: string } }>('/api/upload/avatar', form);
      return res.data.url;
    },
    onSuccess: async () => {
      toast.success('Profile photo updated!');
      // The server attached the URL to the profile, so refetch rather than
      // patching the cache and hoping the two agree.
      await queryClient.invalidateQueries({ queryKey: qk.profile.all });
      await refreshUser();
    },
    onError: (err: ApiError) => toast.error(err.message || 'Upload failed'),
  });

  const update = useMutation({
    mutationFn: async (updates: Record<string, unknown>) =>
      (await api.put<{ data: any }>('/api/users/me', updates)).data,
    onSuccess: async () => {
      toast.success('Profile updated!');
      await queryClient.invalidateQueries({ queryKey: qk.profile.all });
      await refreshUser();
    },
    onError: (err: ApiError) => toast.error(err.message || 'Update failed'),
  });

  return {
    profile: profileQuery.data ?? null,
    stats: statsQuery.data ?? EMPTY_STATS,
    loading: enabled && (profileQuery.isPending || statsQuery.isPending),
    error: (profileQuery.error as ApiError | null) ?? null,
    uploadingAvatar: avatar.isPending,
    updateAvatar: avatar.mutateAsync,
    updateProfile: update.mutateAsync,
    refresh: () => queryClient.invalidateQueries({ queryKey: qk.profile.all }),
  };
}
