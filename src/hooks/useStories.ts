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
  const [storyGroups, setStoryGroups] = useState<DbStoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    try {
      const groups = await getActiveStories(currentUser.id);
      setStoryGroups(groups);
    } catch {
      setStoryGroups([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser) {
      setStoryGroups([]);
      setLoading(true);
      load();
    } else {
      setLoading(false);
      setStoryGroups([]);
    }
  }, [currentUser?.id]);

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
