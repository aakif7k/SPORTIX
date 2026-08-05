/**
 * The athlete's notification and privacy preferences.
 *
 * SettingsPage held every toggle in component state and its Save button ran a
 * one-second setTimeout and then said "Saved" — nothing was ever persisted, so
 * every switch reverted on navigation. The endpoints have existed since phase 3:
 * profiles carries notification_prefs and privacy as JSON blobs, and
 * /api/settings reads and writes them.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { api, ApiError } from '@/lib/api';

export const settingsKeys = { all: ['settings'] as const };

export interface NotificationPrefs {
  match_reminders: boolean;
  autosquad_invites: boolean;
  [key: string]: boolean;
}

export interface PrivacyPrefs {
  private_profile: boolean;
  [key: string]: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  match_reminders: true,
  autosquad_invites: true,
};

const DEFAULT_PRIVACY: PrivacyPrefs = { private_profile: false };

/**
 * The blobs are stored as JSON strings in a `string(2000)` column, so a value can
 * arrive as either a parsed object or a string depending on how it was written.
 */
function parseBlob<T>(value: unknown, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === 'object') return { ...fallback, ...(value as T) };
  if (typeof value !== 'string') return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? { ...fallback, ...parsed } : fallback;
  } catch {
    return fallback;
  }
}

export function useSettings() {
  const queryClient = useQueryClient();

  const query = useQuery<{ notifications: NotificationPrefs; privacy: PrivacyPrefs }, ApiError>({
    queryKey: settingsKeys.all,
    queryFn: async () => {
      const res = await api.get<{
        data: { notification_prefs?: unknown; privacy?: unknown };
      }>('/api/settings/');
      return {
        notifications: parseBlob(res.data?.notification_prefs, DEFAULT_NOTIFICATIONS),
        privacy: parseBlob(res.data?.privacy, DEFAULT_PRIVACY),
      };
    },
  });

  const saveNotifications = useMutation({
    mutationFn: (prefs: NotificationPrefs) => api.put('/api/settings/notifications', prefs),
    onError: (e: ApiError) => toast.error(e.message || 'Could not save notifications'),
  });

  const savePrivacy = useMutation({
    mutationFn: (prefs: PrivacyPrefs) => api.put('/api/settings/privacy', prefs),
    onError: (e: ApiError) => toast.error(e.message || 'Could not save privacy'),
  });

  /** Both blobs in one action, which is what the page's Save button means. */
  const saveAll = async (notifications: NotificationPrefs, privacy: PrivacyPrefs) => {
    await Promise.all([
      saveNotifications.mutateAsync(notifications),
      savePrivacy.mutateAsync(privacy),
    ]);
    await queryClient.invalidateQueries({ queryKey: settingsKeys.all });
  };

  return {
    notifications: query.data?.notifications ?? DEFAULT_NOTIFICATIONS,
    privacy: query.data?.privacy ?? DEFAULT_PRIVACY,
    loading: query.isPending,
    error: (query.error as ApiError | null) ?? null,
    refresh: query.refetch,
    saveAll,
    saving: saveNotifications.isPending || savePrivacy.isPending,
  };
}
