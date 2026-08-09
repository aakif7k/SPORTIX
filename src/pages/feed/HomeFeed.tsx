import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Compass, Users, Sparkles, Plus, Calendar, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFeed } from '@/hooks/useFeed';
import { PostComposer } from '@/components/social/PostComposer';
import { PostCard } from '@/components/social/PostCard';
import { getEvents } from '@/services/eventService';
import type { Event } from '@/types';

const CATEGORIES = ['All', 'Training', 'Highlights', 'Achievements', 'Events'];

const UpcomingDropsRow: React.FC = () => {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getEvents()
      .then(events => {
        setUpcomingEvents(events.slice(0, 4));
      })
      .catch(() => {});
  }, []);

  if (upcomingEvents.length === 0) return null;

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <span className="font-mono text-[10px] font-bold text-text-muted tracking-widest uppercase">
          LIVE TOURNAMENTS & UPCOMING DROPS
        </span>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
        {upcomingEvents.map(evt => (
          <div
            key={evt.id}
            onClick={() => navigate(`/app/events/${evt.id}`)}
            className="flex-shrink-0 bg-surface border border-border-muted hover:border-accent/40 rounded-2xl px-3.5 py-2 flex items-center gap-3 text-xs cursor-pointer transition-all shadow-sm"
          >
            <div className="w-7 h-7 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
              <Calendar size={14} />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-[11px] leading-tight truncate max-w-[140px]">
                {evt.title}
              </p>
              <p className="font-mono text-[9px] text-text-muted">
                {evt.sport} · {(evt as any).current_participants || (evt as any).participantsCount || 0} Joined
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PostSkeleton: React.FC = () => (
  <div className="p-5 rounded-2xl bg-surface border border-border-muted space-y-4 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-elevated" />
      <div className="space-y-1.5 flex-1">
        <div className="w-28 h-3.5 rounded bg-elevated" />
        <div className="w-16 h-2.5 rounded bg-elevated" />
      </div>
    </div>
    <div className="w-full h-16 rounded-xl bg-elevated" />
    <div className="flex justify-between pt-2 border-t border-border-muted">
      <div className="w-16 h-4 rounded bg-elevated" />
      <div className="w-16 h-4 rounded bg-elevated" />
    </div>
  </div>
);

export const HomeFeed: React.FC = () => {
  const { user } = useAuth();
  const [feedType, setFeedType] = useState<'explore' | 'following'>('explore');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  const {
    posts,
    loading,
    hasMore,
    submitting,
    submitPost,
    likePost,
    deletePost,
    loadMore,
  } = useFeed({
    post_type: activeCategory,
    feed_type: feedType,
  });

  // Seamless Infinite Doom Scrolling IntersectionObserver
  useEffect(() => {
    if (!hasMore || loading) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { rootMargin: '350px' }
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  return (
    <div className="max-w-2xl mx-auto relative px-4 md:px-0 pb-20 md:pb-8 text-text-primary space-y-5">

      {/* Header & Main Feed Navigation Tabs */}
      <div className="pt-2 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="font-display text-[26px] md:text-[32px] text-text-primary tracking-wider flex items-center gap-2">
            <Flame className="text-accent" size={32} /> HYPEZONE
          </h1>
          <button
            onClick={() => setIsComposerOpen(true)}
            className="btn-primary flex items-center gap-2 rounded-full !h-[36px] md:!h-[40px] text-xs md:text-sm px-4 shadow-md"
          >
            ⚡ Drop a Post
          </button>
        </div>

        {/* Following vs Explore Feed Selector */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-surface border border-border-muted">
          <button
            onClick={() => setFeedType('explore')}
            className={`py-2 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              feedType === 'explore'
                ? 'bg-accent text-volt-text shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Compass size={15} /> Community Explore
          </button>
          <button
            onClick={() => setFeedType('following')}
            className={`py-2 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              feedType === 'following'
                ? 'bg-accent text-volt-text shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Users size={15} /> Following Feed
          </button>
        </div>
      </div>

      {/* Upcoming Drops / Events */}
      <UpcomingDropsRow />

      {/* Filter Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-mono transition-all ${
              activeCategory === cat
                ? 'bg-accent text-volt-text font-bold shadow-md'
                : 'bg-surface border border-border-muted text-text-secondary hover:border-accent/50 hover:text-text-primary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Posts Feed Container */}
      <div className="space-y-4">
        {loading && posts.length === 0 && (
          <div className="space-y-4">
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="p-8 sm:p-12 rounded-3xl bg-surface border border-border-muted text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-accent/10 border border-accent/30 mx-auto flex items-center justify-center text-accent">
              <Sparkles size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="font-sans font-bold text-base text-text-primary uppercase tracking-wider">
                {feedType === 'following' ? 'No Following Posts Yet' : 'No HypeZone Posts Yet'}
              </h3>
              <p className="font-mono text-xs text-text-muted max-w-sm mx-auto">
                {feedType === 'following'
                  ? 'Follow elite athletes in Discover to see their tactical posts and highlights here!'
                  : 'Be the first athlete to publish a training session, tournament highlight, or squad achievement.'}
              </p>
            </div>
            <button
              onClick={() => setIsComposerOpen(true)}
              className="px-6 py-2.5 rounded-xl bg-accent text-volt-text font-mono font-bold text-xs uppercase tracking-wider shadow-md inline-flex items-center gap-2"
            >
              <Plus size={16} /> Drop the First Post
            </button>
          </div>
        )}

        {posts.map(post => (
          <PostCard
            key={post.$id}
            post={post}
            onLike={likePost}
            onDelete={deletePost}
          />
        ))}

        {/* Infinite Scroll Sentinel */}
        <div ref={observerRef} className="h-4 w-full" />

        {/* Infinite Scroll Loading Indicator */}
        {loading && posts.length > 0 && (
          <div className="flex items-center justify-center py-6 space-x-2 text-text-muted font-mono text-xs">
            <Loader2 size={16} className="animate-spin text-accent" />
            <span>Fetching more tactical posts...</span>
          </div>
        )}

        {/* End of Feed Badge */}
        {!hasMore && posts.length > 0 && (
          <div className="flex items-center justify-center py-8 space-x-2 text-text-muted font-mono text-xs">
            <CheckCircle2 size={16} className="text-accent" />
            <span className="uppercase tracking-wider">You're all caught up! 🔥</span>
          </div>
        )}
      </div>

      {/* Post Composer Portal Modal */}
      {isComposerOpen && user && (
        <PostComposer
          onSubmit={async payload => {
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