import { create } from 'zustand';
import type { Notification } from '../types';
import { getNotifications, markNotificationRead, markAllNotificationsRead, clearAllNotifications } from '../services/notificationService';
import { useAuthStore } from './authStore';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loadNotifications: () => Promise<void>;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  addNotification: (n: Notification) => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  
  loadNotifications: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    const notifications = await getNotifications(user.id);
    set({ notifications, unreadCount: notifications.filter(n => !n.read).length });
  },

  markRead: (id) => {
    set(state => {
      const updated = state.notifications.map(n => n.id === id ? { ...n, read: true } : n);
      return { notifications: updated, unreadCount: updated.filter(n => !n.read).length };
    });
    markNotificationRead(id);
  },

  markAllRead: () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
    }));
    const user = useAuthStore.getState().user;
    if (user) markAllNotificationsRead(user.id);
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
    const user = useAuthStore.getState().user;
    if (user) clearAllNotifications(user.id);
  },

  addNotification: (n) => set(state => ({
    notifications: [n, ...state.notifications],
    unreadCount: state.unreadCount + 1,
  })),

  reset: () => set({ notifications: [], unreadCount: 0 }),
}));

