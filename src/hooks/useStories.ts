/**
 * useStories.ts — Appwrite-backed stories hook
 * Replaces the old in-memory DEMO_STORIES implementation.
 * Stories are grouped by author, marked seen/unseen per current user.
 * Stories auto-expire after 24 hours (enforced by DB expires_at).
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAuthStore } from '@/store/authStore';
import {
  getActiveStories,
  createStory,
  markStoryViewed,
  type DbStoryGroup,
} from '@/services/socialService';

export function useStories() {
  const { user: currentUser } = useAuth();
  const userId = currentUser?.id;
  const [storyGroups, setStoryGroups] = useState<DbStoryGroup[]>([]);
  const [uploading, setUploading] = useState(false);
  // Which user the groups in state belong to. `loading` derives from this
  // instead of being a flag the effect has to set synchronously
  // (react-hooks/set-state-in-effect).
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const groups = await getActiveStories(userId);
      setStoryGroups(groups);
    } catch {
      setStoryGroups([]);
    } finally {
      setLoadedFor(userId);
    }
  }, [userId]);

  // Fetched inline so the state writes happen in a promise continuation rather
  // than during the effect body. load() remains for event-driven refreshes.
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    getActiveStories(userId)
      .then(groups => {
        if (cancelled) return;
        setStoryGroups(groups);
        setLoadedFor(userId);
      })
      .catch(() => {
        if (cancelled) return;
        setStoryGroups([]);
        setLoadedFor(userId);
      });

    return () => { cancelled = true; };
  }, [userId]);

  const loading = Boolean(userId) && loadedFor !== userId;

  const uploadStory = useCallback(async (
    file: File,
    caption?: string,
    sportTag?: string
  ) => {
    if (!currentUser) return;
    const storeUser = useAuthStore.getState().user;
    setUploading(true);
    try {
      await createStory(
        currentUser.id,
        storeUser?.name     ?? currentUser.name,
        storeUser?.username ?? '',
        storeUser?.avatar   ?? null,
        file,
        caption,
        sportTag,
      );
      await load();
    } finally {
      setUploading(false);
    }
  }, [currentUser, load]);

  const viewStory = useCallback(async (storyId: string) => {
    if (!currentUser) return;
    await markStoryViewed(storyId, currentUser.id);
    // Update local state to reflect viewed
    setStoryGroups(prev =>
      prev.map(group => ({
        ...group,
        stories: group.stories.map(s =>
          s.id === storyId ? { ...s, is_seen: true } : s
        ),
        has_unseen: group.stories.some(s => s.id !== storyId && !s.is_seen),
      }))
    );
  }, [currentUser]);

  // Separate my stories from others
  const myGroup = storyGroups.find(g => g.author_id === currentUser?.id) || null;
  const othersGroups = storyGroups.filter(g => g.author_id !== currentUser?.id);

  return {
    storyGroups,
    myGroup,
    othersGroups,
    loading,
    uploading,
    uploadStory,
    viewStory,
    refresh: load,
  };
}
