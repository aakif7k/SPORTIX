import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { Post } from './useFeed';

export function useUserPosts(userId?: string) {
  // The fetch result is stored together with the user it belongs to, which lets
  // `posts` and `loading` both be derived. The effect then never calls setState
  // synchronously (react-hooks/set-state-in-effect), and switching users no
  // longer shows the previous user's posts while the new request is in flight —
  // the stale key simply reads as loading.
  const [result, setResult] = useState<{ userId: string; posts: Post[] } | null>(null);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    api.get<any>(`/api/posts/user/${userId}`)
      .then(res => {
        if (!cancelled) setResult({ userId, posts: res.data?.posts || [] });
      })
      .catch(err => {
        console.error(err);
        if (!cancelled) setResult({ userId, posts: [] });
      });

    return () => { cancelled = true; };
  }, [userId]);

  const isFresh = result !== null && result.userId === userId;

  return {
    posts: isFresh ? result.posts : [],
    loading: Boolean(userId) && !isFresh,
  };
}
