import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Post } from './useFeed';

export function useUserPosts(userId?: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    api.get<any>(`/api/posts/user/${userId}`)
      .then(res => {
        setPosts(res.data?.posts || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  return { posts, loading };
}