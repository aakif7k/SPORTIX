import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useReels } from '@/hooks/useReels';
import { useFeed } from '@/hooks/useFeed';
import { PostComposer } from '@/components/social/PostComposer';
import { PostCard } from '@/components/social/PostCard';

// Social system
import { StoryBar } from '@/components/social/StoryBar';
import { StoryViewer } from '@/components/social/StoryViewer';
import { useStories } from '@/hooks/useStories';
import type { DbPost, DbStoryGroup } from '@/services/socialService';
import type { Post } from '@/hooks/useFeed';

const CATEGORIES = ['All', 'Training', 'Highlights', 'Achievements', 'Events'];

const UPCOMING_DROPS = [
  { id: 1, title: 'Summer Championship', time: '14:00', type: 'Event' },
  { id: 2, title: 'Pro Training Tips', time: '16:30', type: 'Guide' },
  { id: 3, title: 'Top 10 Goals', time: '18:00', type: 'Highlight' },
];

const UpcomingDropsRow: React.FC = () => (
  <div className="mb-5">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
      <span className="font-mono text-[10px] font-bold text-text-muted tracking-widest uppercase">UPCOMING · SCHEDULED DROPS</span>
    </div>
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {UPCOMING_DROPS.map((drop) => (
        <div key={drop.id} className="flex-shrink-0 bg-surface border border-border-muted/60 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse" />
          <span className="font-mono text-[10px] text-text-muted uppercase">{drop.type}</span>
          <span className="font-semibold text-white text-[11px]">{drop.title}</span>
          <span className="font-mono text-[10px] text-text-muted ml-auto">{drop.time}</span>
        </div>
      ))}
    </div>
  </div>
);

/**
 * The reels strip.
 *
 * Three hardcoded tiles — "Speed Drill" by Marcus, "Top Corner Shot" by Elena —
 * used to sit here, on a page whose feed was already real. Reels have had a
 * backend since phase 5.
 */
const ReelsPreviewRow: React.FC<{ onOpenReels: () => void }> = ({ onOpenReels }) => {
  const { reels, loading } = useReels();
  const preview = reels.slice(0, 3);

  return (
  <div className="mb-5">
    <div className="flex justify-between items-center mb-2">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#00D4FF]" />
        <span className="font-mono text-[10px] font-bold text-text-muted tracking-widest uppercase">HIGHLIGHT REELS</span>
      </div>
      <button onClick={onOpenReels} className="text-[#00D4FF] font-mono text-[11px] font-bold hover:underline">
        See All →
      </button>
    </div>
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
      {loading
        ? [0, 1, 2].map(i => (
          <div key={i} className="flex-shrink-0 w-24 h-36 rounded-xl bg-elevated animate-shimmer" />
        ))
        : preview.map((r) => (
          <button
            key={r.id}
            onClick={onOpenReels}
            className="flex-shrink-0 w-24 h-36 rounded-xl bg-elevated border border-border-muted relative overflow-hidden flex flex-col justify-between p-2 text-left hover:border-[#00D4FF]/60 transition-all"
            style={r.thumbnail_url ? {
              backgroundImage: `url(${r.thumbnail_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : undefined}
          >
            {/* A gradient so a caption stays readable over a thumbnail. */}
            <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
            <span className="relative font-mono text-[9px] text-[#00D4FF] font-bold uppercase line-clamp-2">
              {r.caption || r.sport_tag || 'Reel'}
            </span>
            <span className="relative text-white text-[10px] font-bold truncate">
              {r.author?.full_name ?? ''}
            </span>
          </button>
        ))}
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onOpenReels}
        className="flex-shrink-0 w-24 h-36 rounded-xl border-2 border-dashed border-border-muted flex flex-col items-center justify-center gap-1.5 text-text-muted hover:border-[#CCFF00]/50 hover:text-[#CCFF00] transition-colors"
      >
        <span className="text-[9px] font-bold">View All</span>
      </motion.button>
    </div>
  </div>
  );
};

/**
 * The feed row as PostCard wants it.
 *
 * useFeed's Post and socialService's DbPost describe the same row under different
 * names — `$id`/`author_full_name` against `id`/`author_name`. `post as any` was
 * papering over that, which meant PostCard's own prop type was checking nothing.
 * Mapping here makes the disagreement visible; collapsing the two shapes is a
 * follow-up in its own right.
 */
const toCardPost = (post: Post): DbPost => ({
  ...post,
  id: post.$id,
  author_name: post.author_full_name,
});

export const HomeFeed: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?.id;

  const { myGroup, othersGroups, viewStory } = useStories();
  const [activeStoryGroup, setActiveStoryGroup] = useState<DbStoryGroup | null>(null);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);

  const {
    posts, loading, error, hasMore, submitting,
    submitPost, likePost, deletePost,
    loadMore, refresh,
  } = useFeed();

  const [activeCategory, setActiveCategory] = useState('All');
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const handleOpenStoryViewer = (group: DbStoryGroup) => {
    const idx = othersGroups.findIndex((g) => g.author_id === group.author_id);
    setActiveGroupIndex(idx >= 0 ? idx : 0);
    setActiveStoryGroup(group);
  };

  const handleNextGroup = () => {
    const next = othersGroups[activeGroupIndex + 1];
    if (next) {
      setActiveGroupIndex(i => i + 1);
      setActiveStoryGroup(next);
    } else {
      setActiveStoryGroup(null);
    }
  };

  const handlePrevGroup = () => {
    const prev = othersGroups[activeGroupIndex - 1];
    if (prev) {
      setActiveGroupIndex(i => i - 1);
      setActiveStoryGroup(prev);
    }
  };

  return (
    <div className="max-w-2xl mx-auto relative px-4 md:px-0 pb-20 md:pb-8">

      {/* Header */}
      <div className="flex justify-between items-center mb-5 pt-2">
        <h1 className="font-display text-[26px] md:text-[32px] text-white tracking-wider">HYPEZONE</h1>
        <button
          onClick={() => setIsComposerOpen(true)}
          className="btn-primary flex items-center gap-2 rounded-full !h-[36px] md:!h-[40px] text-xs md:text-sm px-4"
        >
          ⚡ Drop a Post
        </button>
      </div>

      {/* Upcoming Drops Row */}
      <UpcomingDropsRow />

      {/* ── STORY BAR ───────────────────────────────────────────── */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
          <span className="font-mono text-[10px] font-bold text-text-muted tracking-widest uppercase">FLEX · STORIES</span>
        </div>
        <StoryBar
          currentUserName={user?.name ?? 'You'}
          currentUserAvatar={user?.avatar_url || null}
          myGroup={myGroup}
          othersGroups={othersGroups}
          onOpenViewer={handleOpenStoryViewer}
          onOpenCreator={() => navigate('/app/reels')}
        />
      </div>

      {/* ── REELS PREVIEW ROW ───────────────────────────────────── */}
      <ReelsPreviewRow onOpenReels={() => navigate('/app/reels')} />

      {/* Filter Bar */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-mono transition-all ${activeCategory === cat ? 'bg-accent text-black font-bold shadow-[0_0_15px_rgba(204,255,0,0.3)]' : 'bg-surface border border-border-muted text-text-secondary hover:border-accent/50 hover:text-white'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {/* Loading: three skeletons, only while there is nothing to show yet. A
            refresh with posts on screen must not blank them out. */}
        {loading && posts.length === 0 && (
          <div className="space-y-4" aria-busy="true" aria-label="Loading feed">
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-2xl bg-surface border border-border-muted p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-elevated animate-shimmer" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-32 rounded bg-elevated animate-shimmer" />
                    <div className="h-2 w-20 rounded bg-elevated animate-shimmer" />
                  </div>
                </div>
                <div className="h-3 w-full rounded bg-elevated animate-shimmer" />
                <div className="h-3 w-4/5 rounded bg-elevated animate-shimmer" />
                <div className="h-48 w-full rounded-xl bg-elevated animate-shimmer" />
              </div>
            ))}
          </div>
        )}

        {/* Error: this used to be covered up with three fabricated Unsplash posts,
            so a broken feed was indistinguishable from a working one. */}
        {error && posts.length === 0 && (
          <div className="rounded-2xl bg-surface border border-border-muted p-8 text-center space-y-3">
            <p className="font-display text-[15px] tracking-wider text-text-primary uppercase">
              Could not load your feed
            </p>
            <p className="font-mono text-[11px] text-text-secondary">
              {error.isNetwork
                ? 'The server is unreachable. Check your connection.'
                : error.message}
            </p>
            {error.requestId && (
              <p className="font-mono text-[9px] text-text-muted">
                Reference: {error.requestId}
              </p>
            )}
            <button
              onClick={() => refresh()}
              className="px-4 py-2 rounded-full bg-accent text-black font-mono text-[11px] font-bold uppercase tracking-wider hover:bg-accent/90 transition-all"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty: a genuinely empty feed, which is a normal state for a new account. */}
        {!loading && !error && posts.length === 0 && (
          <div className="rounded-2xl bg-surface border border-dashed border-border-muted p-10 text-center space-y-2">
            <p className="font-display text-[15px] tracking-wider text-text-primary uppercase">
              Your feed is quiet
            </p>
            <p className="font-mono text-[11px] text-text-secondary">
              Follow some athletes, or share the first post yourself.
            </p>
          </div>
        )}

        {posts.map((post) => (
          <PostCard
            key={post.$id}
            post={toCardPost(post)}
            onLike={likePost}
            onDelete={deletePost}
          />
        ))}

        {!loading && !error && hasMore && posts.length > 0 && (
          <div className="flex items-center justify-center py-6">
            <button
              onClick={loadMore}
              className="px-4 py-2 rounded-full text-xs font-mono transition-all hover:bg-accent/20"
            >
              Load more…
            </button>
          </div>
        )}
      </div>

      {/* ── PORTALS ─────────────────────────────────────────────────────── */}

      {/* Post Composer */}
      {isComposerOpen && user && (
        <PostComposer
          onSubmit={async (payload) => {
            const res = await submitPost(payload);
            setIsComposerOpen(false);
            return !!res;
          }}
          submitting={submitting}
          onClose={() => setIsComposerOpen(false)}
        />
      )}

      {/* Story Viewer */}
      {activeStoryGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="relative w-full max-w-md">
            <div onClick={() => setActiveStoryGroup(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
            />
            <div className="relative z-10 p-4">
              <StoryViewer
                key={activeStoryGroup.author_id}
                group={activeStoryGroup}
                currentUserId={currentUserId ?? ''}
                onClose={() => setActiveStoryGroup(null)}
                onViewed={viewStory}
                onNextGroup={activeGroupIndex < othersGroups.length - 1 ? handleNextGroup : undefined}
                onPrevGroup={activeGroupIndex > 0 ? handlePrevGroup : undefined}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};