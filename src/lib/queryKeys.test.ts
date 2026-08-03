/**
 * The key hierarchy has to actually support prefix invalidation.
 *
 * Every mutation in the migrated hooks invalidates a broad key — qk.posts.all
 * after creating a post, qk.reels.all after uploading a reel — and relies on
 * react-query matching narrower keys by prefix. If a key is shaped wrongly the
 * invalidation silently matches nothing: no error, no refetch, and the UI keeps
 * showing stale data. These tests assert the matching against a real QueryClient
 * rather than trusting the shape by eye.
 */
import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it } from 'vitest';

import { qk } from '@/lib/queryKeys';

let client: QueryClient;

beforeEach(() => {
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
});

/** Seed a key so the cache has something for a filter to match. */
function seed(key: readonly unknown[], value: unknown = 'x') {
  client.setQueryData(key, value);
}

function matches(filterKey: readonly unknown[]): number {
  return client.getQueryCache().findAll({ queryKey: filterKey }).length;
}

describe('posts', () => {
  it('posts.all reaches every feed variant and every user list', () => {
    seed(qk.posts.feed());
    seed(qk.posts.feed({ postType: 'training' }));
    seed(qk.posts.feed({ sport: 'football' }));
    seed(qk.posts.byUser('u1'));
    seed(qk.posts.byUser('u2'));
    seed(qk.posts.comments('p1'));

    expect(matches(qk.posts.all)).toBe(6);
  });

  it('distinguishes feeds by their filters', () => {
    seed(qk.posts.feed({ postType: 'training' }));
    seed(qk.posts.feed({ postType: 'highlights' }));

    expect(matches(qk.posts.feed({ postType: 'training' }))).toBe(1);
    expect(qk.posts.feed({ postType: 'training' }))
      .not.toEqual(qk.posts.feed({ postType: 'highlights' }));
  });

  it('treats an absent filter and an explicitly undefined one as the same key', () => {
    // Otherwise HomeFeed with no filter and HomeFeed passing undefined would
    // keep two separate caches of the same data.
    expect(qk.posts.feed()).toEqual(qk.posts.feed({}));
    expect(qk.posts.feed({ postType: undefined })).toEqual(qk.posts.feed());
  });

  it('a user list is not disturbed by invalidating another user', () => {
    seed(qk.posts.byUser('u1'));
    seed(qk.posts.byUser('u2'));
    expect(matches(qk.posts.byUser('u1'))).toBe(1);
  });
});

describe('reels', () => {
  it('reels.all reaches the feed and per-user lists', () => {
    seed(qk.reels.feed('u1'));
    seed(qk.reels.byUser('u1'));
    seed(qk.reels.byUser('u2'));
    expect(matches(qk.reels.all)).toBe(3);
  });

  it('does not collide with posts', () => {
    seed(qk.posts.byUser('u1'));
    seed(qk.reels.byUser('u1'));
    expect(matches(qk.posts.all)).toBe(1);
    expect(matches(qk.reels.all)).toBe(1);
  });
});

describe('profile', () => {
  it('profile.all reaches both the profile and its stats', () => {
    seed(qk.profile.me());
    seed(qk.profile.stats());
    expect(matches(qk.profile.all)).toBe(2);
  });

  it('stats can be invalidated without refetching the profile', () => {
    // Posting changes the counts but not the bio, and useFeed invalidates only
    // the stats for exactly this reason.
    seed(qk.profile.me());
    seed(qk.profile.stats());
    expect(matches(qk.profile.stats())).toBe(1);
  });
});

describe('stories and matches', () => {
  it('stories.all reaches a per-user active list', () => {
    seed(qk.stories.active('u1'));
    seed(qk.stories.active('u2'));
    expect(matches(qk.stories.all)).toBe(2);
  });

  it('keys an undefined user distinctly from a real one', () => {
    // A logged-out read must never be served a signed-in user's cached data.
    expect(qk.stories.active(undefined)).not.toEqual(qk.stories.active('u1'));
    expect(qk.matches.pendingReport(undefined)).not.toEqual(qk.matches.pendingReport('u1'));
  });
});

describe('key hygiene', () => {
  it('every namespace root is a distinct single-segment key', () => {
    const roots = [
      qk.posts.all, qk.stories.all, qk.reels.all,
      qk.profile.all, qk.matches.all, qk.pulse.all,
    ];
    for (const root of roots) expect(root).toHaveLength(1);
    expect(new Set(roots.map(r => r[0])).size).toBe(roots.length);
  });

  it('builders are pure, so repeated calls stay cache-equal', () => {
    expect(qk.posts.byUser('u1')).toEqual(qk.posts.byUser('u1'));
    expect(qk.profile.me()).toEqual(qk.profile.me());
  });
});
