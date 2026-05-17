import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCheck, Trash2, Calendar, Brain, User2, Heart, Clock, Trophy } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import type { Notification, NotificationType } from '../../types';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';

const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; color: string; bg: string }> = {
  event_invite: { icon: Calendar, color: 'text-volt', bg: 'bg-volt/10 border-volt/20' },
  ai_match: { icon: Brain, color: 'text-purple-400', bg: 'bg-purple-900/30 border-purple-500/20' },
  connection_request: { icon: User2, color: 'text-blue-400', bg: 'bg-blue-900/30 border-blue-500/20' },
  like: { icon: Heart, color: 'text-white', bg: 'bg-white/5 border-border-muted' },
  comment: { icon: Heart, color: 'text-white', bg: 'bg-white/5 border-border-muted' },
  match_reminder: { icon: Clock, color: 'text-hot', bg: 'bg-hot/10 border-hot/20' },
  team_update: { icon: Brain, color: 'text-purple-400', bg: 'bg-purple-900/30 border-purple-500/20' },
  achievement: { icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-500/20' },
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

const NotifItem: React.FC<{ notif: Notification }> = ({ notif }) => {
  const { markRead } = useNotificationStore();
  const config = TYPE_CONFIG[notif.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 2 }}
      onClick={() => markRead(notif.id)}
      className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${notif.read ? 'glass border-transparent opacity-60 hover:opacity-80' : 'glass-strong border-volt/10 hover:border-volt/20'}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${config.bg}`}>
        <Icon size={18} className={config.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-label text-sm font-semibold text-white">{notif.title}</p>
          <span className="font-mono text-[10px] text-text-muted flex-shrink-0">{timeAgo(notif.timestamp)}</span>
        </div>
        <p className="text-xs text-text-secondary font-label mt-0.5 leading-relaxed">{notif.message}</p>
      </div>
      {!notif.read && <div className="w-2 h-2 rounded-full bg-volt shadow-glow-volt-sm flex-shrink-0 mt-1" />}
    </motion.div>
  );
};

const GroupLabel: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-3 py-2">
    <div className="h-px flex-1 bg-border-muted" />
    <span className="stat-label text-xs px-2">{label}</span>
    <div className="h-px flex-1 bg-border-muted" />
  </div>
);

export const NotificationCenter: React.FC = () => {
  const { notifications, unreadCount, markAllRead, clearAll } = useNotificationStore();

  const today = notifications.filter(n => isToday(n.timestamp));
  const yesterday = notifications.filter(n => isYesterday(n.timestamp));
  const earlier = notifications.filter(n => !isToday(n.timestamp) && !isYesterday(n.timestamp));

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl text-white tracking-wide">BUZZ</h1>
          {unreadCount > 0 && <p className="text-text-secondary font-label text-sm mt-0.5">{unreadCount} unread buzzes</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" icon={<CheckCheck size={14} />} onClick={markAllRead}>Mark All Read</Button>
          <Button variant="icon" size="sm" icon={<Trash2 size={14} />} onClick={clearAll} />
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <p className="font-display text-3xl text-white/30 mb-2">ALL CLEAR</p>
          <p className="text-text-muted font-label text-sm">No notifications right now</p>
        </div>
      ) : (
        <div className="space-y-2">
          {today.length > 0 && (
            <><GroupLabel label="TODAY" />{today.map(n => <NotifItem key={n.id} notif={n} />)}</>
          )}
          {yesterday.length > 0 && (
            <><GroupLabel label="YESTERDAY" />{yesterday.map(n => <NotifItem key={n.id} notif={n} />)}</>
          )}
          {earlier.length > 0 && (
            <><GroupLabel label="EARLIER" />{earlier.map(n => <NotifItem key={n.id} notif={n} />)}</>
          )}
        </div>
      )}
    </div>
  );
};
