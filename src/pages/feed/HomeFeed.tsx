import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useFeed } from '@/hooks/useFeed';
import { PostComposer } from '@/components/social/PostComposer';
import { PostCard } from '@/components/social/PostCard';

// Social system (keep existing stories/reels - these will be fixed separately)
import { StoryBar } from '@/components/social/StoryBar';
import { StoryViewer } from '@/components/social/StoryViewer';
import { StoryCreator } from '@/components/social/StoryCreator';
import { useStories } from '@/hooks/useStories';
import { Avatar } from '@/components/ui/Avatar';
import { SportBadge } from '@/components/ui/Badge';
import { BadgeIcon } from '@/components/gamification/BadgeIcon';

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
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
      {UPCOMING_DROPS.map((drop, i) => (
        <div key={drop.id} className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-[12px] cursor-pointer group"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex flex-col items-center">
            <span className="font-display text-[16px] text-accent leading-none">{drop.time.split(':')[0]}</span>
            <span className="font-mono text-[9px] text-[#666] leading-none">{drop.time.split(':')[1]}</span>
          </div>
          <div className="w-px h-6 bg-border-muted" />
          <div className="flex flex-col">
            <span className="font-condensed text-[14px] font-bold text-white group-hover:text-accent transition-colors">{drop.title}</span>
            <span className="font-mono text-[9px] text-text-secondary">{drop.type}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// REELS PREVIEW ROW (keeping existing for now - will be updated separately)
const REEL_THUMBS = [
  { id: 'r1', thumb: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=200&q=80', author: 'Marcus' },
  { id: 'r2', thumb: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=200&q=80', author: 'Priya' },
  { id: 'r3', thumb: 'https://images.unsplash.com/photo-1487466365202-1afdb86c764e?w=200&q=80', author: 'Aisha' },
  { id: 'r4', thumb: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200&q=80', author: 'Zaid' },
];

const ReelsPreviewRow: React.FC<{ onOpenReels: () => void }> = ({ onOpenReels }) => (
  <div className="mb-5">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#CCFF00]">
          <path d="M9 12h6"></path>
          <path d="M12 9v6"></path>
          <path d="M4 21.58A2 2 0 0 1 2.41 20L6 16h12l3.59 5.58A2 2 0 0 1 22 19.58V5a2 2 0 0 0-2-2h-3l-.99-.01A2 2 0 0 0 16 4H8a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2z"></path>
        </svg>
        <span className="font-mono text-[10px] font-bold text-text-muted tracking-widest uppercase">REELS · HIGHLIGHTS</span>
      </div>
      <button
        onClick={onOpenReels}
        className="text-[#CCFF00] text-[11px] font-bold hover:underline"
      >
        See All
      </button>
    </div>
    <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
      {REEL_THUMBS.map((r, i) => (
        <button
          key={r.id}
          className="flex-shrink-0 relative w-24 h-36 rounded-xl overflow-hidden group"
          onClick={onOpenReels}
        >
          <img src={r.thumb} alt={r.author} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M8 5v14"></path>
                <path d="M12 9h4"></path>
              </svg>
            </div>
          </div>
          <span className="absolute bottom-1.5 left-2 text-white text-[10px] font-bold">{r.author}</span>
        </button>
      ))}
      {/* Open full reel feed tile */}
      <button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onOpenReels}
        className="flex-shrink-0 w-24 h-36 rounded-xl border-2 border-dashed border-border-muted flex flex-col items-center justify-center gap-1.5 text-text-muted hover:border-[#CCFF00]/50 hover:text-[#CCFF00] transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
          <path d="M9 12h6"></path>
          <path d="M12 9v6"></path>
          <path d="M4 21.58A2 2 0 0 1 2.41 20L6 16h12l3.59 5.58A2 2 0 0 1 22 19.58V5a2 2 0 0 0-2-2h-3l-.99-.01A2 2 0 0 0 16 4H8a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2z"></path>
        </svg>
        <span className="text-[9px] font-bold">View All</span>
      </button>
    </div>
  </div>
);

export const HomeFeed: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?.id;

  // Stories system (keep existing for now)
  const { myStories, othersGroups, addStory, markViewed } = useStories(currentUserId ?? '');
  const [activeStoryGroup, setActiveStoryGroup] = useState<any>(null);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [showStoryCreator, setShowStoryCreator] = useState(false);

  // Posts system - NEW: using useFeed hook
  const {
    posts, loading, hasMore, submitting,
    submitPost, likePost, deletePost,
    loadMore, refresh,
  } = useFeed();

  const [activeCategory, setActiveCategory] = useState('All');
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const handleOpenStoryViewer = (group: any, startIndex?: number) => {
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

      {/* ── STORY BAR (NEW) ───────────────────────────────────────────── */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
          <span className="font-mono text-[10px] font-bold text-text-muted tracking-widest uppercase">FLEX · STORIES</span>
        </div>
        <StoryBar
          currentUserId={currentUserId ?? ''}
          currentUserName={user?.name ?? 'You'}
          currentUserAvatar={user?.avatar ?? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
          myStories={myStories}
          othersGroups={othersGroups}
          onOpenViewer={handleOpenStoryViewer}
          onOpenCreator={() => setShowStoryCreator(true)}
        />
      </div>

      {/* ── REELS PREVIEW ROW (NEW) ───────────────────────────────────── */}
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
        {/* New social posts at the top - using real posts from API */}
        {posts.map((post) => (
          <PostCard
            key={post.$id}
            post={post}
            onLike={likePost}
            onDelete={deletePost}
          />
        ))}

        {/* Load More Indicator */}
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
      {/* ... keep existing story viewer portal ... */}
      {true && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          {activeStoryGroup && (
            <div className="relative w-full max-w-md">
              {/* Backdrop */}
              <div onClick={() => setActiveStoryGroup(null)}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
              />

              {/* Viewer Card */}
              <div className="relative z-10">
                <div className="bg-surface border border-border-muted rounded-2xl overflow-hidden shadow-xl max-h-[90vh] overflow-y-auto">
                  {/* Handle */}
                  <div className="w-4 h-0.5 bg-border-muted mx-auto my-2 rounded-full" />

                  {/* Viewer Content */}
                  <div className="p-4">
                    <StoryViewer
                      key={activeStoryGroup.author_id}
                      group={activeStoryGroup}
                      currentUserId={currentUserId ?? ''}
                      onClose={() => setActiveStoryGroup(null)}
                      onViewed={markViewed}
                      onNextGroup={activeGroupIndex < othersGroups.length - 1 ? handleNextGroup : undefined}
                      onPrevGroup={activeGroupIndex > 0 ? handlePrevGroup : undefined}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Story Creator */}
      {/* ... keep existing story creator portal ... */}
    </div>
  );
};