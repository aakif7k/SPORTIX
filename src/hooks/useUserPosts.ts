import { useQuery } from '@tanstack/react-query';

import { api, ApiError } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import type { Post } from './useFeed';

/**
 * Posts by one author.
 *
 * The keyed-result pattern this replaces solved the stale-data problem by hand —
 * storing the result alongside the user it belonged to so a switch read as
 * loading. react-query keys the cache by user id, which gets the same property
 * for free, plus dedup when a profile page and a preview both mount.
 */
export function useUserPosts(userId?: string) {
  const query = useQuery<Post[], ApiError>({
    queryKey: qk.posts.byUser(userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      const res = await api.get<{ data: { posts?: Post[] } }>(`/api/posts/user/${userId}`);
      return res.data?.posts ?? [];
    },
  });

  return {
    posts: query.data ?? [],
    loading: query.isPending && Boolean(userId),
    error: (query.error as ApiError | null) ?? null,
    refresh: query.refetch,
  };
}
