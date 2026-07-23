import React, { useState, useRef } from 'react';
import { X, Image, Video, Type, MapPin, Tag, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Story } from '../../types/social.types';

const SPORTS = ['Football', 'Basketball', 'Cricket', 'Athletics', 'Tennis', 'Swimming', 'Boxing', 'Rugby'];

interface StoryCreatorProps {
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string | null;
  currentUserSport?: string;
  onClose: () => void;
  onSubmit: (file: File, caption?: string, sportTag?: string) => Promise<void>;
}

export const StoryCreator: React.FC<StoryCreatorProps> = ({
  currentUserId,
  currentUserName,
  currentUserAvatar,
  currentUserSport,
  onClose,
  onSubmit,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [sportTag, setSportTag] = useState(currentUserSport || '');
  const [textOverlay, setTextOverlay] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'upload' | 'edit'>('upload');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const isVideo = f.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStep('edit');
  };

  const handleSubmit = async () => {
    if (!file) return;
    setIsSubmitting(true);
    try {
      await onSubmit(file, caption.trim() || undefined, sportTag || undefined);
      if (preview) URL.revokeObjectURL(preview);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
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
            <h2 className="font-display font-bold text-white text-[15px] tracking-wide">NEW STORY</h2>
            <button onClick={onClose} className="text-text-secondary hover:text-white transition-colors p-1">
              <X size={18} />
            </button>
          </div>

          {step === 'upload' ? (
            /* Upload step */
            <div className="p-6 space-y-4">
              <p className="text-text-secondary text-[13px] text-center">Share a photo or video to your story</p>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border-muted rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-[#CCFF00]/50 hover:bg-[#CCFF00]/5 transition-all group"
              >
                <div className="w-14 h-14 rounded-full bg-elevated flex items-center justify-center group-hover:bg-[#CCFF00]/10 transition-colors">
                  <Upload size={22} className="text-text-secondary group-hover:text-[#CCFF00] transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-white text-[13px] font-medium">Click to upload</p>
                  <p className="text-text-secondary text-[11px] mt-0.5">Photos or Videos • Max 30s</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = 'image/*'; fileInputRef.current.click(); } }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-elevated border border-border-muted text-white text-[12px] font-medium hover:border-[#CCFF00]/40 transition-colors"
                >
                  <Image size={14} />
                  Photo
                </button>
                <button
                  onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = 'video/*'; fileInputRef.current.click(); } }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-elevated border border-border-muted text-white text-[12px] font-medium hover:border-[#CCFF00]/40 transition-colors"
                >
                  <Video size={14} />
                  Video
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            /* Edit step */
            <div className="p-4 space-y-4">
              {/* Preview */}
              <div className="relative rounded-xl overflow-hidden aspect-[9/16] max-h-52 bg-black">
                {mediaType === 'video' ? (
                  <video src={preview!} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                ) : (
                  <img src={preview!} alt="Preview" className="w-full h-full object-cover" />
                )}
                {textOverlay && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-xl text-center px-4 drop-shadow-lg">{textOverlay}</span>
                  </div>
                )}
                <button
                  onClick={() => { setStep('upload'); setPreview(null); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Fields */}
              <div className="space-y-3">
                {/* Caption */}
                <div className="relative">
                  <Type size={14} className="absolute left-3 top-3 text-text-secondary" />
                  <textarea
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    placeholder="Add a caption..."
                    rows={2}
                    className="w-full bg-elevated border border-border-muted rounded-xl pl-9 pr-4 py-2.5 text-white text-[13px] placeholder:text-text-muted resize-none outline-none focus:border-[#CCFF00]/50"
                  />
                </div>

                {/* Text overlay */}
                <div className="relative">
                  <Type size={14} className="absolute left-3 top-3 text-[#CCFF00]" />
                  <input
                    value={textOverlay}
                    onChange={e => setTextOverlay(e.target.value)}
                    placeholder="Text overlay on story..."
                    className="w-full bg-elevated border border-border-muted rounded-xl pl-9 pr-4 py-2.5 text-white text-[13px] placeholder:text-text-muted outline-none focus:border-[#CCFF00]/50"
                  />
                </div>

                {/* Sport tag */}
                <div className="relative">
                  <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <select
                    value={sportTag}
                    onChange={e => setSportTag(e.target.value)}
                    className="w-full bg-elevated border border-border-muted rounded-xl pl-9 pr-4 py-2.5 text-white text-[13px] outline-none focus:border-[#CCFF00]/50 appearance-none cursor-pointer"
                  >
                    <option value="">No sport tag</option>
                    {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-[#CCFF00] text-black font-bold text-[13px] tracking-wide hover:bg-[#b8f200] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Share to Story'
                )}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
