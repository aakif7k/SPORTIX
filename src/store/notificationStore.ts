import { create } from 'zustand';
import type { Notification } from '../types';
import { MOCK_NOTIFICATIONS } from '../services/mockData';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  addNotification: (n: Notification) => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: MOCK_NOTIFICATIONS,
  unreadCount: MOCK_NOTIFICATIONS.filter(n => !n.read).length,
  markRead: (id) => set(state => {
    const updated = state.notifications.map(n => n.id === id ? { ...n, read: true } : n);
    return { notifications: updated, unreadCount: updated.filter(n => !n.read).length };
  }),
  markAllRead: () => set(state => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadCount: 0,
  })),
  clearAll: () => set({ notifications: [], unreadCount: 0 }),
  addNotification: (n) => set(state => ({
    notifications: [n, ...state.notifications],
    unreadCount: state.unreadCount + 1,
  })),
  reset: () => set({ notifications: [], unreadCount: 0 }),
}));

