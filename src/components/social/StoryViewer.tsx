import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Eye, Send, Pause, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DbStoryGroup, DbStory } from '../../services/socialService';


const StoryAuthorAvatar: React.FC<{ url: string | null; name: string }> = ({ url, name }) => {
  const [err, setErr] = React.useState(false);
  const init = (name || '?').charAt(0).toUpperCase();
  if (url && !err) return <img src={url} alt={name} onError={() => setErr(true)} className="w-8 h-8 rounded-full border border-white/30 object-cover" />;
  return <div className="w-8 h-8 rounded-full border border-white/30 bg-[#1A2200] flex items-center justify-center"><span className="text-[#CCFF00] font-bold text-sm">{init}</span></div>;
};

const STORY_DURATION_MS = 5000;

// Module-level helper: reads the clock, so it must not be called from a
// component body during render.
const formatTimeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ago`;
  return `${m}m ago`;
};

interface StoryViewerProps {
  group: DbStoryGroup;
  currentUserId: string;
  onClose: () => void;
  onViewed: (storyId: string) => void;
  onNextGroup?: () => void;
  onPrevGroup?: () => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
  group,
  currentUserId,
  onClose,
  onViewed,
  onNextGroup,
  onPrevGroup,
}) => {
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentStory: DbStory = group.stories[storyIndex];
  const isOwnStory = group.author_id === currentUserId;
  const totalStories = group.stories.length;

  const goNext = useCallback(() => {
    if (storyIndex < totalStories - 1) {
      setStoryIndex(i => i + 1);
      setProgress(0);
    } else {
      // `onNextGroup?.() ?? onClose()` also closed the viewer on every advance,
      // because a void call evaluates to undefined and fell through to `??`.
      if (onNextGroup) onNextGroup();
      else onClose();
    }
  }, [storyIndex, totalStories, onNextGroup, onClose]);

  const goPrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex(i => i - 1);
      setProgress(0);
    } else {
      onPrevGroup?.();
    }
  }, [storyIndex, onPrevGroup]);

  // Mark viewed
  useEffect(() => {
    if (currentStory) {
      onViewed(currentStory.id);
    }
  }, [currentStory?.id]);

  // Progress timer
  useEffect(() => {
    if (paused) return;
    setProgress(0);
    const step = 100 / (STORY_DURATION_MS / 50);
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(intervalRef.current!);
          goNext();
          return 100;
        }
        return p + step;
      });
    }, 50);
    return () => clearInterval(intervalRef.current!);
  }, [storyIndex, paused]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft') goPrev();
    if (e.key === 'Escape') onClose();
  }, [goNext, goPrev, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black flex items-center justify-center"
        onClick={onClose}
      >
        {/* Story container — 9:16 aspect */}
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          className="relative w-full max-w-sm h-[100dvh] sm:h-[92vh] sm:rounded-2xl overflow-hidden bg-black"
          onClick={e => e.stopPropagation()}
          onMouseDown={() => setPaused(true)}
          onMouseUp={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          {/* Media */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStory?.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0"
            >
              {currentStory?.media_type === 'video' ? (
                <video
                  src={currentStory.media_url}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={currentStory?.media_url}
                  alt="Story"
                  className="w-full h-full object-cover"
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60 pointer-events-none" />

          {/* Progress bars */}
          <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
            {group.stories.map((_, i) => (
              <div key={i} className="flex-1 h-[2.5px] bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-none"
                  style={{
                    width: i < storyIndex ? '100%' : i === storyIndex ? `${progress}%` : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-8 left-3 right-3 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <StoryAuthorAvatar url={group.author_avatar} name={group.author_name} />
              <div>
                <div className="text-white font-semibold text-[13px] leading-tight">{group.author_name}</div>
                <div className="text-white/60 text-[11px]">{currentStory && formatTimeAgo(currentStory.created_at)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaused(p => !p)}
                className="text-white/80 hover:text-white p-1"
              >
                {paused ? <Play size={16} /> : <Pause size={16} />}
              </button>
              <button onClick={onClose} className="text-white/80 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Caption + sport tag */}
          <div className="absolute bottom-20 left-4 right-4 z-10">
            {currentStory?.sport_tag && (
              <span className="inline-block px-2 py-0.5 bg-[#CCFF00]/20 border border-[#CCFF00]/40 text-[#CCFF00] text-[10px] font-bold rounded-full mb-2">
                {currentStory.sport_tag}
              </span>
            )}
            {currentStory?.caption && (
              <p className="text-white text-[13px] font-medium leading-snug drop-shadow-md">
                {currentStory.caption}
              </p>
            )}
          </div>

          {/* Bottom — reply or view count */}
          <div className="absolute bottom-4 left-4 right-4 z-10">
            {isOwnStory ? (
              <div className="flex items-center gap-2 text-white/70 text-[12px]">
                <Eye size={14} />
                <span>{currentStory?.view_count || 0} views</span>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Reply to story..."
                  className="flex-1 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-2 text-white text-[13px] placeholder:text-white/40 outline-none focus:border-white/50"
                  onClick={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                />
                <button
                  onClick={e => { e.stopPropagation(); setReplyText(''); }}
                  className="w-9 h-9 rounded-full bg-[#CCFF00] flex items-center justify-center"
                >
                  <Send size={14} className="text-black" />
                </button>
              </div>
            )}
          </div>

          {/* Nav tap zones */}
          <button
            className="absolute left-0 top-0 w-1/3 h-full z-20 focus:outline-none"
            onClick={e => { e.stopPropagation(); goPrev(); }}
          />
          <button
            className="absolute right-0 top-0 w-1/3 h-full z-20 focus:outline-none"
            onClick={e => { e.stopPropagation(); goNext(); }}
          />

          {/* Prev / Next arrows */}
          {onPrevGroup && (
            <div className="absolute left-[-44px] top-1/2 -translate-y-1/2 z-30">
              <button
                onClick={e => { e.stopPropagation(); onPrevGroup(); }}
                className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
          )}
          {onNextGroup && (
            <div className="absolute right-[-44px] top-1/2 -translate-y-1/2 z-30">
              <button
                onClick={e => { e.stopPropagation(); onNextGroup(); }}
                className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
