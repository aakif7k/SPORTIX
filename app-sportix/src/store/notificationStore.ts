/**
 * src/store/notificationStore.ts
 */
import { create } from 'zustand';
import { AppNotification } from '../types';

interface NotificationState {
  notifications: AppNotification[];
  unreadCount:   number;
  loading:       boolean;

  setNotifications: (notifs: AppNotification[]) => void;
  addNotification:  (notif: AppNotification) => void;
  markAllRead:      () => void;
  markRead:         (id: string) => void;
  setLoading:       (loading: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount:   0,
  loading:       false,

  setNotifications: (notifications) => {
    const unreadCount = notifications.filter(n => !n.is_read).length;
    set({ notifications, unreadCount });
  },

  addNotification: (notif) => {
    const notifications = [notif, ...get().notifications];
    set({ notifications, unreadCount: notifications.filter(n => !n.is_read).length });
  },

  markRead: (id) => {
    const notifications = get().notifications.map(n =>
      n.$id === id ? { ...n, is_read: true } : n
    );
    set({ notifications, unreadCount: notifications.filter(n => !n.is_read).length });
  },

  markAllRead: () => {
    const notifications = get().notifications.map(n => ({ ...n, is_read: true }));
    set({ notifications, unreadCount: 0 });
  },

  setLoading: (loading) => set({ loading }),
}));
