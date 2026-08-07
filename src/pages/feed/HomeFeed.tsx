import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useFeed } from '@/hooks/useFeed';
import { PostComposer } from '@/components/social/PostComposer';
import { PostCard } from '@/components/social/PostCard';

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

export const HomeFeed: React.FC = () => {
  const { user } = useAuth();

  const {
    posts, loading, hasMore, submitting,
    submitPost, likePost, deletePost,
    loadMore,
  } = useFeed();

  const [activeCategory, setActiveCategory] = useState('All');
  const [isComposerOpen, setIsComposerOpen] = useState(false);

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
        {posts.map((post) => (
          <PostCard
            key={post.$id}
            post={post as any}
            onLike={likePost}
            onDelete={deletePost}
          />
        ))}

        {!loading && hasMore && (
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
    </div>
  );
};