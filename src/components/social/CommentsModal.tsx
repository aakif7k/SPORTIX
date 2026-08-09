import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { fetchPostComments, addPostComment } from '@/services/hypezoneService';
import type { PostComment } from '@/services/hypezoneService';
import toast from 'react-hot-toast';

interface CommentsModalProps {
  postId: string;
  onClose: () => void;
  onCommentAdded?: () => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({ postId, onClose, onCommentAdded }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchPostComments(postId)
      .then(res => {
        if (mounted) setComments(res);
      })

      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [postId]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to comment.');
      return;
    }
    if (!text.trim() || submitting) return;

    const uAny = user as any;
    setSubmitting(true);
    try {
      const newComment = await addPostComment({
        postId,
        authorId: user.id,
        authorUsername: uAny.user_metadata?.username || uAny.username || user.email?.split('@')[0] || 'athlete',
        authorName: uAny.user_metadata?.full_name || uAny.name || uAny.full_name || 'SportiX Athlete',
        authorAvatarUrl: uAny.user_metadata?.avatar_url || uAny.avatar_url || null,
        content: text.trim(),
      });

      setComments(prev => [...prev, newComment]);
      setText('');
      onCommentAdded?.();
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err: any) {
      toast.error(err.message || 'Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          className="bg-surface border border-border-muted rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg overflow-hidden h-[80vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border-muted">
            <h3 className="font-display font-bold text-text-primary text-[15px] flex items-center gap-2">
              <MessageCircle size={18} className="text-accent" /> Comments ({comments.length})
            </h3>
            <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1">
              <X size={18} />
            </button>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading && (
              <div className="flex flex-col items-center justify-center py-12 space-y-2">
                <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                <span className="font-mono text-xs text-text-muted">Loading discussion...</span>
              </div>
            )}

            {!loading && comments.length === 0 && (
              <div className="text-center py-12 space-y-2">
                <MessageCircle size={32} className="mx-auto text-text-muted opacity-40" />
                <p className="font-sans font-bold text-xs text-text-primary">No comments yet</p>
                <p className="font-mono text-[11px] text-text-muted">Be the first athlete to drop a comment!</p>
              </div>
            )}

            {!loading && comments.map(c => (
              <div key={c.$id} className="flex items-start gap-3 p-3 rounded-xl bg-elevated border border-border-muted">
                <img
                  src={c.author_avatar_url || `https://i.pravatar.cc/100?u=${c.author_id}`}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover border border-border-muted flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-xs text-text-primary truncate">{c.author_name}</p>
                    <span className="font-mono text-[10px] text-text-muted">{timeAgo(c.created_at)}</span>
                  </div>
                  <p className="font-mono text-[10px] text-accent">@{c.author_username}</p>
                  <p className="font-sans text-xs text-text-primary mt-1 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 border-t border-border-muted bg-surface flex items-center gap-2">
            <input
              type="text"
              placeholder="Write a comment..."
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="flex-1 px-4 py-2.5 rounded-xl bg-elevated border border-border-muted text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent font-mono"
            />
            <button
              onClick={handleSubmit}
              disabled={!text.trim() || submitting}
              className="p-2.5 rounded-xl bg-accent text-volt-text font-bold disabled:opacity-40 transition"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
