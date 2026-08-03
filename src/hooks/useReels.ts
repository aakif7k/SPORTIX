/**
 * useReels — the reel feed and a per-author list.
 */
import { useCallback, useRef } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import {
  getReels,
  getUserReels,
  createReel,
  toggleReelLike,
  recordReelView,
  type DbReel,
} from '@/services/socialService';

const PAGE_SIZE = 10;

export function useReels() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const userId = currentUser?.id;
  const key = qk.reels.feed(userId);
  const viewedThisSession = useRef<Set<string>>(new Set());

  const query = useInfiniteQuery<DbReel[], ApiError>({
    queryKey: key,
    initialPageParam: 0,
    enabled: Boolean(userId),
    queryFn: ({ pageParam }) => getReels(userId!, pageParam as number, PAGE_SIZE),
    getNextPageParam: (last, all) =>
      last.length === PAGE_SIZE ? all.length : undefined,
  });

  const reels = query.data?.pages.flat() ?? [];

  const like = useMutation({
    mutationFn: (args: { reelId: string; currentlyLiked: boolean }) =>
      toggleReelLike(args.reelId, userId!, args.currentlyLiked),
    onMutate: async ({ reelId, currentlyLiked }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);

      queryClient.setQueryData(key, (old: typeof query.data) => old && {
        ...old,
        pages: old.pages.map(page => page.map(r => r.id === reelId
          ? {
              ...r,
              is_liked: !currentlyLiked,
              likes_count: r.likes_count + (currentlyLiked ? -1 : 1),
            }
          : r)),
      });

      return { previous };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const upload = useMutation({
    mutationFn: (args: {
      videoFile: File; thumbnailFile: File | null;
      caption?: string; sportTag?: string;
    }) => createReel(args.videoFile, args.thumbnailFile, args.caption, args.sportTag),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.reels.all }),
  });

  const recordView = useCallback(async (reelId: string) => {
    // Once per session per reel: the counter is not worth a request per scroll.
    if (viewedThisSession.current.has(reelId)) return;
    viewedThisSession.current.add(reelId);

    queryClient.setQueryData(key, (old: ReturnType<typeof queryClient.getQueryData>) => {
      const data = old as { pages: DbReel[][] } | undefined;
      return data && {
        ...data,
        pages: data.pages.map(page => page.map(r =>
          r.id === reelId ? { ...r, views_count: r.views_count + 1 } : r)),
      };
    });

    await recordReelView(reelId);      // already best-effort inside the service
  }, [queryClient, key]);

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
  }, [query]);

  return {
    reels,
    loading: query.isPending && Boolean(userId),
    error: (query.error as ApiError | null) ?? null,
    uploading: upload.isPending,
    hasMore: Boolean(query.hasNextPage),
    loadMore,
    toggleLike: (reelId: string, currentlyLiked: boolean) =>
      like.mutate({ reelId, currentlyLiked }),
    recordView,
    uploadReel: (
      videoFile: File, thumbnailFile: File | null,
      caption?: string, sportTag?: string,
    ) => upload.mutateAsync({ videoFile, thumbnailFile, caption, sportTag }),
  };
}

// ─── User-specific reels (profile page) ───────────────────────────────────────
export function useUserReels(targetAuthUid?: string) {
  const { user: currentUser } = useAuth();
  const uid = targetAuthUid ?? currentUser?.id;

  const query = useQuery<DbReel[], ApiError>({
    queryKey: qk.reels.byUser(uid),
    enabled: Boolean(uid),
    queryFn: () => getUserReels(uid!),
  });

  return {
    reels: query.data ?? [],
    loading: query.isPending && Boolean(uid),
    error: (query.error as ApiError | null) ?? null,
  };
}
