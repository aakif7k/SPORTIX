import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ReelCard } from './ReelCard';
import { useReels } from '../../hooks/useReels';
import { useAuth } from '@/context/AuthContext';

// ─── Minimal inline ReelComposer for upload ───────────────────────────────────
const UploadModal: React.FC<{
  onClose: () => void;
  onUpload: (video: File, thumb: File | null, caption: string, sport: string) => Promise<void>;
  uploading: boolean;
}> = ({ onClose, onUpload, uploading }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [sport, setSport] = useState('');
  const videoRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!videoFile) return;
    await onUpload(videoFile, null, caption, sport);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.93, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93, y: 20 }}
        className="bg-surface border border-border-muted rounded-2xl w-full max-w-sm p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-display font-bold text-white text-[15px] tracking-wide">UPLOAD REEL</h2>

        {!videoFile ? (
          <button
            onClick={() => videoRef.current?.click()}
            className="w-full h-32 border-2 border-dashed border-border-muted rounded-xl flex flex-col items-center justify-center gap-2 text-text-muted hover:border-[#CCFF00]/50 hover:text-[#CCFF00] transition-all"
          >
            <span className="text-3xl">🎬</span>
            <span className="text-[13px] font-medium">Tap to select video</span>
          </button>
        ) : (
          <div className="flex items-center gap-3 bg-elevated rounded-xl p-3">
            <span className="text-2xl">🎬</span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[13px] truncate">{videoFile.name}</p>
              <p className="text-text-muted text-[11px]">{(videoFile.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
            <button onClick={() => setVideoFile(null)} className="text-text-muted hover:text-red-400 text-[11px]">Remove</button>
          </div>
        )}

        <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={e => setVideoFile(e.target.files?.[0] || null)} />

        <textarea
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder="Write a caption..."
          rows={3}
          className="w-full bg-elevated border border-border-muted rounded-xl px-3 py-2.5 text-white text-[13px] placeholder:text-text-muted outline-none focus:border-[#CCFF00]/50 resize-none"
        />

        <input
          value={sport}
          onChange={e => setSport(e.target.value)}
          placeholder="Sport tag (optional)"
          className="w-full bg-elevated border border-border-muted rounded-xl px-3 py-2.5 text-white text-[13px] placeholder:text-text-muted outline-none focus:border-[#CCFF00]/50"
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border-muted text-text-secondary text-[13px] hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!videoFile || uploading}
            className="flex-1 py-2.5 rounded-xl bg-[#CCFF00] text-black font-semibold text-[13px] disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {uploading ? <><Loader2 size={14} className="animate-spin" />Uploading...</> : 'Post Reel'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyReels: React.FC<{ onUpload: () => void }> = ({ onUpload }) => (
  <div className="w-full flex items-center justify-center bg-black" style={{ height: '100dvh' }}>
    <div className="text-center space-y-4 px-8">
      <div className="text-5xl mb-4">🎬</div>
      <p className="text-white font-display font-bold text-xl tracking-wide">NO REELS YET</p>
      <p className="text-white/50 text-[13px] leading-relaxed">
        Be the first to drop a highlight reel. Upload your best moments.
      </p>
      <button
        onClick={onUpload}
        className="mt-4 px-6 py-3 bg-[#CCFF00] text-black font-bold text-[13px] rounded-xl hover:bg-[#d4ff33] transition-colors"
      >
        Upload First Reel
      </button>
    </div>
  </div>
);

// ─── ReelFeed ─────────────────────────────────────────────────────────────────
export const ReelFeed: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { reels, loading, uploading, toggleLike, recordView, uploadReel } = useReels();

  const [activeIndex, setActiveIndex] = useState(0);
  const [showComposer, setShowComposer] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // IntersectionObserver for autoplay tracking
  useEffect(() => {
    if (!containerRef.current || reels.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0', 10);
            setActiveIndex(index);
          }
        }
      },
      { threshold: 0.6 }
    );

    const cards = containerRef.current.querySelectorAll('[data-index]');
    cards.forEach(card => observerRef.current!.observe(card));

    return () => observerRef.current?.disconnect();
  }, [reels.length]);

  const handleUpload = async (video: File, thumb: File | null, caption: string, sport: string) => {
    await uploadReel(video, thumb, caption || undefined, sport || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black z-[50] flex flex-col">
      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-safe pt-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-white font-display font-bold text-[15px] tracking-widest">REELS</h1>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowComposer(true)}
          className="w-9 h-9 rounded-full bg-[#CCFF00] flex items-center justify-center"
        >
          <Plus size={18} className="text-black" strokeWidth={2.5} />
        </motion.button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={28} className="text-[#CCFF00] animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && reels.length === 0 && (
        <EmptyReels onUpload={() => setShowComposer(true)} />
      )}

      {/* Scroll container — snap scroll */}
      {!loading && reels.length > 0 && (
        <div
          ref={containerRef}
          className="flex-1 overflow-y-scroll snap-y snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {reels.map((reel, i) => (
            <div
              key={reel.id}
              data-index={i}
              className="w-full flex-shrink-0"
              style={{ height: '100dvh' }}
            >
              <ReelCard
                reel={reel}
                isActive={activeIndex === i}
                onLike={toggleLike}
                onView={recordView}
              />
            </div>
          ))}

          {/* Caught up card */}
          <div className="w-full flex items-center justify-center bg-black" style={{ height: '100dvh' }}>
            <div className="text-center space-y-4">
              <div className="text-4xl">🏆</div>
              <p className="text-white font-display font-bold text-lg">You're all caught up!</p>
              <p className="text-white/50 text-sm">Check back later for more highlights</p>
              <button
                onClick={() => setShowComposer(true)}
                className="mt-2 px-6 py-3 bg-[#CCFF00] text-black font-bold text-[13px] rounded-xl"
              >
                Upload Your Reel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload modal */}
      <AnimatePresence>
        {showComposer && (
          <UploadModal
            onClose={() => setShowComposer(false)}
            onUpload={handleUpload}
            uploading={uploading}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
