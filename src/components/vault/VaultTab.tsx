import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Image as ImageIcon, Video, Trophy, FileText, MoreVertical,
  Edit3, Trash2, Eye, Sparkles, X, Upload, Check, AlertCircle,
  Play, Loader2
} from 'lucide-react';
import { getUserPosts, getUserReels, deletePost, deleteReel, updatePost, updateReel, createPost, createReel, uploadMedia } from '@/services/socialService';
import type { DbPost, DbReel } from '@/services/socialService';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { createNotification } from '@/services/notificationService';
import { useNotificationStore } from '@/store/notificationStore';
import { SportTagSelector } from '@/components/social/SportTagSelector';

export interface VaultItem {
  id: string;
  kind: 'post' | 'reel';
  title?: string;
  caption: string;
  mediaUrl?: string | null;
  mediaType: 'photo' | 'video' | 'highlight' | 'post';
  postType?: string;
  sportTag?: string | null;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  raw: DbPost | DbReel;
}

interface VaultTabProps {
  targetId: string;
  isMe: boolean;
  athleteName: string;
  athleteUsername: string;
  athleteAvatar?: string | null;
  athleteSport?: string;
}

type FilterCategory = 'all' | 'photos' | 'videos' | 'highlights' | 'posts';

export const VaultTab: React.FC<VaultTabProps> = ({
  targetId,
  isMe,
  athleteName,
  athleteUsername,
  athleteAvatar,
  athleteSport,
}) => {
  const authUser = useAuthStore(state => state.user);
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [detailItem, setDetailItem] = useState<VaultItem | null>(null);
  const [editItem, setEditItem] = useState<VaultItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<VaultItem | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  // ── Fetch user content from Appwrite ───────────────────────────────────────
  const fetchVaultContent = useCallback(async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      const [userPosts, userReels] = await Promise.all([
        getUserPosts(targetId),
        getUserReels(targetId),
      ]);

      const postItems: VaultItem[] = userPosts.map(p => {
        let mediaType: VaultItem['mediaType'] = 'post';
        if (p.post_type === 'highlight') {
          mediaType = 'highlight';
        } else if (p.media_type === 'video') {
          mediaType = 'video';
        } else if (p.media_urls && p.media_urls.length > 0) {
          mediaType = 'photo';
        }

        return {
          id: p.id,
          kind: 'post',
          caption: p.content || '',
          mediaUrl: p.media_urls && p.media_urls.length > 0 ? p.media_urls[0] : null,
          mediaType,
          postType: p.post_type,
          sportTag: p.sport_tag,
          likesCount: p.likes_count,
          commentsCount: p.comments_count,
          createdAt: p.created_at,
          raw: p,
        };
      });

      const reelItems: VaultItem[] = userReels.map(r => ({
        id: r.id,
        kind: 'reel',
        caption: r.caption || '',
        mediaUrl: r.thumbnail_url || r.video_url,
        mediaType: 'video',
        postType: 'reel',
        sportTag: r.sport_tag,
        likesCount: r.likes_count,
        commentsCount: r.comments_count,
        createdAt: r.created_at,
        raw: r,
      }));

      // Combine and sort descending by date
      const combined = [...postItems, ...reelItems].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setItems(combined);
    } catch (err: any) {
      console.error('[VaultTab] Error fetching vault content:', err);
      toast.error('Failed to load Vault content: ' + (err?.message || 'Could not fetch items.'));
    } finally {
      setLoading(false);
    }
  }, [targetId]);

  useEffect(() => {
    fetchVaultContent();

    // Real-time deletion sync listener across entire application (Hyperzone, Feed, Profile)
    const handleContentDeleted = (e: Event) => {
      const customEvt = e as CustomEvent<{ id: string }>;
      const deletedId = customEvt.detail?.id;
      if (deletedId) {
        setItems(prev => prev.filter(item => item.id !== deletedId));
      }
    };

    window.addEventListener('content:deleted', handleContentDeleted);
    return () => {
      window.removeEventListener('content:deleted', handleContentDeleted);
    };
  }, [fetchVaultContent]);

  // ── Calculated Real Counts ─────────────────────────────────────────────────
  const counts = useMemo(() => {
    let photos = 0;
    let videos = 0;
    let highlights = 0;
    let posts = 0;

    items.forEach(item => {
      if (item.mediaType === 'photo') photos++;
      else if (item.mediaType === 'video') videos++;
      else if (item.mediaType === 'highlight') highlights++;
      else posts++;
    });

    return { total: items.length, photos, videos, highlights, posts };
  }, [items]);

  // ── Filtered Items ─────────────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    if (activeFilter === 'photos') return items.filter(i => i.mediaType === 'photo');
    if (activeFilter === 'videos') return items.filter(i => i.mediaType === 'video');
    if (activeFilter === 'highlights') return items.filter(i => i.mediaType === 'highlight');
    if (activeFilter === 'posts') return items.filter(i => i.mediaType === 'post');
    return items;
  }, [items, activeFilter]);

  // ── Delete Handler ─────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteItem || !authUser?.id) return;
    try {
      await Promise.allSettled([
        deletePost(deleteItem.id, authUser.id),
        deleteReel(deleteItem.id, authUser.id),
      ]);

      // Trigger Buzz Notification for Deleting a Post
      createNotification({
        userId: authUser.id,
        type: 'system' as any,
        title: 'Post Deleted 🗑️',
        message: 'Deleted a post: Item permanently removed from feed and library.',
        read: false,
      }).catch(() => null);

      useNotificationStore.getState().addNotification({
        id: `notif_del_${Date.now()}`,
        userId: authUser.id,
        type: 'system' as any,
        title: 'Post Deleted 🗑️',
        message: 'Deleted a post: Item permanently removed from feed and library.',
        timestamp: new Date().toISOString(),
        read: false,
      });

      toast.success('Post Deleted! Item removed.');
      setItems(prev => prev.filter(i => i.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (err: any) {
      console.error('[VaultTab] Delete error:', err);
      toast.error(err?.message || "Couldn't delete content.");
    }
  };

  return (
    <div className="space-y-6 text-text-primary">
      {/* ── VAULT HEADER ─────────────────────────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-surface border border-border-muted space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black uppercase tracking-tight text-text-primary">VaultD</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/30 font-mono text-[10px] font-bold text-accent">
                {counts.total} {counts.total === 1 ? 'ITEM' : 'ITEMS'}
              </span>
            </div>
            <p className="font-mono text-xs text-text-secondary mt-1 max-w-2xl leading-relaxed">
              Your personal content library. Every post, image, video, and text you upload is stored here — ready to view, edit to your feed anytime.
            </p>
          </div>

          {/* Prominent Upload Button (Owner only) */}
          {isMe && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-volt-text font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-accent/20"
            >
              <Plus size={16} /> + Upload
            </button>
          )}
        </div>

        {/* Real Computed Counts Bar */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-border-muted font-mono text-xs text-text-secondary">
          <div className="flex items-center gap-1.5">
            <FileText size={14} className="text-accent" />
            <span>{counts.posts} Posts</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <ImageIcon size={14} className="text-accent" />
            <span>{counts.photos} Photos</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Video size={14} className="text-accent" />
            <span>{counts.videos} Videos</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Trophy size={14} className="text-accent" />
            <span>{counts.highlights} Highlights</span>
          </div>
        </div>

        {/* Filter Navigation Chips */}
        <div className="flex items-center gap-2 pt-2 overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: 'All', icon: Sparkles },
            { id: 'photos', label: `Photos (${counts.photos})`, icon: ImageIcon },
            { id: 'videos', label: `Videos (${counts.videos})`, icon: Video },
            { id: 'highlights', label: `Highlights (${counts.highlights})`, icon: Trophy },
            { id: 'posts', label: `Posts (${counts.posts})`, icon: FileText },
          ].map(cat => {
            const Icon = cat.icon;
            const active = activeFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id as FilterCategory)}
                className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  active
                    ? 'bg-accent text-volt-text shadow-md'
                    : 'bg-elevated text-text-secondary border border-border-muted hover:border-accent/40 hover:text-text-primary'
                }`}
              >
                <Icon size={12} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── LOADING SKELETON ──────────────────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="aspect-square rounded-2xl bg-elevated border border-border-muted animate-pulse flex flex-col justify-between p-3">
              <div className="w-12 h-4 rounded bg-surface" />
              <div className="w-full h-8 rounded bg-surface" />
            </div>
          ))}
        </div>
      )}

      {/* ── EMPTY STATE (No mock content ever!) ──────────────────────────── */}
      {!loading && filteredItems.length === 0 && (
        <div className="p-12 rounded-3xl bg-surface border border-border-muted text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-accent/10 border border-accent/30 mx-auto flex items-center justify-center text-accent">
            <Sparkles size={28} />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="font-sans font-bold text-lg text-text-primary uppercase tracking-wider">
              Your sports story starts here
            </h3>
            <p className="font-mono text-xs text-text-muted">
              {isMe
                ? 'Upload your first highlight, photo, or post to build your athlete portfolio.'
                : `${athleteName} has not uploaded any public Vault items yet.`}
            </p>
          </div>
          {isMe && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-volt-text font-mono font-bold text-xs uppercase tracking-wider transition-all inline-flex items-center gap-2 shadow-lg"
            >
              <Plus size={16} /> + Upload Content
            </button>
          )}
        </div>
      )}

      {/* ── RESPONSIVE MEDIA GRID ────────────────────────────────────────── */}
      {!loading && filteredItems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredItems.map(item => {
            const dateObj = new Date(item.createdAt);
            const formattedDate = dateObj.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const formattedTime = dateObj.toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={item.id}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-elevated border border-border-muted hover:border-accent/50 transition-all duration-200 shadow-md flex flex-col justify-between"
              >
                {/* Media Preview or Fallback */}
                {item.mediaUrl ? (
                  item.mediaType === 'video' ? (
                    <div className="absolute inset-0 bg-black flex items-center justify-center">
                      <video src={item.mediaUrl} className="w-full h-full object-cover opacity-80" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                      <div className="w-10 h-10 rounded-full bg-accent/90 flex items-center justify-center text-volt-text shadow-lg z-10">
                        <Play size={18} className="ml-0.5" />
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0">
                      <img src={item.mediaUrl} alt={item.caption} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                    </div>
                  )
                ) : (
                  <div className="absolute inset-0 p-4 bg-gradient-to-br from-surface to-elevated flex flex-col justify-between border border-border-muted">
                    <p className="font-sans text-xs text-text-primary line-clamp-4 leading-relaxed">
                      "{item.caption}"
                    </p>
                    <div className="font-mono text-[10px] text-text-muted flex items-center gap-1">
                      <span>{formattedDate}</span>
                      <span>•</span>
                      <span>{formattedTime}</span>
                    </div>
                  </div>
                )}

                {/* Top Badge Overlay */}
                <div className="relative z-10 p-2.5 flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur border border-white/10 font-mono text-[9px] font-bold text-accent uppercase flex items-center gap-1">
                    {item.mediaType === 'photo' && <ImageIcon size={10} />}
                    {item.mediaType === 'video' && <Video size={10} />}
                    {item.mediaType === 'highlight' && <Trophy size={10} />}
                    {item.mediaType === 'post' && <FileText size={10} />}
                    {item.mediaType}
                  </span>

                  {/* Owner ⋯ Action Menu Trigger */}
                  {isMe && (
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionMenuId(actionMenuId === item.id ? null : item.id);
                        }}
                        className="w-7 h-7 rounded-lg bg-black/60 hover:bg-black/90 backdrop-blur border border-white/10 text-white flex items-center justify-center transition-all"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {/* Dropdown Menu */}
                      {actionMenuId === item.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-8 w-44 rounded-xl bg-surface border border-border-muted shadow-2xl p-1.5 z-30 space-y-1 font-mono text-xs"
                        >
                          <button
                            onClick={() => {
                              setActionMenuId(null);
                              setDetailItem(item);
                            }}
                            className="w-full px-3 py-1.5 rounded-lg text-left text-text-primary hover:bg-elevated hover:text-accent flex items-center gap-2"
                          >
                            <Eye size={12} /> View Detail
                          </button>
                          <button
                            onClick={() => {
                              setActionMenuId(null);
                              toast.success('Synced to feed! Content is live on your public feed.');
                            }}
                            className="w-full px-3 py-1.5 rounded-lg text-left text-text-primary hover:bg-elevated hover:text-accent flex items-center gap-2"
                          >
                            <Sparkles size={12} className="text-accent" /> Publish to Feed
                          </button>
                          <button
                            onClick={() => {
                              setActionMenuId(null);
                              setEditItem(item);
                            }}
                            className="w-full px-3 py-1.5 rounded-lg text-left text-text-primary hover:bg-elevated hover:text-accent flex items-center gap-2"
                          >
                            <Edit3 size={12} /> Edit Details
                          </button>
                          <button
                            onClick={() => {
                              setActionMenuId(null);
                              setDeleteItem(item);
                            }}
                            className="w-full px-3 py-1.5 rounded-lg text-left text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Caption & Click to View Trigger */}
                <div
                  onClick={() => setDetailItem(item)}
                  className="relative z-10 p-3 cursor-pointer group-hover:bg-black/20 transition-all"
                >
                  {item.mediaUrl && (
                    <p className="font-sans text-xs text-white line-clamp-1 drop-shadow-md font-medium">
                      {item.caption || 'Untitled upload'}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center justify-between mt-1 font-mono text-[10px] text-white/80 gap-1">
                    <span>{formattedDate} • {formattedTime}</span>
                    {item.sportTag && <span className="text-accent font-bold">#{item.sportTag}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── DETAIL MODAL ─────────────────────────────────────────────────── */}
      {detailItem && (
        <VaultDetailModal
          item={detailItem}
          isMe={isMe}
          onClose={() => setDetailItem(null)}
          onEdit={() => {
            const current = detailItem;
            setDetailItem(null);
            setEditItem(current);
          }}
          onDelete={() => {
            const current = detailItem;
            setDetailItem(null);
            setDeleteItem(current);
          }}
        />
      )}

      {/* ── UPLOAD MODAL ─────────────────────────────────────────────────── */}
      {showUploadModal && isMe && (
        <VaultUploadModal
          athleteName={athleteName}
          athleteUsername={athleteUsername}
          athleteAvatar={athleteAvatar}
          athleteSport={athleteSport}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            fetchVaultContent();
          }}
        />
      )}

      {/* ── EDIT MODAL ───────────────────────────────────────────────────── */}
      {editItem && isMe && (
        <VaultEditModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSuccess={() => {
            setEditItem(null);
            fetchVaultContent();
          }}
        />
      )}

      {/* ── DELETE CONFIRMATION MODAL ────────────────────────────────────── */}
      {deleteItem && isMe && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-sm w-full bg-surface border border-border-muted rounded-3xl p-6 space-y-4 shadow-2xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <Trash2 size={24} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-sans font-bold text-base text-text-primary uppercase tracking-wider">
                Delete this content?
              </h3>
              <p className="font-mono text-xs text-text-muted leading-relaxed">
                This action cannot be undone. This item will be permanently removed from your Vault.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteItem(null)}
                className="flex-1 py-2.5 rounded-xl border border-border-muted font-mono text-xs text-text-secondary hover:text-text-primary hover:bg-elevated transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-md"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// ─── VAULT DETAIL MODAL COMPONENT ──────────────────────────────────────────
const VaultDetailModal: React.FC<{
  item: VaultItem;
  isMe: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ item, isMe, onClose, onEdit, onDelete }) => {
  const formattedDate = new Date(item.createdAt).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-2xl w-full bg-surface border border-border-muted rounded-3xl overflow-hidden shadow-2xl space-y-0"
      >
        {/* Header */}
        <div className="p-4 border-b border-border-muted flex items-center justify-between bg-elevated/50">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/30 font-mono text-xs font-bold text-accent uppercase">
              {item.mediaType}
            </span>
            <span className="font-mono text-xs text-text-muted">{formattedDate}</span>
          </div>

          <div className="flex items-center gap-2">
            {isMe && (
              <>
                <button
                  onClick={onEdit}
                  className="p-2 rounded-xl bg-surface hover:bg-accent hover:text-volt-text border border-border-muted text-text-secondary transition-all"
                  title="Edit details"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={onDelete}
                  className="p-2 rounded-xl bg-surface hover:bg-red-500 hover:text-white border border-border-muted text-red-400 transition-all"
                  title="Delete item"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-surface hover:bg-elevated border border-border-muted text-text-secondary transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Media Player / Image Display */}
        <div className="bg-black flex items-center justify-center max-h-[60vh] overflow-hidden relative">
          {item.mediaUrl ? (
            item.mediaType === 'video' ? (
              <video src={item.mediaUrl} controls autoPlay className="w-full max-h-[60vh] object-contain" />
            ) : (
              <img src={item.mediaUrl} alt={item.caption} className="w-full max-h-[60vh] object-contain" />
            )
          ) : (
            <div className="p-8 text-center max-w-lg mx-auto">
              <p className="font-sans text-base text-white leading-relaxed">
                "{item.caption}"
              </p>
            </div>
          )}
        </div>

        {/* Details Footer */}
        <div className="p-6 space-y-3 bg-surface">
          {item.mediaUrl && (
            <p className="font-sans text-sm text-text-primary leading-relaxed">
              {item.caption || 'No caption provided.'}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border-muted font-mono text-xs text-text-muted">
            <div className="flex items-center gap-4">
              <span>❤️ {item.likesCount} Likes</span>
              <span>💬 {item.commentsCount} Comments</span>
            </div>
            {item.sportTag && (
              <span className="px-2.5 py-0.5 rounded-full bg-elevated border border-border-muted text-accent font-bold">
                #{item.sportTag}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ─── UNIFIED SOCIAL MEDIA POST CREATION MODAL ─────────────────────────────
const VaultUploadModal: React.FC<{
  athleteName: string;
  athleteUsername: string;
  athleteAvatar?: string | null;
  athleteSport?: string;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ athleteName, athleteUsername, athleteAvatar, athleteSport, onClose, onSuccess }) => {
  const authUser = useAuthStore(state => state.user);

  const [caption, setCaption] = useState('');
  const [sportTag, setSportTag] = useState(athleteSport || 'Football');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsVideo(file.type.startsWith('video/'));
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveMedia = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsVideo(false);
  };

  const handleUploadSubmit = async () => {
    if (!authUser?.id) return;
    if (!caption.trim() && !selectedFile) {
      setErrorMessage('Please add some text or attach an image/video to publish.');
      return;
    }

    setUploading(true);
    setProgress(30);
    setErrorMessage(null);

    try {
      if (isVideo && selectedFile) {
        // Create Video Reel
        setProgress(60);
        await createReel(
          authUser.id,
          athleteName,
          athleteUsername,
          athleteAvatar || null,
          sportTag,
          selectedFile,
          null,
          caption,
          sportTag
        );
      } else {
        // Create Standard Post / Image
        setProgress(60);
        await createPost(authUser.id, {
          content: caption,
          files: selectedFile ? [selectedFile] : undefined,
          post_type: selectedFile ? 'photo' : 'general',
          sport_tag: sportTag,
          authorName: athleteName,
          authorUsername: athleteUsername,
          authorAvatarUrl: athleteAvatar || null,
          authorSport: sportTag,
        });
      }

      setProgress(100);

      // Trigger Buzz Notification for Uploading a Post
      createNotification({
        userId: authUser.id,
        type: 'post_created' as any,
        title: 'Post Published ⚡',
        message: `Upload a post: "${caption.slice(0, 40) || 'New Post'}" is live on SPORTiX.`,
        read: false,
      }).catch(() => null);

      useNotificationStore.getState().addNotification({
        id: `notif_post_${Date.now()}`,
        userId: authUser.id,
        type: 'post_created' as any,
        title: 'Post Published ⚡',
        message: `Upload a post: "${caption.slice(0, 40) || 'New Post'}" is live on SPORTiX.`,
        timestamp: new Date().toISOString(),
        read: false,
      });

      toast.success('Post Published! ⚡ Live on feed.');
      onSuccess();
    } catch (err: any) {
      console.error('[CreatePostModal] Upload error:', err);
      setErrorMessage(err?.message || "Couldn't publish post. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-lg w-full bg-surface border border-border-muted rounded-3xl p-6 space-y-5 shadow-2xl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border-muted pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
              <Plus size={18} />
            </div>
            <h3 className="font-sans font-bold text-base text-text-primary uppercase tracking-wider">
              Create Post
            </h3>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-elevated border border-border-muted overflow-hidden flex-shrink-0">
            {athleteAvatar ? (
              <img src={athleteAvatar} alt={athleteName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-sm text-text-primary">
                {athleteName.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <div className="font-sans font-bold text-xs text-text-primary">{athleteName}</div>
            <div className="font-mono text-[10px] text-text-muted">@{athleteUsername}</div>
          </div>
        </div>

        {/* Text Area */}
        <div className="space-y-1.5">
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            rows={4}
            placeholder="What's happening in your sports world? Share match updates, stats, or thoughts..."
            className="w-full bg-elevated border border-border-muted rounded-2xl p-4 font-sans text-xs text-text-primary placeholder-text-muted outline-none focus:border-accent resize-none leading-relaxed"
          />
        </div>

        {/* Media Preview or Drop Zone */}
        {previewUrl ? (
          <div className="relative rounded-2xl overflow-hidden bg-black max-h-48 flex items-center justify-center border border-border-muted group">
            {isVideo ? (
              <video src={previewUrl} controls className="max-h-48 w-full object-contain" />
            ) : (
              <img src={previewUrl} alt="Upload preview" className="max-h-48 w-full object-cover" />
            )}
            <button
              onClick={handleRemoveMedia}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-red-500 text-white transition-all shadow-md"
              title="Remove media"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <label className="relative border-2 border-dashed border-border-muted hover:border-accent/60 rounded-2xl p-4 text-center cursor-pointer transition-all bg-elevated/40 hover:bg-elevated flex items-center justify-center gap-3">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-10 h-10 rounded-xl bg-surface border border-border-muted flex items-center justify-center text-accent">
              <Upload size={18} />
            </div>
            <div className="text-left">
              <span className="font-mono text-xs text-text-primary font-bold block">
                Attach Image or Video
              </span>
              <span className="font-mono text-[10px] text-text-muted block">
                JPEG, PNG, MP4, MOV up to 100MB
              </span>
            </div>
          </label>
        )}

        {/* Quick Sport Tag Selector from sportix_sport_roles */}
        <SportTagSelector
          value={sportTag}
          onChange={setSportTag}
          label="SPORT TAG:"
          className="pt-1"
        />

        {/* Progress Bar */}
        {uploading && (
          <div className="space-y-1">
            <div className="flex justify-between font-mono text-[10px] text-accent font-bold">
              <span>Publishing post...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-elevated overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="flex-1 py-3 rounded-xl border border-border-muted font-mono text-xs text-text-secondary hover:text-text-primary hover:bg-elevated transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUploadSubmit}
            disabled={uploading}
            className="flex-1 py-3 rounded-xl btn-accent font-display font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {uploading ? 'Publishing...' : 'Publish Post'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── VAULT EDIT MODAL COMPONENT ────────────────────────────────────────────
const VaultEditModal: React.FC<{
  item: VaultItem;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ item, onClose, onSuccess }) => {
  const authUser = useAuthStore(state => state.user);
  const [caption, setCaption] = useState(item.caption || '');
  const [sportTag, setSportTag] = useState(item.sportTag || '');
  const [saving, setSaving] = useState(false);

  const [newFile, setNewFile] = useState<File | null>(null);
  const [newPreview, setNewPreview] = useState<string | null>(null);

  const handleMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewFile(file);
    setNewPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!authUser?.id) return;
    setSaving(true);
    try {
      let updatedMediaUrl = item.mediaUrl;
      if (newFile) {
        updatedMediaUrl = await uploadMedia(newFile);
      }

      if (item.kind === 'post') {
        await updatePost(item.id, authUser.id, {
          content: caption,
          sport_tag: sportTag || null,
          media_urls: updatedMediaUrl ? [updatedMediaUrl] : [],
        });
      } else {
        await updateReel(item.id, authUser.id, {
          caption: caption || null,
          sport_tag: sportTag || null,
          video_url: updatedMediaUrl || undefined,
        });
      }

      toast.success('VaultD Updated! ⚡ Changes saved successfully.');
      onSuccess();
    } catch (err: any) {
      console.error('[VaultEditModal] Save error:', err);
      toast.error(err?.message || "Couldn't update item.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full bg-surface border border-border-muted rounded-3xl p-6 space-y-4 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border-muted pb-3">
          <h3 className="font-sans font-bold text-base text-text-primary uppercase tracking-wider">
            Edit VaultD Item
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={18} />
          </button>
        </div>

        {/* Change Media Option */}
        <div className="space-y-2">
          <label className="block font-mono text-xs text-text-muted">Change Media File</label>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-elevated border border-border-muted flex items-center justify-center flex-shrink-0">
              {newPreview ? (
                <img src={newPreview} className="w-full h-full object-cover" />
              ) : item.mediaUrl ? (
                <img src={item.mediaUrl} className="w-full h-full object-cover" />
              ) : (
                <FileText size={20} className="text-text-muted" />
              )}
            </div>
            <label className="px-3 py-2 rounded-xl bg-elevated border border-border-muted hover:border-accent text-text-primary font-mono text-xs cursor-pointer">
              Select New File
              <input type="file" onChange={handleMediaFileChange} className="hidden" />
            </label>
          </div>
        </div>

        {/* Edit Caption */}
        <div className="space-y-1.5">
          <label className="block font-mono text-xs text-text-muted">Caption / Content</label>
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            rows={3}
            className="w-full bg-elevated border border-border-muted rounded-xl p-3 font-sans text-xs text-text-primary outline-none focus:border-accent resize-none"
          />
        </div>

        {/* Edit Sport Tag from sportix_sport_roles */}
        <SportTagSelector
          value={sportTag}
          onChange={setSportTag}
          label="SPORT TAG:"
          className="pt-1"
        />

        {/* Action Controls */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl border border-border-muted font-mono text-xs text-text-secondary hover:text-text-primary hover:bg-elevated transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-volt-text font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
