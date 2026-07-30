import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

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

// TODO(phase-5): delete. Fabricated placeholder posts shown when the feed comes
// back empty or the request fails, which makes a broken feed indistinguishable
// from an empty one. Previously duplicated inline in two branches of loadPosts
// with slightly different contents; consolidated here so there is one thing to
// remove once the feed renders real empty and error states.
const FALLBACK_POSTS: Post[] = [
          {
            $id: 'p1',
            author_id: 'u1',
            author_username: 'marcus_thiel',
            author_full_name: 'Marcus Thielemann',
            author_avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            author_sport: 'Football',
            author_level: 28,
            content: 'Just wrapped up a 3-hour tactical session. Heat maps don\'t lie — we\'re covering 37% more pressing zones this season. The data never sleeps! 📊⚽',
            media_urls: ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80'],
            media_type: 'image',
            post_type: 'training',
            sport_tag: 'Football',
            location_tag: 'Berlin, Germany',
            likes_count: 42,
            comments_count: 8,
            is_liked: false,
            is_deleted: false,
            created_at: new Date(Date.now() - 3600000).toISOString(),
            $createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            $id: 'p2',
            author_id: 'u2',
            author_username: 'priya_t',
            author_full_name: 'Priya Krishnamurthy',
            author_avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
            author_sport: 'Tennis',
            author_level: 32,
            content: 'Serve speed up to 198 km/h! Return accuracy at 84%. Form is peaking at the right time for championship matches. 🎾🔥',
            media_urls: ['https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&q=80'],
            media_type: 'image',
            post_type: 'highlights',
            sport_tag: 'Tennis',
            location_tag: 'Chennai, India',
            likes_count: 89,
            comments_count: 14,
            is_liked: true,
            is_deleted: false,
            created_at: new Date(Date.now() - 7200000).toISOString(),
            $createdAt: new Date(Date.now() - 7200000).toISOString(),
          },
          {
            $id: 'p3',
            author_id: 'u3',
            author_username: 'deshawn_w',
            author_full_name: 'DeShawn Williams',
            author_avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            author_sport: 'Basketball',
            author_level: 35,
            content: '28 points. 11 assists. 9 rebounds. One bucket away from a triple-double. Next game in 48 hours. No days off! 🏀💯',
            media_urls: ['https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80'],
            media_type: 'image',
            post_type: 'achievements',
            sport_tag: 'Basketball',
            location_tag: 'Atlanta, USA',
            likes_count: 124,
            comments_count: 23,
            is_liked: false,
            is_deleted: false,
            created_at: new Date(Date.now() - 14400000).toISOString(),
            $createdAt: new Date(Date.now() - 14400000).toISOString(),
          }
];

export function useFeed(filters?: {
  post_type?: string;
  sport?: string;
}) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  // Which user the posts in state belong to; `loading` derives from it.
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Read the two fields we actually depend on up front. Referencing
  // `filters?.post_type` inside the callback made the compiler infer the whole
  // `filters` object as the dependency while the dep array named the two
  // properties, so the manual memoization could not be preserved and the
  // callback was deoptimized (react-hooks/preserve-manual-memoization).
  const filterPostType = filters?.post_type;
  const filterSport = filters?.sport;

  // Fetches a page without touching state, so the mount effect below can apply
  // the result inside a promise continuation. Calling a state-writing async
  // function straight from an effect cascades an extra render pass
  // (react-hooks/set-state-in-effect).
  const fetchPage = useCallback(async (pageNum: number) => {
    const params = new URLSearchParams({
      page: String(pageNum),
      limit: '20',
    });
    if (filterPostType)
      params.append('post_type', filterPostType);
    if (filterSport)
      params.append('sport', filterSport);

    const res = await api.get<any>(
      `/api/posts/feed?${params}`
    );
    return {
      posts: (res.data?.posts || []) as Post[],
      hasMore: Boolean(res.data?.has_more),
    };
  }, [filterPostType, filterSport]);

  // Used for pagination and post-submit refresh, both event-driven.
  const loadPosts = useCallback(async (
    pageNum: number,
    reset = false
  ) => {
    if (!user) return;
    try {
      const { posts: fetched, hasMore: more } = await fetchPage(pageNum);

      if (fetched.length === 0 && reset) {
        setPosts(FALLBACK_POSTS);
      } else if (reset) {
        setPosts(fetched);
      } else {
        setPosts(prev => [...prev, ...fetched]);
      }
      setHasMore(more);
      setPage(pageNum);
    } catch (err) {
      console.warn('Backend feed unavailable, providing default feed cards:', err);
      if (reset) setPosts(FALLBACK_POSTS);
    } finally {
      setLoadedFor(user.id);
    }
  }, [user, fetchPage]);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    fetchPage(0)
      .then(({ posts: fetched, hasMore: more }) => {
        if (cancelled) return;
        setPosts(fetched.length === 0 ? FALLBACK_POSTS : fetched);
        setHasMore(more);
        setPage(0);
        setLoadedFor(userId);
      })
      .catch(err => {
        if (cancelled) return;
        console.warn('Backend feed unavailable, providing default feed cards:', err);
        setPosts(FALLBACK_POSTS);
        setLoadedFor(userId);
      });

    return () => { cancelled = true; };
  }, [userId, fetchPage]);

  // A pending or stale load leaves loadedFor pointing elsewhere, so the feed
  // reads as loading until this user's first page arrives.
  const loading = Boolean(userId) && loadedFor !== userId;


  const submitPost = async (payload: {
    content: string;
    files?: File[];
    post_type?: string;
    sport_tag?: string;
    location_tag?: string;
  }) => {
    if (!user) return;
    setSubmitting(true);
    try {
      // 1. Upload media files to S3 via backend
      let mediaUrls: string[] = [];
      let mediaType = 'none';

      if (payload.files && payload.files.length > 0) {
        const uploadPromises = payload.files.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          const res = await api.upload<any>(
            '/api/upload/post-media', formData
          );
          return res.data?.url as string;
        });

        mediaUrls = await Promise.all(uploadPromises);

        const firstFile = payload.files[0];
        if (payload.files.length > 1) {
          mediaType = 'multi_image';
        } else if (firstFile.type.startsWith('video/')) {
          mediaType = 'video';
        } else {
          mediaType = 'image';
        }
      }

      // 2. Create post in Appwrite via backend
      const res = await api.post<any>('/api/posts/', {
        content: payload.content,
        media_urls: mediaUrls,
        media_type: mediaType,
        post_type: payload.post_type || 'general',
        sport_tag: payload.sport_tag || null,
        location_tag: payload.location_tag || null,
      });

      const newPost = res.data;

      // 3. Prepend to feed (optimistic)
      setPosts(prev => [newPost, ...prev]);
      toast.success('Post shared!');
      return newPost;
    } catch (err: any) {
      toast.error(err.message || 'Failed to create post');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const likePost = async (postId: string, isLiked: boolean) => {
    if (!user) return;

    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.$id === postId ? {
        ...p,
        is_liked: !isLiked,
        likes_count: isLiked
          ? p.likes_count - 1
          : p.likes_count + 1,
      } : p
    ));

    try {
      await api.post(`/api/posts/${postId}/like`);
    } catch {
      // Revert on failure
      setPosts(prev => prev.map(p =>
        p.$id === postId ? {
          ...p,
          is_liked: isLiked,
          likes_count: isLiked
            ? p.likes_count + 1
            : p.likes_count - 1,
        } : p
      ));
      toast.error('Failed to like post');
    }
  };

  const deletePost = async (postId: string) => {
    try {
      await api.delete(`/api/posts/${postId}`);
      setPosts(prev => prev.filter(p => p.$id !== postId));
      toast.success('Post deleted');
    } catch {
      toast.error('Failed to delete post');
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadPosts(page + 1);
    }
  };

  const refresh = () => loadPosts(0, true);

  return {
    posts, loading, hasMore, submitting,
    submitPost, likePost, deletePost,
    loadMore, refresh,
  };
}