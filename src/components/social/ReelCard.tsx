import React, { useRef, useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Music, Volume2, VolumeX, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import type { DbReel } from '../../services/socialService';

const ReelAvatar: React.FC<{ url: string | null; name: string }> = ({ url, name }) => {
  const [err, setErr] = React.useState(false);
  const init = (name || '?').charAt(0).toUpperCase();
  if (url && !err) return <img src={url} alt={name} onError={() => setErr(true)} className="w-9 h-9 rounded-full border-2 border-white/50 object-cover" />;
  return <div className="w-9 h-9 rounded-full border-2 border-white/50 bg-[#1A2200] flex items-center justify-center flex-shrink-0"><span className="text-[#CCFF00] font-bold text-sm">{init}</span></div>;
};

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

interface ReelCardProps {
  reel: DbReel;
  isActive: boolean;
  onLike: (reelId: string, currentlyLiked: boolean) => void;
  onView: (reelId: string) => void;
}

export const ReelCard: React.FC<ReelCardProps> = ({
  reel,
  isActive,
  onLike,
  onView,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [saved, setSaved] = useState(false);

  // Use DB-driven state
  const liked = reel.is_liked ?? false;
  const likeCount = reel.likes_count;
  const authorName = reel.author?.full_name || 'Unknown';
  const authorSport = reel.author?.sport || '';
  const authorAvatar = reel.author?.avatar_url || null;

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.play().catch(() => {});
      onView(reel.id);
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isActive, reel.id]);

  const handleLike = () => {
    onLike(reel.id, liked);
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden snap-start">
      {/* Video / Image fallback */}
      {reel.video_url ? (
        <video
          ref={videoRef}
          src={reel.video_url}
          className="w-full h-full object-cover"
          loop
          muted={muted}
          playsInline
          preload="auto"
        />
      ) : (
        <img
          src={reel.thumbnail_url || undefined}
          alt="Reel"
          className="w-full h-full object-cover"
        />
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 pointer-events-none" />

      {/* Mute toggle */}
      <button
        onClick={() => setMuted(m => !m)}
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white z-10"
      >
        {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
      </button>

      {/* Right sidebar actions */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-6 z-10">
        {/* Like */}
        <div className="flex flex-col items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={handleLike}
            className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
          >
            <Heart
              size={22}
              className={liked ? 'text-[#ff4d6d] fill-[#ff4d6d]' : 'text-white'}
            />
          </motion.button>
          <span className="text-white text-[11px] font-semibold">{formatCount(likeCount)}</span>
        </div>

        {/* Comment */}
        <div className="flex flex-col items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.85 }}
            className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
          >
            <MessageCircle size={22} className="text-white" />
          </motion.button>
          <span className="text-white text-[11px] font-semibold">{formatCount(reel.comments_count)}</span>
        </div>

        {/* Share */}
        <div className="flex flex-col items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.85 }}
            className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
          >
            <Share2 size={20} className="text-white" />
          </motion.button>
          <span className="text-white text-[11px] font-semibold">Share</span>
        </div>

        {/* Save */}
        <div className="flex flex-col items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => setSaved(s => !s)}
            className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
          >
            <Bookmark size={20} className={saved ? 'text-[#CCFF00] fill-[#CCFF00]' : 'text-white'} />
          </motion.button>
          <span className="text-white text-[11px] font-semibold">Save</span>
        </div>

        {/* More */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
        >
          <MoreVertical size={20} className="text-white" />
        </motion.button>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-6 left-4 right-16 z-10">
        {/* Author */}
        <div className="flex items-center gap-2.5 mb-3">
          <ReelAvatar url={authorAvatar} name={authorName} />
          <div className="flex-1">
            <div className="text-white font-bold text-[14px] leading-tight">{authorName}</div>
            {authorSport && (
              <span className="text-[#CCFF00] text-[10px] font-bold">{authorSport}</span>
            )}
          </div>
          <button className="px-3 py-1 rounded-full border border-white/70 text-white text-[11px] font-semibold hover:bg-white/10 transition-colors">
            Follow
          </button>
        </div>

        {/* Caption */}
        <p className="text-white text-[13px] leading-snug font-medium mb-2 line-clamp-2">{reel.caption}</p>

        {/* Music & view count */}
        <div className="flex items-center justify-between">
          {/* music_label is not on DbReel: the column does not exist, so this only ever
    renders if the API starts sending one. */}
        {'music_label' in reel && typeof reel.music_label === 'string' && (
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                <Music size={8} className="text-white" />
              </div>
              <span className="text-white/70 text-[11px]">{reel.music_label}</span>
            </div>
          )}
          <span className="text-white/50 text-[10px] font-mono ml-auto">{formatCount(reel.views_count)} views</span>
        </div>
      </div>

      {/* Sport tag chip */}
      {reel.sport_tag && (
        <div className="absolute top-4 left-4 z-10">
          <span className="px-2.5 py-1 bg-[#CCFF00]/20 border border-[#CCFF00]/40 text-[#CCFF00] text-[10px] font-bold rounded-full backdrop-blur-sm">
            {reel.sport_tag}
          </span>
        </div>
      )}
    </div>
  );
};
