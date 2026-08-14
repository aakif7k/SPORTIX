import React, { useRef, useState, useCallback } from 'react';
import { X, Image, Video, MapPin, Tag, Send, Loader2, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

interface PostComposerProps {
  onClose: () => void;
  onSubmit: (payload: {
    content: string;
    files?: File[];
    post_type?: string;
    sport_tag?: string;
    location_tag?: string;
  }) => Promise<boolean | any>;
  submitting?: boolean;
  currentUserAvatar?: string | null;
  currentUserName?: string;
}

import { OFFICIAL_SPORTIX_SPORTS_ROLES } from '@/services/sportsRoleService';

const SPORTS = [
  'Multi-Sport',
  ...OFFICIAL_SPORTIX_SPORTS_ROLES.map(s => s.sport)
];

const MAX_IMAGES = 4;
const MAX_CHARS = 2200;

// ─── Initials Avatar ──────────────────────────────────────────────────────────
const MiniAvatar: React.FC<{ url: string | null; name: string }> = ({ url, name }) => {
  const [err, setErr] = useState(false);
  const initial = (name || '?').charAt(0).toUpperCase();

  if (url && !err) {
    return <img src={url} alt={name} onError={() => setErr(true)} className="w-9 h-9 rounded-full object-cover border border-border-muted" />;
  }
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-accent/15 border border-accent/30 flex-shrink-0">
      <span className="text-accent font-bold text-base leading-none">{initial}</span>
    </div>
  );
};

// ─── Post Composer ────────────────────────────────────────────────────────────
export const PostComposer: React.FC<PostComposerProps> = ({
  onClose, onSubmit, submitting = false, currentUserAvatar, currentUserName,
}) => {
  const { user: currentUser } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [locationTag, setLocationTag] = useState('');
  const [sportTag, setSportTag] = useState('');
  const [showSportPicker, setShowSportPicker] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);

  const name = currentUserName || (currentUser as any)?.user_metadata?.full_name || currentUser?.name || 'Athlete';

  const addFiles = useCallback((fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    const isVideo = file.type.startsWith('video/');

    if (isVideo) {
      previews.forEach(p => URL.revokeObjectURL(p));
      const preview = URL.createObjectURL(file);
      setFiles([file]);
      setPreviews([preview]);
      setMediaType('video');
      return;
    }

    if (mediaType === 'video') return;

    const remaining = MAX_IMAGES - files.length;
    if (remaining <= 0) return;

    const newFiles = Array.from(fileList).slice(0, remaining).filter(f => f.type.startsWith('image/'));
    const newPreviews = newFiles.map(f => URL.createObjectURL(f));

    setFiles(prev => [...prev, ...newFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
    setMediaType('image');
  }, [files, previews, mediaType]);

  const removeMedia = useCallback((index: number) => {
    URL.revokeObjectURL(previews[index]);
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
    if (newFiles.length === 0) setMediaType(null);
  }, [files, previews]);

  const handleSubmit = async () => {
    if ((!content.trim() && files.length === 0) || submitting) return;

    const success = await onSubmit({
      content,
      files: files.length > 0 ? files : undefined,
      sport_tag: sportTag || undefined,
      location_tag: locationTag.trim() || undefined,
    });

    if (success) {
      previews.forEach(p => URL.revokeObjectURL(p));
      onClose();
    }
  };

  const canPost = (content.trim().length > 0 || files.length > 0) && !submitting;
  const charsLeft = MAX_CHARS - content.length;

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
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-surface border border-border-muted rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg overflow-hidden max-h-[95vh] flex flex-col shadow-2xl pointer-events-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border-muted flex-shrink-0">
            <h2 className="font-display font-bold text-text-primary text-[15px] tracking-wide">DROP A HYPEZONE POST</h2>
            <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1 transition-colors" disabled={submitting}>
              <X size={18} />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1">
            {/* Author */}
            <div className="flex items-center gap-3 px-5 pt-4">
              <MiniAvatar url={currentUserAvatar ?? null} name={name} />
              <div>
                <p className="text-text-primary font-bold text-[13px]">{name}</p>
                {sportTag && <span className="text-accent text-[11px] font-mono font-bold">#{sportTag}</span>}
              </div>
            </div>

            {/* Text area */}
            <div className="px-5 py-3 cursor-text" onClick={() => textareaRef.current?.focus()}>
              <textarea
                ref={textareaRef}
                value={content}
                disabled={submitting}
                onChange={e => setContent(e.target.value.slice(0, MAX_CHARS))}
                placeholder="What's happening on the pitch or court? 🔥"
                rows={4}
                className="w-full bg-transparent text-text-primary text-[14px] placeholder:text-text-muted resize-none outline-none leading-relaxed font-sans cursor-text"
                autoFocus
              />
              {content.length > MAX_CHARS * 0.8 && (
                <p className={`text-right font-mono text-[11px] ${charsLeft < 50 ? 'text-red-400' : 'text-text-muted'}`}>
                  {charsLeft} remaining
                </p>
              )}
            </div>

            {/* Media previews */}
            {previews.length > 0 && (
              <div className={`px-5 pb-3 grid gap-2 ${previews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {previews.map((src, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden border border-border-muted">
                    {mediaType === 'video'
                      ? <video src={src} className="w-full h-40 object-cover" muted />
                      : <img src={src} alt={`Preview ${i}`} className="w-full h-40 object-cover" />
                    }
                    <button
                      onClick={() => removeMedia(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-black transition"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Tags display */}
            <div className="px-5 pb-3 flex flex-wrap gap-2">
              {locationTag && (
                <div className="flex items-center gap-1 bg-elevated border border-border-muted px-2.5 py-1 rounded-full text-[12px] text-text-secondary font-mono">
                  <MapPin size={11} />
                  {locationTag}
                  <button onClick={() => setLocationTag('')} className="ml-1 text-text-muted hover:text-text-primary"><X size={10} /></button>
                </div>
              )}
            </div>

            {/* Location input */}
            {showLocationInput && (
              <div className="px-5 pb-3">
                <input
                  type="text"
                  value={locationTag}
                  disabled={submitting}
                  onChange={e => setLocationTag(e.target.value)}
                  placeholder="Add venue / city location..."
                  className="w-full bg-elevated border border-border-muted rounded-xl px-3 py-2 text-text-primary text-[13px] outline-none focus:border-accent font-mono"
                  onKeyDown={e => { if (e.key === 'Enter') setShowLocationInput(false); }}
                  autoFocus
                />
              </div>
            )}

            {/* Sport picker */}
            {showSportPicker && (
              <div className="px-5 pb-3">
                <div className="flex flex-wrap gap-1.5">
                  {SPORTS.map(s => (
                    <button
                      key={s}
                      disabled={submitting}
                      onClick={() => { setSportTag(s === sportTag ? '' : s); setShowSportPicker(false); }}
                      className={`px-3 py-1 rounded-full text-[12px] font-mono font-medium transition-colors ${
                        sportTag === s
                          ? 'bg-accent text-volt-text font-bold'
                          : 'bg-elevated border border-border-muted text-text-secondary hover:border-accent'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Toolbar */}
          <div className="border-t border-border-muted px-5 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-1">
              {/* Focus text area */}
              <button
                onClick={() => textareaRef.current?.focus()}
                disabled={submitting}
                className="p-2 text-text-muted hover:text-accent transition-colors"
                title="Write text"
              >
                <Type size={18} />
              </button>

              {/* Image */}
              <button
                onClick={() => imageInputRef.current?.click()}
                disabled={mediaType === 'video' || files.length >= MAX_IMAGES || submitting}
                className="p-2 text-text-muted hover:text-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Add image"
              >
                <Image size={18} />
              </button>

              {/* Video */}
              <button
                onClick={() => videoInputRef.current?.click()}
                disabled={files.length > 0 || submitting}
                className="p-2 text-text-muted hover:text-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Add video"
              >
                <Video size={18} />
              </button>

              {/* Location */}
              <button
                onClick={() => setShowLocationInput(l => !l)}
                disabled={submitting}
                className={`p-2 transition-colors ${locationTag ? 'text-accent' : 'text-text-muted hover:text-accent'}`}
                title="Add location"
              >
                <MapPin size={18} />
              </button>

              {/* Sport tag */}
              <button
                onClick={() => setShowSportPicker(p => !p)}
                disabled={submitting}
                className={`p-2 transition-colors ${sportTag ? 'text-accent' : 'text-text-muted hover:text-accent'}`}
                title="Tag sport"
              >
                <Tag size={18} />
              </button>
            </div>

            {/* Post button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={!canPost}
              className="flex items-center gap-2 px-5 py-2 rounded-xl font-mono font-bold text-[13px] transition-all
                disabled:opacity-40 disabled:cursor-not-allowed
                bg-accent text-volt-text hover:bg-accent/90 shadow-md"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send size={15} />
                  Publish
                </>
              )}
            </motion.button>
          </div>

          {/* Hidden file inputs */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => addFiles(e.target.files)}
            onClick={e => { (e.target as HTMLInputElement).value = ''; }}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={e => addFiles(e.target.files)}
            onClick={e => { (e.target as HTMLInputElement).value = ''; }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
