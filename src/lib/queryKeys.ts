/**
 * Every react-query cache key in one place.
 *
 * Keys are built as hierarchies so a broad invalidation reaches the narrow ones:
 * invalidating `qk.posts.all` also drops every feed page and every user's post
 * list, because react-query matches keys by prefix. Scattering literal arrays
 * across hooks is how invalidation silently stops working — a key typed slightly
 * differently in a mutation than in its query simply never matches, and the UI
 * keeps showing stale data with nothing to indicate it.
 */
export const qk = {
  posts: {
    all: ['posts'] as const,
    feed: (filters?: { postType?: string; sport?: string }) =>
      ['posts', 'feed', filters?.postType ?? null, filters?.sport ?? null] as const,
    byUser: (userId: string | undefined) => ['posts', 'user', userId ?? null] as const,
    comments: (postId: string) => ['posts', postId, 'comments'] as const,
  },

  stories: {
    all: ['stories'] as const,
    active: (userId: string | undefined) => ['stories', 'active', userId ?? null] as const,
  },

  reels: {
    all: ['reels'] as const,
    feed: (userId: string | undefined) => ['reels', 'feed', userId ?? null] as const,
    byUser: (userId: string | undefined) => ['reels', 'user', userId ?? null] as const,
  },

  profile: {
    all: ['profile'] as const,
    me: () => ['profile', 'me'] as const,
    stats: () => ['profile', 'stats'] as const,
  },

  matches: {
    all: ['matches'] as const,
    pendingReport: (userId: string | undefined) =>
      ['matches', 'pending-report', userId ?? null] as const,
  },

  pulse: {
    all: ['pulse'] as const,
    me: () => ['pulse', 'me'] as const,
    level: () => ['pulse', 'level'] as const,
  },
} as const;
