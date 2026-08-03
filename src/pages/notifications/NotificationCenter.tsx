import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCheck, Trash2, Calendar, Brain, User2, Heart, Clock, Trophy, 
  Bell, CheckCircle2
} from 'lucide-react';
import { useNotifications, type ApiNotification } from '@/hooks/useNotifications';
import type { NotificationType } from '../../types';

const UPCOMING_DROPS = [
  { id: 1, title: 'Summer Championship Bracket', time: '14:00', type: 'Tournament' },
  { id: 2, title: 'Pro Scouting Live Stream', time: '16:30', type: 'Event' },
  { id: 3, title: 'Pulse Level 50 Rewards Drop', time: '18:00', type: 'Reward' },
];

const UpcomingDropsRow: React.FC = () => (
  <div className="mb-6 space-y-3">
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-[#FF3B00] animate-pulse" />
      <span className="font-mono text-[10px] font-bold text-text-muted tracking-widest uppercase">UPCOMING SCHEDULED DROPS</span>
    </div>
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
      {UPCOMING_DROPS.map((drop, i) => (
        <motion.div 
          key={drop.id} 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: i * 0.1 }}
          className="flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface border border-border-muted/80 shadow-md hover:border-[#FF3B00]/40 transition-all cursor-pointer group"
        >
          <div className="flex flex-col items-center justify-center font-mono">
            <span className="text-sm font-black text-[#FF3B00] leading-none">{drop.time.split(':')[0]}</span>
            <span className="text-[9px] text-text-muted leading-none">{drop.time.split(':')[1]}</span>
          </div>
          <div className="w-px h-7 bg-white/10" />
          <div className="flex flex-col">
            <span className="font-sans font-bold text-xs text-white group-hover:text-[#FF3B00] transition-colors">{drop.title}</span>
            <span className="font-mono text-[9px] text-text-secondary">{drop.type}</span>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

const TYPE_CONFIG: Record<NotificationType, { icon: React.ComponentType<{ size?: number; className?: string }>; color: string; bg: string }> = {
  event_invite: { icon: Calendar, color: 'text-[#CCFF00]', bg: 'bg-[#CCFF00]/10 border-[#CCFF00]/30' },
  ai_match: { icon: Brain, color: 'text-[#00D4FF]', bg: 'bg-[#00D4FF]/10 border-[#00D4FF]/30' },
  connection_request: { icon: User2, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  like: { icon: Heart, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
  comment: { icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/30' },
  match_reminder: { icon: Clock, color: 'text-[#FF6B00]', bg: 'bg-[#FF6B00]/10 border-[#FF6B00]/30' },
  team_update: { icon: Brain, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
  achievement: { icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
};

const timeAgo = (ts: string) => {
  const d = (Date.now() - new Date(ts).getTime()) / 1000;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
};

const isToday = (ts: string) => new Date(ts).toDateString() === new Date().toDateString();
const isYesterday = (ts: string) => {
  const y = new Date(); y.setDate(y.getDate() - 1);
  return new Date(ts).toDateString() === y.toDateString();
};

const NotifItem: React.FC<{
  notif: ApiNotification;
  onRead: (id: string) => void;
}> = ({ notif, onRead }) => {
  const config = TYPE_CONFIG[notif.type as keyof typeof TYPE_CONFIG] || { icon: Bell, color: 'text-white', bg: 'bg-elevated border-white/10' };
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={() => onRead(notif.$id)}
      className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
        notif.is_read ? 'bg-surface/50 border-border-muted/50 opacity-60' : 'bg-surface border-[#FF3B00]/30 shadow-md'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${config.bg}`}>
        <Icon size={18} className={config.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-sans font-bold text-sm text-white">{notif.title}</p>
          <span className="font-mono text-[10px] text-text-muted flex-shrink-0">{timeAgo(notif.created_at)}</span>
        </div>
        <p className="text-xs text-text-secondary font-sans mt-1 leading-relaxed">{notif.body}</p>
      </div>
      {!notif.is_read && <div className="w-2.5 h-2.5 rounded-full bg-[#FF3B00] shadow-[0_0_8px_rgba(255,59,0,0.8)] flex-shrink-0 mt-1.5" />}
    </motion.div>
  );
};

const GroupLabel: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-3 py-3">
    <div className="h-px flex-1 bg-white/10" />
    <span className="font-mono text-[10px] font-bold text-text-muted uppercase tracking-widest px-2">{label}</span>
    <div className="h-px flex-1 bg-white/10" />
  </div>
);

export const NotificationCenter: React.FC = () => {
  const {
    notifications, unreadCount, loading, error,
    markRead, markAllRead, clearAll, refresh,
  } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications;

  const today = filteredNotifications.filter(n => isToday(n.created_at));
  const yesterday = filteredNotifications.filter(n => isYesterday(n.created_at));
  const earlier = filteredNotifications.filter(n => !isToday(n.created_at) && !isYesterday(n.created_at));

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#1A0A05] via-[#0C0A0A] to-[#0A1015] border border-[#FF3B00]/20 shadow-[0_0_40px_rgba(255,59,0,0.15)]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF3B00]/10 border border-[#FF3B00]/30 font-mono text-[10px] font-bold text-[#FF3B00] uppercase tracking-widest mb-2">
            <Bell size={12} /> LIVE ACTIVITY FEED
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">
            BUZZ <span className="text-[#FF3B00]">NOTIFICATIONS</span>
          </h1>
          <p className="text-xs text-text-secondary font-mono mt-1">
            {unreadCount > 0 ? `${unreadCount} unread activity updates` : 'All caught up!'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={markAllRead}
            className="px-4 py-2.5 rounded-xl bg-elevated border border-white/10 hover:border-[#FF3B00]/40 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
          >
            <CheckCheck size={14} className="text-[#CCFF00]" /> Read All
          </button>
          <button
            onClick={clearAll}
            className="p-2.5 rounded-xl bg-elevated border border-white/10 hover:border-red-500/40 text-red-400 transition-all"
            title="Clear all notifications"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* ── SCHEDULED DROPS ────────────────────────────────────────────── */}
      <UpcomingDropsRow />

      {/* ── FILTER SWITCHER ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all ${
            filter === 'all' ? 'bg-[#FF3B00] text-white shadow-[0_0_12px_rgba(255,59,0,0.4)]' : 'bg-surface border border-border-muted text-text-secondary hover:text-white'
          }`}
        >
          All Activity ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all ${
            filter === 'unread' ? 'bg-[#FF3B00] text-white shadow-[0_0_12px_rgba(255,59,0,0.4)]' : 'bg-surface border border-border-muted text-text-secondary hover:text-white'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* ── NOTIFICATION LIST ──────────────────────────────────────────── */}
      {filteredNotifications.length === 0 ? (
        <div className="p-12 rounded-3xl bg-surface border border-border-muted text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FF3B00]/10 border border-[#FF3B00]/30 mx-auto flex items-center justify-center text-[#FF3B00]">
            <CheckCircle2 size={24} />
          </div>
          <p className="font-sans font-bold text-base text-white">ALL CLEAR</p>
          <p className="text-xs text-text-secondary font-mono">You have no pending unread notifications in your Buzz feed.</p>
        </div>
      ) : loading ? (
        <div className="space-y-2" aria-busy="true" aria-label="Loading notifications">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-surface border border-border-muted">
              <div className="w-10 h-10 rounded-xl bg-elevated animate-shimmer" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 rounded bg-elevated animate-shimmer" />
                <div className="h-2 w-2/3 rounded bg-elevated animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-surface border border-border-muted p-8 text-center space-y-3">
          <p className="font-display text-[15px] tracking-wider text-text-primary uppercase">
            Could not load notifications
          </p>
          <p className="font-mono text-[11px] text-text-secondary">
            {error.isNetwork ? 'The server is unreachable.' : error.message}
          </p>
          <button
            onClick={() => refresh()}
            className="px-4 py-2 rounded-full bg-accent text-black font-mono text-[11px] font-bold uppercase tracking-wider hover:bg-accent/90 transition-all"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {today.length > 0 && (
            <><GroupLabel label="TODAY" />{today.map(n => <NotifItem key={n.$id} notif={n} onRead={markRead} />)}</>
          )}
          {yesterday.length > 0 && (
            <><GroupLabel label="YESTERDAY" />{yesterday.map(n => <NotifItem key={n.$id} notif={n} onRead={markRead} />)}</>
          )}
          {earlier.length > 0 && (
            <><GroupLabel label="EARLIER" />{earlier.map(n => <NotifItem key={n.$id} notif={n} onRead={markRead} />)}</>
          )}
        </div>
      )}
    </div>
  );
};
