import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  fetchHypezonePosts,
  createHypezonePost,
  togglePostLike,
  deleteHypezonePost,
  subscribeToHypezoneFeed,
} from '@/services/hypezoneService';
import type { HypezonePost } from '@/services/hypezoneService';
import toast from 'react-hot-toast';

export type Post = HypezonePost;

export function useFeed(filters?: {
  post_type?: string;
  sport?: string;
  feed_type?: 'explore' | 'following';
}) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadPosts = useCallback(async (pageNum: number, reset = false) => {
    try {
      setLoading(true);
      const res = await fetchHypezonePosts({
        currentUserId: user?.id,
        page: pageNum,
        limit: 20,
        feedType: filters?.feed_type || 'explore',
        category: filters?.post_type,
        sportTag: filters?.sport,
      });

      if (reset) {
        setPosts(res.posts);
      } else {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.$id));
          const uniqueNew = res.posts.filter(p => !existingIds.has(p.$id));
          return [...prev, ...uniqueNew];
        });
      }

      setHasMore(res.hasMore);
      setPage(pageNum);
    } catch (err: any) {
      console.error('[useFeed] loadPosts error:', err);
      toast.error('Failed to load HypeZone feed');
    } finally {
      setLoading(false);
    }
  }, [user?.id, filters?.post_type, filters?.sport, filters?.feed_type]);

  useEffect(() => {
    loadPosts(0, true);
  }, [user?.id, filters?.post_type, filters?.sport, filters?.feed_type, loadPosts]);

  // Realtime Feed Listener
  useEffect(() => {
    const unsubscribe = subscribeToHypezoneFeed((event) => {
      if (event.events.some((e: string) => e.includes('.create'))) {
        // Refresh feed to get new post with author details
        loadPosts(0, true);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [loadPosts]);

  const submitPost = async (payload: {
    content: string;
    files?: File[];
    post_type?: string;
    sport_tag?: string;
    location_tag?: string;
  }) => {
    if (!user) {
      toast.error('Please sign in to publish a post.');
      return;
    }
    const uAny = user as any;
    setSubmitting(true);
    try {
      const newPost = await createHypezonePost({
        authorId: user.id,
        authorUsername: uAny.user_metadata?.username || uAny.username || user.email?.split('@')[0] || 'athlete',
        authorFullName: uAny.user_metadata?.full_name || uAny.name || uAny.full_name || 'SportiX Athlete',
        authorAvatarUrl: uAny.user_metadata?.avatar_url || uAny.avatar_url || null,
        authorSport: uAny.user_metadata?.sport || uAny.sport || 'Multi-Sport',
        authorLevel: uAny.user_metadata?.level || uAny.level || 1,
        content: payload.content,
        files: payload.files,
        postType: (payload.post_type?.toLowerCase() as any) || 'general',
        sportTag: payload.sport_tag || null,
        locationTag: payload.location_tag || null,
      });

      // Prepend to feed immediately (optimistic UI)
      setPosts(prev => [newPost, ...prev]);
      toast.success('Post published to HypeZone!');
      return newPost;
    } catch (err: any) {
      console.error('[useFeed] submitPost error:', err);
      toast.error(err.message || 'Failed to publish post');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const likePost = async (postId: string, isLiked: boolean) => {
    if (!user) {
      toast.error('Please sign in to like posts.');
      return;
    }

    const uAny = user as any;

    // Optimistic UI update
    setPosts(prev =>
      prev.map(p =>
        p.$id === postId
          ? {
              ...p,
              is_liked: !isLiked,
              likes_count: isLiked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1,
            }
          : p
      )
    );

    try {
      await togglePostLike(postId, user.id, {
        name: uAny.user_metadata?.full_name || uAny.name || uAny.full_name || 'Athlete',
        username: uAny.user_metadata?.username || uAny.username || 'athlete',
        avatar: uAny.user_metadata?.avatar_url || uAny.avatar_url || undefined,
      });
    } catch (err) {
      // Revert on failure
      setPosts(prev =>
        prev.map(p =>
          p.$id === postId
            ? {
                ...p,
                is_liked: isLiked,
                likes_count: isLiked ? p.likes_count + 1 : Math.max(0, p.likes_count - 1),
              }
            : p
        )
      );
      toast.error('Failed to update like status');
    }
  };

  const deletePost = async (postId: string) => {
    if (!user) return;
    try {
      await deleteHypezonePost(postId, user.id);
      setPosts(prev => prev.filter(p => p.$id !== postId));
      toast.success('Post deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete post');
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadPosts(page + 1);
    }
  };

  const refresh = () => loadPosts(0, true);

  return {
    posts,
    loading,
    hasMore,
    submitting,
    submitPost,
    likePost,
    deletePost,
    loadMore,
    refresh,
  };
}