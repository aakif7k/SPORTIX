import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useFeed } from '@/hooks/useFeed';
import { PostComposer } from '@/components/social/PostComposer';
import { PostCard } from '@/components/social/PostCard';

// Social system
import { StoryBar } from '@/components/social/StoryBar';
import { StoryViewer } from '@/components/social/StoryViewer';
import { useStories } from '@/hooks/useStories';

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

const MOCK_REELS_PREVIEW = [
  { id: '1', title: 'Speed Drill', author: 'Marcus', bg: 'bg-[#1a2e05]' },
  { id: '2', title: 'Top Corner Shot', author: 'Elena', bg: 'bg-[#0f242a]' },
  { id: '3', title: 'Slam Dunk Highlight', author: 'Devon', bg: 'bg-[#2b1000]' },
];

const ReelsPreviewRow: React.FC<{ onOpenReels: () => void }> = ({ onOpenReels }) => (
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
      {MOCK_REELS_PREVIEW.map((r) => (
        <button
          key={r.id}
          onClick={onOpenReels}
          className={`flex-shrink-0 w-24 h-36 rounded-xl ${r.bg} border border-border-muted relative overflow-hidden flex flex-col justify-between p-2 text-left hover:border-[#00D4FF]/60 transition-all`}
        >
          <span className="font-mono text-[9px] text-[#00D4FF] font-bold uppercase">{r.title}</span>
          <span className="text-white text-[10px] font-bold">{r.author}</span>
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

export const HomeFeed: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?.id;

  const { myGroup, othersGroups, viewStory } = useStories();
  const [activeStoryGroup, setActiveStoryGroup] = useState<any>(null);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);

  const {
    posts, loading, hasMore, submitting,
    submitPost, likePost, deletePost,
    loadMore,
  } = useFeed();

  const [activeCategory, setActiveCategory] = useState('All');
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const handleOpenStoryViewer = (group: any) => {
    const idx = othersGroups.findIndex((g: any) => g.author_id === group.author_id);
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
          currentUserAvatar={(user as any)?.avatar_url || (user as any)?.avatar || null}
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