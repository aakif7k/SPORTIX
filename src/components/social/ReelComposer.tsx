import React, { useState, useRef } from 'react';
import { X, Video, Upload, Music, Tag, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Reel } from '../../types/social.types';

const SPORTS = ['Football', 'Basketball', 'Cricket', 'Athletics', 'Tennis', 'Swimming', 'Boxing', 'Rugby', 'Volleyball', 'Cycling'];

interface ReelComposerProps {
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string;
  currentUserSport?: string;
  onClose: () => void;
  onSubmit: (reel: Omit<Reel, 'id' | 'created_at' | 'liked_by' | 'view_count' | 'comment_count'>) => void;
}

export const ReelComposer: React.FC<ReelComposerProps> = ({
  currentUserId,
  currentUserName,
  currentUserAvatar,
  currentUserSport,
  onClose,
  onSubmit,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [sportTag, setSportTag] = useState(currentUserSport || '');
  const [musicLabel, setMusicLabel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'upload' | 'edit'>('upload');

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith('video/')) return;
    setPreview(URL.createObjectURL(f));
    setStep('edit');
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith('image/')) return;
    setThumbnailPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!caption.trim() && !preview) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 800));

    onSubmit({
      author_id: currentUserId,  // Always current user
      author_name: currentUserName,
      author_avatar: currentUserAvatar,
      author_sport: sportTag || currentUserSport,
      video_url: preview || '',
      thumbnail_url: thumbnailPreview || preview || undefined,
      caption,
      sport_tag: sportTag || undefined,
      music_label: musicLabel.trim() ? `🎵 ${musicLabel}` : undefined,
    });

    if (preview) URL.revokeObjectURL(preview);
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          className="bg-surface border border-border-muted rounded-2xl w-full max-w-sm overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-muted">
            <h2 className="font-display font-bold text-white text-[15px] tracking-wide">UPLOAD REEL</h2>
            <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors p-1">
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {step === 'upload' ? (
              /* Upload step */
              <div className="space-y-4">
                <p className="text-text-secondary text-[13px] text-center">Upload your best sports highlight</p>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border-muted rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-[#CCFF00]/50 hover:bg-[#CCFF00]/5 transition-all group"
                >
                  <div className="w-14 h-14 rounded-full bg-elevated flex items-center justify-center group-hover:bg-[#CCFF00]/10 transition-colors">
                    <Video size={22} className="text-text-secondary group-hover:text-[#CCFF00] transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-white text-[13px] font-medium">Select Video</p>
                    <p className="text-text-secondary text-[11px] mt-0.5">MP4, MOV, AVI • Max 60s recommended</p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="hidden"
                />

                {/* Demo — post without video */}
                <button
                  onClick={() => setStep('edit')}
                  className="w-full py-2.5 text-text-secondary text-[12px] border border-border-muted rounded-xl hover:border-[#CCFF00]/30 transition-colors"
                >
                  Continue without video (demo mode)
                </button>
              </div>
            ) : (
              /* Edit step */
              <div className="space-y-4">
                {/* Preview */}
                {preview && (
                  <div className="relative rounded-xl overflow-hidden aspect-[9/16] max-h-48 bg-black">
                    <video src={preview} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                    <button
                      onClick={() => { setStep('upload'); setPreview(null); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* Caption */}
                <div>
                  <label className="flex items-center gap-2 text-text-secondary text-[11px] font-medium mb-1.5">
                    <Type size={12} />
                    CAPTION
                  </label>
                  <textarea
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    placeholder="Describe your highlight..."
                    rows={3}
                    className="w-full bg-elevated border border-border-muted rounded-xl px-4 py-2.5 text-white text-[13px] placeholder:text-text-muted resize-none outline-none focus:border-[#CCFF00]/50"
                  />
                </div>

                {/* Sport tag */}
                <div>
                  <label className="flex items-center gap-2 text-text-secondary text-[11px] font-medium mb-1.5">
                    <Tag size={12} />
                    SPORT
                  </label>
                  <select
                    value={sportTag}
                    onChange={e => setSportTag(e.target.value)}
                    className="w-full bg-elevated border border-border-muted rounded-xl px-4 py-2.5 text-white text-[13px] outline-none focus:border-[#CCFF00]/50 appearance-none cursor-pointer"
                  >
                    <option value="">Select sport...</option>
                    {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Music label */}
                <div>
                  <label className="flex items-center gap-2 text-text-secondary text-[11px] font-medium mb-1.5">
                    <Music size={12} />
                    MUSIC (optional)
                  </label>
                  <input
                    value={musicLabel}
                    onChange={e => setMusicLabel(e.target.value)}
                    placeholder="Eye of the Tiger — Survivor"
                    className="w-full bg-elevated border border-border-muted rounded-xl px-4 py-2.5 text-white text-[13px] placeholder:text-text-muted outline-none focus:border-[#CCFF00]/50"
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !caption.trim()}
                  className="w-full py-3 rounded-xl bg-[#CCFF00] text-black font-bold text-[13px] tracking-wide hover:bg-[#b8f200] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload size={14} />
                      Post Reel
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
