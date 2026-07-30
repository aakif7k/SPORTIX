/**
 * useReels.ts — Appwrite-backed reels hook
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
  const userId = currentUser?.id;
  const [reels, setReels] = useState<DbReel[]>([]);
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  // Which user the reels currently in state were fetched for. `loading` derives
  // from this rather than being its own flag, so the mount effect does not have
  // to call setState synchronously (react-hooks/set-state-in-effect).
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const viewedThisSession = useRef<Set<string>>(new Set());

  const load = useCallback(async (pageNum: number, reset: boolean) => {
    if (!userId) return;

    try {
      const data = await getReels(userId, pageNum, PAGE_SIZE);
      setReels(prev => reset ? data : [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
      setPage(pageNum + 1);
    } catch {
      setReels([]);
      setHasMore(false);
    } finally {
      setLoadedFor(userId);
    }
  }, [userId]);

  // The first page is fetched inline rather than by calling load(), so every
  // state write lands in a promise continuation instead of running while the
  // effect body executes. load() is still used for pagination and for the
  // post-upload refresh, both of which are driven by events.
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    getReels(userId, 0, PAGE_SIZE)
      .then(data => {
        if (cancelled) return;
        setReels(data);
        setHasMore(data.length === PAGE_SIZE);
        setPage(1);
        setLoadedFor(userId);
      })
      .catch(() => {
        if (cancelled) return;
        setReels([]);
        setHasMore(false);
        setLoadedFor(userId);
      });

    return () => { cancelled = true; };
  }, [userId]);

  // A pending or stale load leaves loadedFor pointing at a different user, so
  // the feed reads as loading until the current user's page arrives.
  const loading = Boolean(userId) && loadedFor !== userId;

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

  const uid = targetAuthUid ?? currentUser?.id;

  // Keyed by the uid it was fetched for, so `reels` and `loading` are derived
  // and the effect performs no synchronous setState.
  const [result, setResult] = useState<{ uid: string; reels: DbReel[] } | null>(null);

  useEffect(() => {
    if (!uid) return;

    let cancelled = false;
    getUserReels(uid)
      .then(data => { if (!cancelled) setResult({ uid, reels: data }); })
      .catch(() => { if (!cancelled) setResult({ uid, reels: [] }); });

    return () => { cancelled = true; };
  }, [uid]);

  const isFresh = result !== null && result.uid === uid;
  const reels = isFresh ? result.reels : [];
  const loading = Boolean(uid) && !isFresh;

  return { reels, loading };
}
