import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authLoading: boolean;
  showLogoutConfirm: boolean;
  updateProfile: (updates: Partial<User>) => void;
  setUser: (user: User | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setShowLogoutConfirm: (show: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  authLoading: true,
  showLogoutConfirm: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  updateProfile: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),

  setAuthLoading: (loading) => set({ authLoading: loading }),
  setShowLogoutConfirm: (show) => set({ showLogoutConfirm: show }),
}));
