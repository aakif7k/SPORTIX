import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, MessageCircle, Share2, Bookmark,
  MoreHorizontal, MapPin, ChevronLeft, ChevronRight, Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SportBadge } from '../ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { CommentsModal } from './CommentsModal';
import toast from 'react-hot-toast';

interface PostCardProps {
  post: any;
  onLike: (postId: string, currentlyLiked: boolean) => void;
  onDelete?: (postId: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTimeAgo(iso: string): string {
  if (!iso) return 'just now';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatCount(n: number = 0): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

// ─── Avatar with initials fallback ───────────────────────────────────────────
const AuthorAvatar: React.FC<{ avatarUrl: string | null; name: string; size?: number }> = ({
  avatarUrl, name, size = 36,
}) => {
  const [imgError, setImgError] = useState(false);
  const initial = (name || '?').charAt(0).toUpperCase();

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover border border-border-muted"
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center bg-accent/15 border border-accent/30 flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <span className="text-accent font-bold leading-none" style={{ fontSize: size * 0.45 }}>
        {initial}
      </span>
    </div>
  );
};

// ─── Media Grid ───────────────────────────────────────────────────────────────
const MediaGrid: React.FC<{ urls: string[]; type: string }> = ({ urls, type }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!urls || urls.length === 0 || type === 'none') return null;

  if (type === 'video') {
    return (
      <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-border-muted">
        <video src={urls[0]} className="w-full h-full object-contain" controls muted playsInline />
      </div>
    );
  }

  if (urls.length === 1) {
    return (
      <div className="rounded-xl overflow-hidden border border-border-muted">
        <img src={urls[0]} alt="Post media" className="w-full max-h-96 object-cover" />
      </div>
    );
  }

  if (urls.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden border border-border-muted">
        {urls.map((url, i) => (
          <img key={i} src={url} alt={`Media ${i + 1}`} className="w-full h-44 object-cover" />
        ))}
      </div>
    );
  }

  if (urls.length === 3) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden border border-border-muted">
        <img src={urls[0]} alt="Media 1" className="row-span-2 w-full h-56 object-cover" />
        <img src={urls[1]} alt="Media 2" className="w-full h-28 object-cover" />
        <img src={urls[2]} alt="Media 3" className="w-full h-28 object-cover" />
      </div>
    );
  }

  // 4+ images — carousel
  return (
    <div className="relative rounded-xl overflow-hidden border border-border-muted">
      <img src={urls[activeIndex]} alt={`Media ${activeIndex + 1}`} className="w-full max-h-80 object-cover" />
      {activeIndex > 0 && (
        <button
          onClick={() => setActiveIndex(i => i - 1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white"
        >
          <ChevronLeft size={14} />
        </button>
      )}
      {activeIndex < urls.length - 1 && (
        <button
          onClick={() => setActiveIndex(i => i + 1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white"
        >
          <ChevronRight size={14} />
        </button>
      )}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {urls.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${i === activeIndex ? 'bg-white' : 'bg-white/40'}`}
          />
        ))}
      </div>
      <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 rounded-full text-white text-[10px] font-mono">
        {activeIndex + 1}/{urls.length}
      </div>
    </div>
  );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
const DeleteConfirm: React.FC<{ onConfirm: () => void; onCancel: () => void }> = ({ onConfirm, onCancel }) => (
  <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 rounded-2xl">
    <p className="text-white font-semibold text-[14px]">Delete this post?</p>
    <p className="text-text-secondary text-[12px]">This cannot be undone.</p>
    <div className="flex gap-3">
      <button
        onClick={onCancel}
        className="px-4 py-2 rounded-xl border border-border-muted text-text-secondary text-[13px] hover:text-white transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        className="px-4 py-2 rounded-xl bg-red-500 text-white text-[13px] font-semibold hover:bg-red-600 transition-colors"
      >
        Delete
      </button>
    </div>
  </div>
);

// ─── Post Card ────────────────────────────────────────────────────────────────
export const PostCard: React.FC<PostCardProps> = ({ post, onLike, onDelete }) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const postId = post.$id || post.id;
  const authorId = post.author_id || post.user_id || (post as any).userId || post.author?.id || (post.author as any)?.$id;
  const authorName = post.author_full_name || post.author?.full_name || 'SportiX Athlete';
  const authorUsername = post.author_username || post.author?.username || 'athlete';
  const authorSport = post.sport_tag || post.author_sport || post.author?.sport || '';
  const authorAvatar = post.author_avatar_url || post.author?.avatar_url || null;

  const [saved, setSaved] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);

  const isOwnPost = authorId === currentUser?.id;

  const handleShare = async () => {
    const postUrl = `${window.location.origin}/app/feed?post=${postId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `SportiX Post by ${authorName}`,
          text: post.content,
          url: postUrl,
        });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(postUrl);
    toast.success('Post link copied to clipboard!');
  };

  const handleToggleSave = () => {
    setSaved(prev => {
      const next = !prev;
      toast.success(next ? 'Post saved to bookmarks!' : 'Removed from bookmarks');
      return next;
    });
  };

  return (
    <motion.div
      layout
      className="relative bg-surface border border-border-muted rounded-2xl overflow-hidden"
    >
      {/* Delete confirm overlay */}
      <AnimatePresence>
        {showDelete && (
          <DeleteConfirm
            onConfirm={() => { onDelete?.(postId); setShowDelete(false); }}
            onCancel={() => setShowDelete(false)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div 
          onClick={() => authorId && navigate(`/app/profile/${authorId}`)}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <AuthorAvatar avatarUrl={authorAvatar} name={authorName} size={36} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-text-primary font-bold text-[13px] leading-tight group-hover:text-accent transition-colors">
                {authorName}
              </span>
              {authorSport && <SportBadge sport={authorSport as any} size="sm" />}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 font-mono text-[10px] text-text-muted">
              <span className="text-accent font-medium">@{authorUsername}</span>
              <span>•</span>
              {post.location_tag && (
                <>
                  <div className="flex items-center gap-0.5">
                    <MapPin size={9} />
                    <span>{post.location_tag}</span>
                  </div>
                  <span>•</span>
                </>
              )}
              <span>{formatTimeAgo(post.created_at || post.$createdAt)}</span>
            </div>
          </div>
        </div>

        {/* More / Delete */}
        <div className="relative">
          <button
            onClick={() => setShowMore(m => !m)}
            className="text-text-muted hover:text-text-primary p-1 transition-colors"
          >
            <MoreHorizontal size={16} />
          </button>
          <AnimatePresence>
            {showMore && isOwnPost && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                className="absolute right-0 top-8 z-20 bg-elevated border border-border-muted rounded-xl shadow-xl overflow-hidden min-w-[120px]"
              >
                <button
                  onClick={() => { setShowMore(false); setShowDelete(true); }}
                  className="flex items-center gap-2 px-3 py-2.5 text-red-400 hover:bg-red-500/10 text-[13px] w-full transition-colors font-mono"
                >
                  <Trash2 size={13} />
                  Delete post
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-text-primary text-[13px] leading-relaxed whitespace-pre-wrap font-sans">{post.content}</p>
        </div>
      )}

      {/* Media */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div className="px-4 pb-3">
          <MediaGrid urls={post.media_urls} type={post.media_type || 'image'} />
        </div>
      )}

      {/* Sport tag */}
      {post.sport_tag && (
        <div className="px-4 pb-3">
          <span className="text-accent text-[12px] font-mono font-bold">#{post.sport_tag}</span>
        </div>
      )}

      {/* Divider */}
      <div className="mx-4 border-t border-border-muted" />

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => onLike(postId, post.is_liked ?? false)}
            className={`flex items-center gap-1.5 text-[12px] font-mono font-semibold transition-colors
              ${post.is_liked ? 'text-red-500' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <Heart size={16} className={post.is_liked ? 'fill-red-500 text-red-500' : ''} />
            <span>{formatCount(post.likes_count)}</span>
          </motion.button>

          <button
            onClick={() => setShowComments(true)}
            className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-[12px] font-mono font-semibold transition-colors"
          >
            <MessageCircle size={16} />
            <span>{formatCount(commentsCount)}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-[12px] font-mono font-semibold transition-colors"
            title="Share post"
          >
            <Share2 size={16} />
          </button>
        </div>

        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleToggleSave}
          className={`transition-colors ${saved ? 'text-accent' : 'text-text-secondary hover:text-text-primary'}`}
          title="Save post"
        >
          <Bookmark size={16} className={saved ? 'fill-accent' : ''} />
        </motion.button>
      </div>

      {/* Real Comments Modal */}
      {showComments && (
        <CommentsModal
          postId={postId}
          onClose={() => setShowComments(false)}
          onCommentAdded={() => setCommentsCount((c: number) => c + 1)}
        />
      )}
    </motion.div>
  );
};
