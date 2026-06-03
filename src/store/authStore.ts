import { create } from 'zustand';
import type { User } from '../types';
import { CURRENT_USER } from '../services/mockData';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authLoading: boolean;
  showLogoutConfirm: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => void;
  setUser: (user: User | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setShowLogoutConfirm: (show: boolean) => void;
}

// Simple local storage keys for persistence so session stays active on reload
const SESSION_USER_KEY = 'sportix-user';

const getInitialUser = (): User | null => {
  try {
    const saved = localStorage.getItem(SESSION_USER_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const initialUser = getInitialUser();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  isAuthenticated: !!initialUser,
  isLoading: false,
  authLoading: false, // Immediately false for fast local-only loading
  showLogoutConfirm: false,

  login: async (email, password) => {
    set({ isLoading: true });
    // Reading variables to satisfy strict TS rules
    const _credentials = { email, password };
    
    // Simulate minor network delay
    await new Promise(r => setTimeout(r, 800));

    // Handle standard demo email or generate custom mock user
    const mockUser: User = {
      ...CURRENT_USER,
      email: _credentials.email,
      name: _credentials.email === 'demo@sportix.io' ? CURRENT_USER.name : _credentials.email.split('@')[0],
      username: _credentials.email.split('@')[0],
    };

    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(mockUser));
    set({ user: mockUser, isAuthenticated: true, isLoading: false });
  },

  signup: async (email, password, name, role) => {
    set({ isLoading: true });
    // Reading variables to satisfy strict TS rules
    const _signUpData = { email, password, name, role };
    
    // Simulate minor network delay
    await new Promise(r => setTimeout(r, 1000));

    const mockUser: User = {
      ...CURRENT_USER,
      email: _signUpData.email,
      name: _signUpData.name,
      username: _signUpData.email.split('@')[0],
      role: _signUpData.role as any,
    };

    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(mockUser));
    set({ user: mockUser, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    localStorage.removeItem(SESSION_USER_KEY);
    set({ user: null, isAuthenticated: false, showLogoutConfirm: false });
  },

  updateProfile: (updates) => set(state => {
    const updatedUser = state.user ? { ...state.user, ...updates } : null;
    if (updatedUser) {
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(updatedUser));
    } else {
      localStorage.removeItem(SESSION_USER_KEY);
    }
    return { user: updatedUser };
  }),

  setUser: (user) => set(() => {
    if (user) {
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_USER_KEY);
    }
    return { user, isAuthenticated: !!user };
  }),

  setAuthLoading: (loading) => set({ authLoading: loading }),
  setShowLogoutConfirm: (show) => set({ showLogoutConfirm: show }),
}));
