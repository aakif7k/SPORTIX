import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Image as ImageIcon, Video, Trophy, FileText, MoreVertical,
  Edit3, Trash2, Eye, Sparkles, X, Upload, Check, AlertCircle,
  Play, Loader2, Zap, Shield, Database, Activity, Terminal
} from 'lucide-react';
import {
  getUserPosts, getUserReels, deletePost, deleteReel,
  updatePost, updateReel, createPost, createReel, uploadMedia
} from '@/services/socialService';
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

    // Real-time deletion sync listener across entire application
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

  // ── Items ─────────────────────────────────────────────────────────────────
  const filteredItems = items;

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

      toast.success('Asset Purged from VaultD! ⚡');
      setItems(prev => prev.filter(i => i.id !== deleteItem.id));
      setDeleteItem(null);
    } catch (err: any) {
      console.error('[VaultTab] Delete error:', err);
      toast.error(err?.message || "Couldn't delete content.");
    }
  };

  return (
    <div className="space-y-6 text-text-primary">
      {/* ── FUTURISTIC VAULT:D HUD BANNER ─────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-[#080808] border border-[#CCFF00]/25 p-6 sm:p-8 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
        {/* Dynamic Cyber Grid & Scanline Background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(rgba(204,255,0,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(204,255,0,0.08) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ background: 'radial-gradient(circle, #CCFF00 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-15"
          style={{ background: 'radial-gradient(circle, #00D4FF 0%, transparent 70%)' }}
        />

        {/* Futuristic Corner HUD Markers */}
        <div className="absolute top-2 left-2 text-[#CCFF00]/40 font-mono text-[9px] select-none">+ [SYS_VAULT_CORE]</div>
        <div className="absolute top-2 right-2 text-[#CCFF00]/40 font-mono text-[9px] select-none">[SECURE_ENCLAVE_256] +</div>
        <div className="absolute bottom-2 left-2 text-[#CCFF00]/40 font-mono text-[9px] select-none">+ [SSR_FEED_LINKED]</div>
        <div className="absolute bottom-2 right-2 text-[#CCFF00]/40 font-mono text-[9px] select-none">[QUANTUM_SYNC] +</div>

        <div className="relative z-10 space-y-6">
          {/* Header Top Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              {/* Animated Holographic Core Icon */}
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#121212] border border-[#CCFF00]/40 flex items-center justify-center flex-shrink-0 shadow-[0_0_25px_rgba(204,255,0,0.25)] group">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#CCFF00]/20 to-transparent animate-pulse" />
                <Database size={28} className="text-[#CCFF00] relative z-10 drop-shadow-[0_0_8px_rgba(204,255,0,0.8)]" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#CCFF00] opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#CCFF00]" />
                </span>
              </div>

              {/* Title & Telemetry Status */}
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white flex items-center gap-2 font-display">
                    VAULT<span className="text-[#CCFF00] drop-shadow-[0_0_12px_rgba(204,255,0,0.6)]">:D</span>
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/40 font-mono text-[10px] font-bold text-[#CCFF00] tracking-widest uppercase flex items-center gap-1.5 shadow-[0_0_10px_rgba(204,255,0,0.15)]">
                    <Zap size={10} className="fill-[#CCFF00]" />
                    {counts.total} {counts.total === 1 ? 'RECORD' : 'RECORDS'} ACTIVE
                  </span>
                  <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/30 font-mono text-[10px] font-bold text-[#00D4FF] tracking-widest uppercase items-center gap-1">
                    <Shield size={10} /> ENCRYPTED
                  </span>
                </div>
                <p className="font-mono text-xs text-text-secondary mt-1.5 max-w-2xl leading-relaxed">
                  Decentralized athlete intelligence and media storage bank. Upload high-res reels, 4K performance photos, verified highlight clips, and match logs linked directly to your PlayerDNA.
                </p>
              </div>
            </div>

            {/* Action Button (Owner Only) */}
            {isMe && (
              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowUploadModal(true)}
                className="relative group px-6 py-3 rounded-2xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(204,255,0,0.4)] cursor-pointer overflow-hidden flex-shrink-0"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                <Plus size={16} className="stroke-[3]" />
                <span>Drop your Post</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* ── LOADING SKELETON WITH CYBER SCAN ─────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
            <div
              key={n}
              className="aspect-square rounded-2xl bg-[#101010] border border-white/10 relative overflow-hidden flex flex-col justify-between p-3.5"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#CCFF00]/5 to-transparent animate-pulse" />
              <div className="w-16 h-4 rounded-lg bg-white/5" />
              <div className="w-full h-8 rounded-lg bg-white/5" />
            </div>
          ))}
        </div>
      )}

      {/* ── FUTURISTIC EMPTY STATE ────────────────────────────────────────── */}
      {!loading && filteredItems.length === 0 && (
        <div className="relative overflow-hidden rounded-3xl bg-[#080808] border border-white/10 p-12 text-center space-y-6 shadow-2xl">
          <div className="relative w-24 h-24 rounded-3xl bg-[#121212] border border-[#CCFF00]/30 mx-auto flex items-center justify-center text-[#CCFF00] shadow-[0_0_30px_rgba(204,255,0,0.15)]">
            <div className="absolute inset-0 rounded-3xl border border-[#CCFF00]/20 animate-ping opacity-25" />
            <Database size={40} className="drop-shadow-[0_0_12px_rgba(204,255,0,0.8)]" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <span className="font-mono text-[10px] font-bold text-[#CCFF00] uppercase tracking-widest block">
              // TELEMETRY REPOSITORY EMPTY
            </span>
            <h3 className="font-sans font-black text-xl text-white uppercase tracking-wider">
              No VaultD Records Ingested
            </h3>
            <p className="font-mono text-xs text-text-muted leading-relaxed">
              {isMe
                ? 'Initialize your athlete profile archive. Deposit your first 4K match picture, video reel, or tactical highlight to showcase your game to scouts.'
                : `${athleteName} has not deposited any public media assets into their VaultD archive yet.`}
            </p>
          </div>

          {isMe && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-7 py-3 rounded-2xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-mono font-black text-xs uppercase tracking-wider transition-all inline-flex items-center gap-2 shadow-[0_0_25px_rgba(204,255,0,0.35)] cursor-pointer"
            >
              <Plus size={16} className="stroke-[3]" />
              <span>Drop your Post</span>
            </button>
          )}
        </div>
      )}

      {/* ── FUTURISTIC RESPONSIVE ASSET MATRIX GRID ───────────────────────── */}
      {!loading && filteredItems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
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
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-[#0C0C0C] border border-white/10 hover:border-[#CCFF00]/70 transition-all duration-300 shadow-xl hover:shadow-[0_0_30px_rgba(204,255,0,0.2)] flex flex-col justify-between"
              >
                {/* Cyber Corner HUD Highlights on Hover */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-transparent group-hover:border-[#CCFF00] transition-colors z-20 pointer-events-none" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-transparent group-hover:border-[#CCFF00] transition-colors z-20 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-transparent group-hover:border-[#CCFF00] transition-colors z-20 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-transparent group-hover:border-[#CCFF00] transition-colors z-20 pointer-events-none" />

                {/* Media Preview or Fallback */}
                {item.mediaUrl ? (
                  item.mediaType === 'video' ? (
                    <div className="absolute inset-0 bg-black flex items-center justify-center">
                      <video src={item.mediaUrl} className="w-full h-full object-cover opacity-85" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />

                      {/* Animated Holographic Play Button */}
                      <div className="w-11 h-11 rounded-2xl bg-[#CCFF00] flex items-center justify-center text-black shadow-[0_0_20px_rgba(204,255,0,0.5)] z-10 transition-transform group-hover:scale-110">
                        <Play size={18} className="ml-0.5 fill-black" />
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0">
                      <img
                        src={item.mediaUrl}
                        alt={item.caption}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />
                    </div>
                  )
                ) : (
                  <div className="absolute inset-0 p-4 bg-[#101010] flex flex-col justify-between border border-white/5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[#CCFF00] font-mono text-[9px] uppercase tracking-widest">
                        <Terminal size={10} /> TELEMETRY LOG
                      </div>
                      <p className="font-sans text-xs text-white line-clamp-4 leading-relaxed font-medium">
                        "{item.caption}"
                      </p>
                    </div>
                    <div className="font-mono text-[9px] text-text-muted flex items-center justify-between border-t border-white/5 pt-2">
                      <span>{formattedDate}</span>
                      <span>{formattedTime}</span>
                    </div>
                  </div>
                )}

                {/* Top Badge Overlay */}
                <div className="relative z-10 p-2.5 flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-md border border-white/15 font-mono text-[9px] font-bold text-[#CCFF00] uppercase tracking-wider flex items-center gap-1">
                    {item.mediaType === 'photo' && <ImageIcon size={10} />}
                    {item.mediaType === 'video' && <Video size={10} />}
                    {item.mediaType === 'highlight' && <Trophy size={10} />}
                    {item.mediaType === 'post' && <FileText size={10} />}
                    {item.mediaType}
                  </span>

                  {/* Owner Action Menu Trigger */}
                  {isMe && (
                    <div className="relative">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setActionMenuId(actionMenuId === item.id ? null : item.id);
                        }}
                        className="w-7 h-7 rounded-lg bg-black/80 hover:bg-[#CCFF00] hover:text-black backdrop-blur-md border border-white/15 text-white flex items-center justify-center transition-all cursor-pointer"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {/* Futuristic Context Dropdown Menu */}
                      {actionMenuId === item.id && (
                        <div
                          onClick={e => e.stopPropagation()}
                          className="absolute right-0 top-8 w-48 rounded-2xl bg-[#101010]/95 backdrop-blur-2xl border border-[#CCFF00]/30 shadow-[0_10px_30px_rgba(0,0,0,0.9)] p-1.5 z-30 space-y-1 font-mono text-xs"
                        >
                          <button
                            onClick={() => {
                              setActionMenuId(null);
                              setDetailItem(item);
                            }}
                            className="w-full px-3 py-2 rounded-xl text-left text-white hover:bg-[#CCFF00] hover:text-black flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Eye size={13} /> [ VIEW_TELEMETRY ]
                          </button>
                          <button
                            onClick={() => {
                              setActionMenuId(null);
                              toast.success('Synced to HypeZone! Live on feed.');
                            }}
                            className="w-full px-3 py-2 rounded-xl text-left text-white hover:bg-[#CCFF00] hover:text-black flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Sparkles size={13} /> [ BROADCAST_FEED ]
                          </button>
                          <button
                            onClick={() => {
                              setActionMenuId(null);
                              setEditItem(item);
                            }}
                            className="w-full px-3 py-2 rounded-xl text-left text-white hover:bg-[#CCFF00] hover:text-black flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Edit3 size={13} /> [ EDIT_METADATA ]
                          </button>
                          <button
                            onClick={() => {
                              setActionMenuId(null);
                              setDeleteItem(item);
                            }}
                            className="w-full px-3 py-2 rounded-xl text-left text-red-400 hover:bg-red-500 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} /> [ PURGE_RECORD ]
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Caption & Trigger */}
                <div
                  onClick={() => setDetailItem(item)}
                  className="relative z-10 p-3 cursor-pointer group-hover:bg-black/30 transition-all"
                >
                  {item.mediaUrl && (
                    <p className="font-sans text-xs text-white line-clamp-1 drop-shadow-md font-semibold">
                      {item.caption || 'Untitled asset'}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center justify-between mt-1.5 font-mono text-[9px] text-white/80 gap-1">
                    <span className="flex items-center gap-1">
                      <span>{formattedDate}</span>
                    </span>
                    {item.sportTag && (
                      <span className="px-1.5 py-0.2 rounded bg-[#CCFF00]/15 border border-[#CCFF00]/30 text-[#CCFF00] font-bold">
                        #{item.sportTag}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── FUTURISTIC DETAIL MODAL ───────────────────────────────────────── */}
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

      {/* ── FUTURISTIC UPLOAD MODAL ───────────────────────────────────────── */}
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

      {/* ── FUTURISTIC EDIT MODAL ─────────────────────────────────────────── */}
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

      {/* ── FUTURISTIC DELETE CONFIRMATION MODAL ──────────────────────────── */}
      {deleteItem && isMe && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-sm w-full bg-[#0E0E0E] border border-red-500/40 rounded-3xl p-6 space-y-5 shadow-[0_0_50px_rgba(239,68,68,0.25)]"
          >
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <Trash2 size={24} />
            </div>

            <div className="text-center space-y-1.5">
              <span className="font-mono text-[10px] font-bold text-red-400 uppercase tracking-widest">
                // PURGE PROTOCOL
              </span>
              <h3 className="font-sans font-black text-lg text-white uppercase tracking-wider">
                Purge Vault Asset?
              </h3>
              <p className="font-mono text-xs text-text-muted leading-relaxed">
                This action is permanent and will remove this media record from your VaultD archive and public HypeZone feeds.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteItem(null)}
                className="flex-1 py-3 rounded-xl border border-white/10 font-mono text-xs text-text-secondary hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                [ ABORT ]
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-mono text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] cursor-pointer"
              >
                [ PURGE_DATA ]
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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-3xl w-full bg-[#0E0E0E] border border-[#CCFF00]/30 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.95)]"
      >
        {/* Header HUD */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#141414]">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-xl bg-[#CCFF00]/15 border border-[#CCFF00]/40 font-mono text-xs font-bold text-[#CCFF00] uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={12} />
              {item.mediaType}
            </span>
            <span className="font-mono text-xs text-text-muted">{formattedDate}</span>
          </div>

          <div className="flex items-center gap-2">
            {isMe && (
              <>
                <button
                  onClick={onEdit}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-[#CCFF00] hover:text-black border border-white/10 text-text-secondary transition-all cursor-pointer"
                  title="Edit details"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={onDelete}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500 hover:text-white border border-white/10 text-red-400 transition-all cursor-pointer"
                  title="Delete item"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-text-secondary hover:text-white transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Media Player / Holographic Display */}
        <div className="bg-black flex items-center justify-center max-h-[62vh] overflow-hidden relative">
          {item.mediaUrl ? (
            item.mediaType === 'video' ? (
              <video src={item.mediaUrl} controls autoPlay className="w-full max-h-[62vh] object-contain" />
            ) : (
              <img src={item.mediaUrl} alt={item.caption} className="w-full max-h-[62vh] object-contain" />
            )
          ) : (
            <div className="p-10 text-center max-w-lg mx-auto space-y-2">
              <Terminal size={32} className="text-[#CCFF00] mx-auto opacity-75" />
              <p className="font-sans text-base text-white leading-relaxed font-medium">
                "{item.caption}"
              </p>
            </div>
          )}
        </div>

        {/* Details Footer Telemetry */}
        <div className="p-6 space-y-4 bg-[#0A0A0A] border-t border-white/10">
          {item.mediaUrl && (
            <p className="font-sans text-sm text-text-primary leading-relaxed">
              {item.caption || 'No caption provided.'}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/10 font-mono text-xs text-text-muted">
            <div className="flex items-center gap-4">
              <span className="text-[#CCFF00] font-bold">⚡ {item.likesCount} Pulse Reactions</span>
              <span>💬 {item.commentsCount} Comments</span>
            </div>
            {item.sportTag && (
              <span className="px-3 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00] font-bold">
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
      setErrorMessage('Please add some caption text or attach a media asset to deposit.');
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
        title: 'Post Dropped ⚡',
        message: `Dropped post: "${caption.slice(0, 40) || 'New Post'}" is live on SPORTiX.`,
        read: false,
      }).catch(() => null);

      useNotificationStore.getState().addNotification({
        id: `notif_post_${Date.now()}`,
        userId: authUser.id,
        type: 'post_created' as any,
        title: 'Post Dropped ⚡',
        message: `Dropped post: "${caption.slice(0, 40) || 'New Post'}" is live on SPORTiX.`,
        timestamp: new Date().toISOString(),
        read: false,
      });

      toast.success('Post dropped to VaultD! ⚡ Live on feed.');
      onSuccess();
    } catch (err: any) {
      console.error('[CreatePostModal] Upload error:', err);
      setErrorMessage(err?.message || "Couldn't drop post. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-lg w-full bg-[#0E0E0E] border border-[#CCFF00]/30 rounded-3xl p-6 sm:p-7 space-y-5 shadow-[0_0_60px_rgba(0,0,0,0.9)]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#CCFF00]/15 border border-[#CCFF00]/30 flex items-center justify-center text-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.2)]">
              <Database size={20} />
            </div>
            <div>
              <span className="font-mono text-[9px] font-bold text-[#CCFF00] uppercase tracking-widest block">
                // VAULTD FEED TERMINAL
              </span>
              <h3 className="font-sans font-black text-base text-white uppercase tracking-wider">
                Drop Post
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Identity HUD */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#141414] border border-white/5">
          <div className="w-10 h-10 rounded-xl bg-black border border-[#CCFF00]/30 overflow-hidden flex-shrink-0">
            {athleteAvatar ? (
              <img src={athleteAvatar} alt={athleteName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-sm text-[#CCFF00]">
                {athleteName.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <div className="font-sans font-bold text-xs text-white">{athleteName}</div>
            <div className="font-mono text-[10px] text-text-muted">@{athleteUsername} • ATHLETE CORE</div>
          </div>
        </div>

        {/* Text Area */}
        <div className="space-y-1.5">
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            rows={3}
            placeholder="Enter match telemetry, stats, tournament highlights, or tactical notes..."
            className="w-full bg-[#141414] border border-white/10 rounded-2xl p-4 font-sans text-xs text-white placeholder-text-muted outline-none focus:border-[#CCFF00] resize-none leading-relaxed transition-colors"
          />
        </div>

        {/* Media Preview or Drop Zone */}
        {previewUrl ? (
          <div className="relative rounded-2xl overflow-hidden bg-black max-h-48 flex items-center justify-center border border-[#CCFF00]/30 group">
            {isVideo ? (
              <video src={previewUrl} controls className="max-h-48 w-full object-contain" />
            ) : (
              <img src={previewUrl} alt="Upload preview" className="max-h-48 w-full object-cover" />
            )}
            <button
              onClick={handleRemoveMedia}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 hover:bg-red-500 text-white transition-all shadow-md cursor-pointer"
              title="Remove media"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <label className="relative border-2 border-dashed border-white/15 hover:border-[#CCFF00]/60 rounded-2xl p-5 text-center cursor-pointer transition-all bg-[#121212] hover:bg-[#161616] flex items-center justify-center gap-3.5 group">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-11 h-11 rounded-xl bg-black border border-white/10 group-hover:border-[#CCFF00]/40 flex items-center justify-center text-[#CCFF00] transition-colors">
              <Upload size={20} />
            </div>
            <div className="text-left">
              <span className="font-mono text-xs text-white font-bold block">
                Attach 4K Media / Video Reel
              </span>
              <span className="font-mono text-[10px] text-text-muted block">
                MP4, MOV, PNG, JPEG up to 100MB (Quantum Encrypted)
              </span>
            </div>
          </label>
        )}

        {/* Sport Tag Selector */}
        <SportTagSelector
          value={sportTag}
          onChange={setSportTag}
          label="SPORT TAG:"
          className="pt-1"
        />

        {/* Progress Bar */}
        {uploading && (
          <div className="space-y-1.5">
            <div className="flex justify-between font-mono text-[10px] text-[#CCFF00] font-bold">
              <span>Publishing post...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-black overflow-hidden border border-white/10">
              <div
                className="h-full bg-[#CCFF00] transition-all duration-300 shadow-[0_0_10px_#CCFF00]"
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
            className="flex-1 py-3 rounded-xl border border-white/10 font-mono text-xs text-text-secondary hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUploadSubmit}
            disabled={uploading}
            className="flex-1 py-3 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-mono font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(204,255,0,0.35)] cursor-pointer disabled:opacity-50"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {uploading ? 'Dropping Post...' : 'Drop Post'}
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

      toast.success('VaultD Asset Reconfigured! ⚡');
      onSuccess();
    } catch (err: any) {
      console.error('[VaultEditModal] Save error:', err);
      toast.error(err?.message || "Couldn't update item.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full bg-[#0E0E0E] border border-[#CCFF00]/30 rounded-3xl p-6 space-y-4 shadow-[0_0_50px_rgba(0,0,0,0.9)]"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span className="font-mono text-[9px] font-bold text-[#CCFF00] uppercase tracking-widest block">
              // RECONFIGURE METADATA
            </span>
            <h3 className="font-sans font-black text-base text-white uppercase tracking-wider">
              Edit VaultD Asset
            </h3>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-white p-1 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Change Media Option */}
        <div className="space-y-2">
          <label className="block font-mono text-xs text-text-muted">Replace Media File</label>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-black border border-white/10 flex items-center justify-center flex-shrink-0">
              {newPreview ? (
                <img src={newPreview} className="w-full h-full object-cover" />
              ) : item.mediaUrl ? (
                <img src={item.mediaUrl} className="w-full h-full object-cover" />
              ) : (
                <FileText size={20} className="text-text-muted" />
              )}
            </div>
            <label className="px-3.5 py-2 rounded-xl bg-[#141414] border border-white/10 hover:border-[#CCFF00]/40 text-white font-mono text-xs cursor-pointer transition-colors">
              Select New File
              <input type="file" onChange={handleMediaFileChange} className="hidden" />
            </label>
          </div>
        </div>

        {/* Edit Caption */}
        <div className="space-y-1.5">
          <label className="block font-mono text-xs text-text-muted">Caption / Telemetry Content</label>
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            rows={3}
            className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 font-sans text-xs text-white outline-none focus:border-[#CCFF00] resize-none transition-colors"
          />
        </div>

        {/* Edit Sport Tag */}
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
            className="flex-1 py-3 rounded-xl border border-white/10 font-mono text-xs text-text-secondary hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-mono font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(204,255,0,0.35)] cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default VaultTab;
