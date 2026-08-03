/**
 * useStories — active stories, grouped by author.
 *
 * Stories expire after 24 hours, enforced by expires_at server-side.
 */
import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import {
  getActiveStories,
  createStory,
  markStoryViewed,
  type DbStoryGroup,
} from '@/services/socialService';

export function useStories() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const userId = currentUser?.id;
  const key = qk.stories.active(userId);

  const query = useQuery<DbStoryGroup[], ApiError>({
    queryKey: key,
    enabled: Boolean(userId),
    queryFn: () => getActiveStories(userId!),
  });

  const storyGroups = useMemo(() => query.data ?? [], [query.data]);

  // The current user's own ring renders separately from everyone else's.
  const { myGroup, othersGroups } = useMemo(() => ({
    myGroup: storyGroups.find(g => g.author_id === userId) ?? null,
    othersGroups: storyGroups.filter(g => g.author_id !== userId),
  }), [storyGroups, userId]);

  const upload = useMutation({
    mutationFn: (args: { file: File; caption?: string; sportTag?: string }) =>
      createStory(args.file, args.caption, args.sportTag),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.stories.all }),
  });

  const view = useMutation({
    mutationFn: (storyId: string) => markStoryViewed(storyId, userId!),
    // Mark seen locally straight away: the ring must dim as the story opens, not
    // a round trip later.
    onMutate: async (storyId: string) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<DbStoryGroup[]>(key);

      queryClient.setQueryData<DbStoryGroup[]>(key, old => old?.map(group => {
        const stories = group.stories.map(s =>
          s.id === storyId ? { ...s, is_seen: true } : s);
        return { ...group, stories, has_unseen: stories.some(s => !s.is_seen) };
      }));

      return { previous };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous);
    },
  });

  return {
    storyGroups,
    myGroup,
    othersGroups,
    loading: query.isPending && Boolean(userId),
    error: (query.error as ApiError | null) ?? null,
    uploading: upload.isPending,
    uploadStory: (file: File, caption?: string, sportTag?: string) =>
      upload.mutateAsync({ file, caption, sportTag }),
    viewStory: (storyId: string) => view.mutate(storyId),
    refresh: () => queryClient.invalidateQueries({ queryKey: key }),
  };
}
