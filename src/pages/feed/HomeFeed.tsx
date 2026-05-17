import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Filter, Play } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { MOCK_POSTS, MOCK_STORIES, SPORT_CATEGORIES } from '../../services/mockData';
import type { Post, Story } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { SportBadge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Skeleton, SkeletonCard } from '../../components/ui/index';

const CATEGORIES = ['All', 'Training', 'Highlights', 'Achievements', 'Events'];

// ─── FLEX (Story Row) ──────────────────────────────────────────────────────
const StoriesRow: React.FC = () => {
  const stories = MOCK_STORIES;
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
      {/* Add Story */}
      <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
        <div className="w-14 h-14 rounded-full border-2 border-dashed border-border-muted flex items-center justify-center bg-elevated cursor-pointer hover:border-volt/40 transition-all">
          <span className="text-volt text-xl font-thin">+</span>
        </div>
        <span className="text-[10px] font-label text-text-secondary">Your FLEX</span>
      </div>
      {stories.map((story, i) => {
        const sportData = SPORT_CATEGORIES.find(s => s.id === story.userSport);
        return (
          <motion.div key={story.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer">
            <div className="relative w-14 h-14 rounded-full p-0.5" style={{ background: story.viewed ? '#2A2A2A' : `linear-gradient(135deg, ${sportData?.color || '#CCFF00'}, #080808)` }}>
              <img src={story.userAvatar} alt={story.userName} className="w-full h-full rounded-full object-cover border-2 border-base" />
            </div>
            <span className="text-[10px] font-label text-text-secondary truncate w-14 text-center">{story.userName}</span>
          </motion.div>
        );
      })}
    </div>
  );
};

// ─── POST CARD ─────────────────────────────────────────────────────────────
const PostCard: React.FC<{ post: Post; index: number }> = ({ post, index }) => {
  const { user } = useAuthStore();
  const [liked, setLiked] = useState(user ? post.reactions.likes.includes(user.id) : false);
  const [likeCount, setLikeCount] = useState(post.reactions.likes.length);
  const [saved, setSaved] = useState(user ? post.reactions.saves.includes(user.id) : false);

  const handleLike = () => {
    setLiked(l => !l);
    setLikeCount(c => liked ? c - 1 : c + 1);
  };

  const timeAgo = (ts: string) => {
    const d = (Date.now() - new Date(ts).getTime()) / 1000;
    if (d < 3600) return `${Math.floor(d / 60)}m ago`;
    if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
    return `${Math.floor(d / 86400)}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}
      className="glass rounded-xl overflow-hidden hover:border-volt/15 transition-all duration-200 border border-transparent"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <Avatar src={post.author.avatar} name={post.author.name} sport={post.author.sport} isOnline={post.author.isOnline} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-label text-sm font-semibold text-white truncate">{post.author.name}</p>
            {post.author.isVerified && <span className="w-4 h-4 bg-volt rounded-full flex items-center justify-center text-[9px] text-black font-bold flex-shrink-0">✓</span>}
          </div>
          <div className="flex items-center gap-2">
            <SportBadge sport={post.author.sport} size="sm" />
            <span className="text-[10px] font-mono text-text-muted">{timeAgo(post.timestamp)}</span>
          </div>
        </div>
        <button className="text-text-muted hover:text-volt transition-colors p-1 rounded"><MoreHorizontal size={16} /></button>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="font-label text-sm text-white/90 leading-relaxed">{post.content}</p>
      </div>

      {/* Media */}
      {post.mediaUrl && (
        <div className="relative mx-4 mb-3 rounded-xl overflow-hidden bg-elevated aspect-video">
          <img src={post.mediaUrl} alt="Post media" className="w-full h-full object-cover" />
          {post.mediaType === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="w-12 h-12 rounded-full bg-volt/90 flex items-center justify-center shadow-glow-volt"><Play size={20} className="text-black" fill="black" /></div>
            </div>
          )}
        </div>
      )}

      {/* Reactions */}
      <div className="flex items-center gap-1 px-4 py-3 border-t border-border-muted/50">
        <motion.button
          whileTap={{ scale: 1.3 }}
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-sm font-label ${liked ? 'text-volt bg-volt/10' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}
        >
          <motion.div animate={liked ? { scale: [1, 1.4, 1] } : {}} transition={{ duration: 0.3 }}>
            <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
          </motion.div>
          <span className="font-mono text-xs">{likeCount.toLocaleString()}</span>
        </motion.button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-text-secondary hover:text-white hover:bg-white/5 transition-all text-sm font-label">
          <MessageCircle size={15} />
          <span className="font-mono text-xs">{post.reactions.comments.length}</span>
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-text-secondary hover:text-white hover:bg-white/5 transition-all text-sm font-label">
          <Share2 size={15} />
          <span className="font-mono text-xs">{post.reactions.shares}</span>
        </button>
        <div className="flex-1" />
        <motion.button whileTap={{ scale: 1.2 }} onClick={() => setSaved(s => !s)}
          className={`p-1.5 rounded-lg transition-all ${saved ? 'text-volt' : 'text-text-secondary hover:text-white'}`}>
          <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} />
        </motion.button>
      </div>
    </motion.div>
  );
};

// ─── HYPEZONE FEED ────────────────────────────────────────────────────────
export const HomeFeed: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const t = setTimeout(() => { setPosts(MOCK_POSTS); setIsLoading(false); }, 800);
    return () => clearTimeout(t);
  }, []);

  const filtered = activeCategory === 'All' ? posts : posts.filter(p => p.category === activeCategory.toLowerCase());

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* FLEX Row */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-label font-semibold text-volt tracking-widest uppercase">⚡ FLEX</span>
        </div>
        <StoriesRow />
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map(cat => (
          <motion.button key={cat} whileTap={{ scale: 0.96 }}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-label font-medium transition-all ${activeCategory === cat ? 'bg-volt text-black shadow-glow-volt-sm' : 'bg-elevated border border-border-muted text-text-secondary hover:border-volt/30 hover:text-white'}`}>
            {cat}
          </motion.button>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.map((post, i) => <PostCard key={post.id} post={post} index={i} />)}
          </AnimatePresence>
        )}
      </div>

      {/* Load More Indicator */}
      {!isLoading && (
        <div className="flex items-center justify-center py-6 gap-3">
          <div className="h-px flex-1 bg-border-muted" />
          <span className="text-xs font-mono text-text-muted">You're all caught up on HypeZone ⚡</span>
          <div className="h-px flex-1 bg-border-muted" />
        </div>
      )}
    </div>
  );
};
