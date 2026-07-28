/**
 * useReels.ts — Real Supabase reels hook
 * Replaces the old in-memory DEMO_REELS implementation.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAuthStore } from '@/store/authStore';
import {
  getReels,
  getUserReels,
  createReel,
  toggleReelLike,
  recordReelView,
  type DbReel,
} from '@/services/socialService';

const PAGE_SIZE = 10;

// ─── Main reels feed hook ─────────────────────────────────────────────────────
export function useReels() {
  const { user: currentUser } = useAuth();
  const [reels, setReels] = useState<DbReel[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const viewedThisSession = useRef<Set<string>>(new Set());

  const load = useCallback(async (pageNum: number, reset: boolean) => {
    if (!currentUser) { setLoading(false); return; }
    if (reset) setLoading(true);

    try {
      const data = await getReels(currentUser.id, pageNum, PAGE_SIZE);
      setReels(prev => reset ? data : [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
      setPage(pageNum + 1);
    } catch {
      setReels([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser) {
      setReels([]);
      setPage(0);
      setHasMore(true);
      load(0, true);
    } else {
      setLoading(false);
      setReels([]);
    }
  }, [currentUser?.id]);

  const toggleLike = useCallback(async (reelId: string, currentlyLiked: boolean) => {
    if (!currentUser) return;
    // Optimistic update
    setReels(prev => prev.map(r =>
      r.id === reelId
        ? {
            ...r,
            is_liked: !currentlyLiked,
            likes_count: currentlyLiked ? r.likes_count - 1 : r.likes_count + 1,
          }
        : r
    ));
    try {
      await toggleReelLike(reelId, currentUser.id, currentlyLiked);
    } catch {
      // Revert
      setReels(prev => prev.map(r =>
        r.id === reelId
          ? { ...r, is_liked: currentlyLiked, likes_count: currentlyLiked ? r.likes_count + 1 : r.likes_count - 1 }
          : r
      ));
    }
  }, [currentUser]);

  const recordView = useCallback(async (reelId: string) => {
    if (viewedThisSession.current.has(reelId)) return;
    viewedThisSession.current.add(reelId);
    setReels(prev => prev.map(r => r.id === reelId ? { ...r, views_count: r.views_count + 1 } : r));
    try {
      await recordReelView(reelId);
    } catch {
      // Silent fail on view count
    }
  }, []);

  const uploadReel = useCallback(async (
    videoFile: File,
    thumbnailFile: File | null,
    caption?: string,
    sportTag?: string
  ) => {
    if (!currentUser) return;
    const storeUser = useAuthStore.getState().user;
    setUploading(true);
    try {
      await createReel(
        currentUser.id,
        storeUser?.name     ?? currentUser.name,
        storeUser?.username ?? '',
        storeUser?.avatar   ?? null,
        storeUser?.sport    ?? '',
        videoFile,
        thumbnailFile,
        caption,
        sportTag,
      );
      // Refresh from top
      load(0, true);
    } finally {
      setUploading(false);
    }
  }, [currentUser, load]);

  return {
    reels,
    loading,
    uploading,
    hasMore,
    loadMore: () => { if (!loading && hasMore) load(page, false); },
    toggleLike,
    recordView,
    uploadReel,
  };
}

// ─── User-specific reels (for profile page) ───────────────────────────────────
export function useUserReels(targetAuthUid?: string) {
  const { user: currentUser } = useAuth();
  const [reels, setReels] = useState<DbReel[]>([]);
  const [loading, setLoading] = useState(true);

  const uid = targetAuthUid ?? currentUser?.id;

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    setLoading(true);
    setReels([]);
    getUserReels(uid).then(data => {
      setReels(data);
      setLoading(false);
    }).catch(() => {
      setReels([]);
      setLoading(false);
    });
  }, [uid]);

  return { reels, loading };
}
