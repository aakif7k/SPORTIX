import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Share2, Bookmark, MoreHorizontal, Play, X, Image as ImageIcon, Video, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { MOCK_POSTS } from '../../services/mockData';
import type { Post } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { SportBadge } from '../../components/ui/Badge';
import { SkeletonCard } from '../../components/ui/index';


import { BadgeIcon } from '../../components/gamification/BadgeIcon';

const CATEGORIES = ['All', 'Training', 'Highlights', 'Achievements', 'Events'];

// ─── SVG ICONS ─────────────────────────────────────────────────────────────
const ThumbsUpOutline = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
  </svg>
);

const ThumbsUpSolid = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
  </svg>
);

// ─── UPCOMING DROPS ────────────────────────────────────────────────────────
const UPCOMING_DROPS = [
  { id: 1, title: 'Summer Championship', time: '14:00', type: 'Event' },
  { id: 2, title: 'Pro Training Tips', time: '16:30', type: 'Guide' },
  { id: 3, title: 'Top 10 Goals', time: '18:00', type: 'Highlight' },
];

const UpcomingDropsRow: React.FC = () => (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
      <span className="font-mono text-[10px] font-bold text-text-muted tracking-widest uppercase">UPCOMING · SCHEDULED DROPS</span>
    </div>
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
      {UPCOMING_DROPS.map((drop, i) => (
        <motion.div key={drop.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
          className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-[12px] cursor-pointer group"
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
        </motion.div>
      ))}
    </div>
  </div>
);

// ─── LOCAL STORIES DATA & INTERFACES ─────────────────────────────────────────
const LOCAL_MOCK_STORIES = [
  // User 1 (Marcus) has 3 stories
  { id: 's1-1', userId: 'u1', userName: 'Marcus', userAvatar: 'https://i.pravatar.cc/150?img=11', mediaUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80', timestamp: new Date(Date.now() - 30 * 60000).toISOString(), viewed: false },
  { id: 's1-2', userId: 'u1', userName: 'Marcus', userAvatar: 'https://i.pravatar.cc/150?img=11', mediaUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80', timestamp: new Date(Date.now() - 20 * 60000).toISOString(), viewed: false },
  { id: 's1-3', userId: 'u1', userName: 'Marcus', userAvatar: 'https://i.pravatar.cc/150?img=11', mediaUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&q=80', timestamp: new Date(Date.now() - 10 * 60000).toISOString(), viewed: false },
  
  // User 2 (Priya) has 2 stories
  { id: 's2-1', userId: 'u2', userName: 'Priya', userAvatar: 'https://i.pravatar.cc/150?img=47', mediaUrl: 'https://images.unsplash.com/photo-1547941126-3d5322b218b0?w=800&q=80', timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), viewed: false },
  { id: 's2-2', userId: 'u2', userName: 'Priya', userAvatar: 'https://i.pravatar.cc/150?img=47', mediaUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80', timestamp: new Date(Date.now() - 1 * 3600000).toISOString(), viewed: false },
  
  // User 3 (DeShawn) has 1 story
  { id: 's3-1', userId: 'u3', userName: 'DeShawn', userAvatar: 'https://i.pravatar.cc/150?img=52', mediaUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80', timestamp: new Date(Date.now() - 4 * 3600000).toISOString(), viewed: true },
  
  // User 4 (Isabela) has 2 stories
  { id: 's4-1', userId: 'u4', userName: 'Isabela', userAvatar: 'https://i.pravatar.cc/150?img=45', mediaUrl: 'https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?w=800&q=80', timestamp: new Date(Date.now() - 6 * 3600000).toISOString(), viewed: true },
  { id: 's4-2', userId: 'u4', userName: 'Isabela', userAvatar: 'https://i.pravatar.cc/150?img=45', mediaUrl: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a27?w=800&q=80', timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), viewed: true },
];

export interface GroupedStory {
  userId: string;
  userName: string;
  userAvatar: string;
  stories: typeof LOCAL_MOCK_STORIES;
  allViewed: boolean;
}

// ─── FLEX STORIES ──────────────────────────────────────────────────────────
const FlexStories: React.FC<{ onSelectUser: (user: GroupedStory) => void }> = ({ onSelectUser }) => {
  // Group stories by userId
  const grouped: GroupedStory[] = React.useMemo(() => {
    const map: Record<string, GroupedStory> = {};
    LOCAL_MOCK_STORIES.forEach((story) => {
      if (!map[story.userId]) {
        map[story.userId] = {
          userId: story.userId,
          userName: story.userName,
          userAvatar: story.userAvatar,
          stories: [],
          allViewed: true,
        };
      }
      map[story.userId].stories.push(story);
      if (!story.viewed) {
        map[story.userId].allViewed = false;
      }
    });
    return Object.values(map);
  }, []);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-[#00D4FF] animate-pulse" />
        <span className="font-mono text-[10px] font-bold text-text-muted tracking-widest uppercase">FLEX · STORIES</span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {/* Current User Add Flex */}
        <motion.div whileTap={{ scale: 0.95 }} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer">
          <div className="w-16 h-16 rounded-[16px] border-2 border-dashed border-border-muted flex items-center justify-center bg-white/5 hover:border-accent hover:text-accent transition-all text-text-muted">
            <span className="text-2xl leading-none">+</span>
          </div>
          <span className="font-mono text-[9px] text-text-muted">Your Flex</span>
        </motion.div>
        
        {/* Grouped Mock Stories */}
        {grouped.map((user, i) => (
          <motion.div 
            key={user.userId} 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: i * 0.1 }} 
            whileTap={{ scale: 0.95 }} 
            onClick={() => onSelectUser(user)}
            className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group"
          >
            <div className={`w-16 h-16 rounded-[16px] p-[2px] transition-all ${user.allViewed ? 'bg-border-muted' : 'bg-[#CCFF00] shadow-[0_0_12px_rgba(204,255,0,0.4)]'}`}>
              <div className="w-full h-full rounded-[14px] overflow-hidden border-[2px] border-base relative bg-base">
                <img src={user.userAvatar} alt={user.userName} className="w-full h-full object-cover" />

              </div>
            </div>
            <span className="font-mono text-[9px] text-white truncate w-16 text-center">{user.userName}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ─── STORY VIEWER MODAL ────────────────────────────────────────────────────
interface StoryViewerModalProps {
  groupedUser: GroupedStory;
  onClose: () => void;
  onNextUser?: () => void;
  onPrevUser?: () => void;
}

const StoryViewerModal: React.FC<StoryViewerModalProps> = ({ groupedUser, onClose, onNextUser, onPrevUser }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => p + 2);
    }, 100);

    return () => clearInterval(interval);
  }, [groupedUser, activeIdx]);

  useEffect(() => {
    if (progress >= 100) {
      if (activeIdx < groupedUser.stories.length - 1) {
        setActiveIdx((idx) => idx + 1);
        setProgress(0);
      } else {
        if (onNextUser) {
          onNextUser();
        } else {
          onClose();
        }
      }
    }
  }, [progress, activeIdx, groupedUser, onNextUser, onClose]);

  const currentStory = groupedUser.stories[activeIdx];

  const handleNext = () => {
    if (activeIdx < groupedUser.stories.length - 1) {
      setActiveIdx(activeIdx + 1);
      setProgress(0);
    } else if (onNextUser) {
      onNextUser();
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (activeIdx > 0) {
      setActiveIdx(activeIdx - 1);
      setProgress(0);
    } else if (onPrevUser) {
      onPrevUser();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md"
    >
      <div className="relative w-full max-w-md aspect-[9/16] bg-black md:rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between">
        
        {/* Top Progress Indicators */}
        <div className="absolute top-4 left-0 right-0 px-4 flex gap-1.5 z-20">
          {groupedUser.stories.map((_, i) => (
            <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent rounded-full transition-all duration-75"
                style={{
                  width: i < activeIdx ? '100%' : i === activeIdx ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* User Info Header */}
        <div className="absolute top-8 left-0 right-0 px-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <Avatar src={groupedUser.userAvatar} name={groupedUser.userName} size="sm" />
            <div>
              <span className="font-condensed font-bold text-sm text-white">{groupedUser.userName}</span>
              <span className="block font-mono text-[9px] text-text-muted mt-0.5">ACTIVE</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors text-white border border-white/10 flex items-center justify-center shadow-lg">
            <X size={16} />
          </button>
        </div>

        {/* Navigation Buttons */}
        <button 
          onClick={handlePrev} 
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white border border-white/10 z-30 transition-all hover:scale-105"
        >
          <ChevronLeft size={16} />
        </button>

        <button 
          onClick={handleNext} 
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white border border-white/10 z-30 transition-all hover:scale-105"
        >
          <ChevronRight size={16} />
        </button>

        {/* Story Media */}
        <div className="w-full h-full flex items-center justify-center relative bg-black/40">
          <img src={currentStory.mediaUrl} alt="Story" className="w-full h-full object-cover" />
          
          {/* Click areas for navigation (fallbacks) */}
          <div className="absolute inset-y-0 left-0 w-1/4 cursor-pointer" onClick={handlePrev} />
          <div className="absolute inset-y-0 right-0 w-1/4 cursor-pointer" onClick={handleNext} />
        </div>

        {/* Footer Reply Area */}
        <div className="absolute bottom-4 left-0 right-0 px-4 z-20 flex gap-2">
          <input 
            type="text" 
            placeholder={`Reply to ${groupedUser.userName}...`} 
            className="flex-1 bg-black/60 border border-white/10 rounded-full px-4 py-2 text-xs text-white placeholder-white/50 outline-none focus:border-accent"
          />
        </div>
      </div>
    </motion.div>
  );
};

// ─── POST COMPOSER MODAL ───────────────────────────────────────────────────
const PostComposerModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex justify-center md:items-center items-end bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full md:w-[600px] bg-base border border-border-muted rounded-t-[24px] md:rounded-[24px] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-[24px] tracking-wide text-white">CREATE DROP</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 transition-colors text-text-muted hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex gap-4">
            <Avatar src={user?.avatar || ''} name={user?.name || ''} size="md" />
            <div className="flex-1">
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="What's your latest play?"
                className="w-full bg-transparent border-none outline-none font-condensed text-[18px] text-white placeholder-text-muted resize-none h-24"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-border-muted mt-2">
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-accent/10 hover:text-accent transition-colors text-text-secondary">
                <ImageIcon size={18} />
              </button>
              <button className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-accent/10 hover:text-accent transition-colors text-text-secondary">
                <Video size={18} />
              </button>
              <button className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-accent/10 hover:text-accent transition-colors text-text-secondary">
                <CalendarIcon size={18} />
              </button>
            </div>
            <button
              onClick={() => { setContent(''); onClose(); }}
              disabled={!content.trim()}
              className="px-6 py-2.5 bg-accent text-black font-display text-[16px] tracking-wide rounded-full hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              DROP IT ⚡
            </button>
          </div>
        </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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

  // Mock comments
  const topComments = [
    { id: 1, user: 'Alex', text: 'Insane play right there! 🔥' },
    { id: 2, user: 'Sarah', text: 'What a move, keeping pushing.' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}
      className="hype-post-card rounded-[16px] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <Avatar src={post.author.avatar} name={post.author.name} sport={post.author.sport} isOnline={post.author.isOnline} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-condensed text-[16px] font-bold text-white truncate flex items-center gap-1.5">
              {post.author.name}
              <BadgeIcon level={post.author.level || 25} size={18} animate={false} />
            </span>
            {post.author.isVerified && <span className="w-3.5 h-3.5 bg-accent rounded-full flex items-center justify-center text-[8px] text-black font-bold flex-shrink-0">✓</span>}
          </div>
          <div className="flex items-center gap-2">
            <SportBadge sport={post.author.sport} size="sm" />
            <span className="text-[10px] font-mono text-text-muted">{timeAgo(post.timestamp)}</span>
          </div>
        </div>
        <button className="text-text-muted hover:text-accent transition-colors p-1 rounded"><MoreHorizontal size={16} /></button>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="font-condensed text-[15px] text-white/90 leading-relaxed">{post.content}</p>
      </div>

      {/* Media */}
      {post.mediaUrl && (
        <div className="relative mx-4 mb-3 rounded-xl overflow-hidden bg-[#0A0A0A] aspect-video">
          <img src={post.mediaUrl} alt="Post media" className="w-full h-full object-cover" />
          {post.mediaType === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="w-12 h-12 rounded-full bg-accent/90 flex items-center justify-center shadow-[0_0_20px_rgba(204,255,0,0.4)]">
                <Play size={20} className="text-black" fill="black" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Auto-open Comments Preview */}
      <div className="px-4 pb-2">
        <div className="hype-comments-container rounded-[8px] p-3 space-y-2">
          {topComments.map(c => (
            <div key={c.id} className="flex gap-2">
              <span className="font-condensed font-bold text-[13px] text-accent">{c.user}</span>
              <span className="font-condensed text-[13px] text-text-secondary">{c.text}</span>
            </div>
          ))}
          <button className="font-mono text-[10px] text-text-muted hover:text-white transition-colors">View all {post.reactions.comments.length} comments</button>
        </div>
      </div>

      {/* Reactions */}
      <div className="flex items-center gap-1 px-4 py-3 border-t border-border-muted/30">
        <motion.button
          whileTap={{ scale: 1.3 }}
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] transition-all font-mono ${liked ? 'text-accent bg-accent/10' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}
        >
          <motion.div animate={liked ? { scale: [1, 1.4, 1], rotate: [0, -15, 0] } : {}} transition={{ duration: 0.3 }}>
            {liked ? <ThumbsUpSolid /> : <ThumbsUpOutline />}
          </motion.div>
          <span className="text-[12px]">{likeCount.toLocaleString()}</span>
        </motion.button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-text-secondary hover:text-white hover:bg-white/5 transition-all font-mono">
          <MessageCircle size={16} />
          <span className="text-[12px]">{post.reactions.comments.length}</span>
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-text-secondary hover:text-white hover:bg-white/5 transition-all font-mono">
          <Share2 size={16} />
          <span className="text-[12px]">{post.reactions.shares}</span>
        </button>
        <div className="flex-1" />
        <motion.button whileTap={{ scale: 1.2 }} onClick={() => setSaved(s => !s)}
          className={`p-1.5 rounded-lg transition-all ${saved ? 'text-accent' : 'text-text-secondary hover:text-white'}`}>
          <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
        </motion.button>
      </div>
    </motion.div>
  );
};

// ─── HOME FEED ────────────────────────────────────────────────────────────
export const HomeFeed: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [activeStoryUser, setActiveStoryUser] = useState<GroupedStory | null>(null);

  // Helper for navigating between story users
  const groupedUsers: GroupedStory[] = React.useMemo(() => {
    const map: Record<string, GroupedStory> = {};
    LOCAL_MOCK_STORIES.forEach((story) => {
      if (!map[story.userId]) {
        map[story.userId] = {
          userId: story.userId,
          userName: story.userName,
          userAvatar: story.userAvatar,
          stories: [],
          allViewed: true,
        };
      }
      map[story.userId].stories.push(story);
    });
    return Object.values(map);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setPosts(MOCK_POSTS); setIsLoading(false); }, 800);
    return () => clearTimeout(t);
  }, []);

  const filtered = activeCategory === 'All' ? posts : posts.filter(p => p.category === activeCategory.toLowerCase());

  return (
    <div className="max-w-2xl mx-auto relative px-4 md:px-0 pb-20 md:pb-8">
      
      {/* Header with Compose Button */}
      <div className="flex justify-between items-center mb-6 pt-2">
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

      {/* Flex Stories */}
      <FlexStories onSelectUser={setActiveStoryUser} />

      {/* Filter Bar */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map(cat => (
          <motion.button key={cat} whileTap={{ scale: 0.96 }}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-mono transition-all ${activeCategory === cat ? 'bg-accent text-black font-bold shadow-[0_0_15px_rgba(204,255,0,0.3)]' : 'bg-surface border border-border-muted text-text-secondary hover:border-accent/50 hover:text-white'}`}>
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
          <div className="h-px flex-1 bg-[rgba(255,255,255,0.05)]" />
          <span className="text-xs font-mono text-text-muted">You're all caught up on HypeZone ⚡</span>
          <div className="h-px flex-1 bg-[rgba(255,255,255,0.05)]" />
        </div>
      )}

      {/* Composer Modal */}
      {createPortal(
        <PostComposerModal isOpen={isComposerOpen} onClose={() => setIsComposerOpen(false)} />,
        document.body
      )}

      {/* Story Viewer Modal */}
      {createPortal(
        <AnimatePresence>
          {activeStoryUser && (
            <StoryViewerModal 
              key={activeStoryUser.userId}
              groupedUser={activeStoryUser} 
              onClose={() => setActiveStoryUser(null)}
              onNextUser={() => {
                const idx = groupedUsers.findIndex(u => u.userId === activeStoryUser.userId);
                if (idx < groupedUsers.length - 1) {
                  setActiveStoryUser(groupedUsers[idx + 1]);
                } else {
                  setActiveStoryUser(null);
                }
              }}
              onPrevUser={() => {
                const idx = groupedUsers.findIndex(u => u.userId === activeStoryUser.userId);
                if (idx > 0) {
                  setActiveStoryUser(groupedUsers[idx - 1]);
                }
              }}
            />
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
