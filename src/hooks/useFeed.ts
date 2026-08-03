/**
 * The home feed, on react-query.
 *
 * QueryClientProvider was mounted in main.tsx with sensible defaults and not a
 * single hook used it, so all seventeen hand-rolled useState/useEffect fetching:
 * no caching, no dedup, no invalidation. Two components mounting the same data
 * issued two requests, and a mutation in one place left every other view stale
 * until a full reload.
 *
 * Pagination is a real infinite query rather than an appended array, so going
 * back to the feed restores the pages already loaded instead of refetching from
 * scratch. Mutations invalidate through the key factory in lib/queryKeys, so a
 * new post or a like is reflected everywhere that reads posts.
 */
import { useCallback } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { useAuth } from '@/context/AuthContext';
import { api, ApiError } from '@/lib/api';
import { qk } from '@/lib/queryKeys';

export interface Post {
  $id: string;
  author_id: string;
  author_username: string;
  author_full_name: string;
  author_avatar_url: string | null;
  author_sport: string;
  author_level: number;
  content: string;
  media_urls: string[];
  media_type: 'none' | 'image' | 'video' | 'multi_image';
  post_type: string;
  sport_tag: string | null;
  location_tag: string | null;
  likes_count: number;
  comments_count: number;
  is_liked?: boolean;
  is_deleted: boolean;
  created_at: string;
  $createdAt: string;
}

const PAGE_SIZE = 20;

interface FeedPage {
  posts: Post[];
  hasMore: boolean;
  page: number;
}

export function useFeed(filters?: { post_type?: string; sport?: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const postType = filters?.post_type;
  const sport = filters?.sport;
  const feedKey = qk.posts.feed({ postType, sport });

  const query = useInfiniteQuery<FeedPage, ApiError>({
    queryKey: feedKey,
    initialPageParam: 0,
    enabled: Boolean(userId),
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        limit: String(PAGE_SIZE),
      });
      if (postType) params.append('post_type', postType);
      if (sport) params.append('sport', sport);

      const res = await api.get<{ data: { posts: Post[]; has_more?: boolean } }>(
        `/api/posts/feed?${params}`,
      );
      const posts = res.data?.posts ?? [];
      return {
        posts,
        // Trust the server's flag when it sends one; otherwise a short page is
        // the end of the feed.
        hasMore: res.data?.has_more ?? posts.length === PAGE_SIZE,
        page: pageParam as number,
      };
    },
    getNextPageParam: last => (last.hasMore ? last.page + 1 : undefined),
  });

  const posts = query.data?.pages.flatMap(p => p.posts) ?? [];

  // ── Mutations ───────────────────────────────────────────────────────────────
  const submit = useMutation({
    mutationFn: async (payload: {
      content: string;
      files?: File[];
      post_type?: string;
      sport_tag?: string;
      location_tag?: string;
    }) => {
      let mediaUrls: string[] = [];
      let mediaType = 'none';

      if (payload.files?.length) {
        mediaUrls = await Promise.all(payload.files.map(async file => {
          const form = new FormData();
          form.append('file', file);
          const res = await api.upload<{ data: { url: string } }>(
            '/api/upload/post-media', form,
          );
          return res.data.url;
        }));

        mediaType = payload.files.length > 1
          ? 'multi_image'
          : payload.files[0].type.startsWith('video/') ? 'video' : 'image';
      }

      const res = await api.post<{ data: Post }>('/api/posts/', {
        content: payload.content,
        media_urls: mediaUrls,
        media_type: mediaType,
        post_type: payload.post_type || 'general',
        sport_tag: payload.sport_tag || null,
        location_tag: payload.location_tag || null,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Post shared!');
      // Everything that lists posts: the feed, the author's own list, the counts.
      queryClient.invalidateQueries({ queryKey: qk.posts.all });
      queryClient.invalidateQueries({ queryKey: qk.profile.stats() });
    },
    onError: (err: ApiError) => toast.error(err.message || 'Failed to create post'),
  });

  const like = useMutation({
    mutationFn: async (postId: string) => {
      const res = await api.post<{ data: { liked: boolean; likes_count: number } }>(
        `/api/posts/${postId}/like`,
      );
      return { postId, ...res.data };
    },
    // Optimistic: a like must feel instant. The snapshot is returned so onError
    // can put the cache back exactly as it was.
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey: feedKey });
      const previous = queryClient.getQueryData(feedKey);

      queryClient.setQueryData(feedKey, (old: typeof query.data) => old && {
        ...old,
        pages: old.pages.map(page => ({
          ...page,
          posts: page.posts.map(p => p.$id === postId
            ? {
                ...p,
                is_liked: !p.is_liked,
                likes_count: p.likes_count + (p.is_liked ? -1 : 1),
              }
            : p),
        })),
      });

      return { previous };
    },
    onError: (_err, _postId, context) => {
      if (context?.previous) queryClient.setQueryData(feedKey, context.previous);
      toast.error('Could not update the like');
    },
    // Reconcile with the server's count, which is authoritative.
    onSettled: () => queryClient.invalidateQueries({ queryKey: feedKey }),
  });

  const remove = useMutation({
    mutationFn: (postId: string) => api.delete(`/api/posts/${postId}`),
    onSuccess: () => {
      toast.success('Post deleted');
      queryClient.invalidateQueries({ queryKey: qk.posts.all });
      queryClient.invalidateQueries({ queryKey: qk.profile.stats() });
    },
    onError: (err: ApiError) => toast.error(err.message || 'Failed to delete post'),
  });

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
  }, [query]);

  return {
    posts,
    // Only the first load is "loading"; fetching another page must not blank the
    // list that is already on screen.
    loading: query.isPending,
    error: (query.error as ApiError | null) ?? null,
    hasMore: Boolean(query.hasNextPage),
    isFetchingMore: query.isFetchingNextPage,
    submitting: submit.isPending,

    submitPost: submit.mutateAsync,
    likePost: (postId: string) => like.mutate(postId),
    deletePost: (postId: string) => remove.mutate(postId),
    loadMore,
    refresh: () => queryClient.invalidateQueries({ queryKey: feedKey }),
  };
}
