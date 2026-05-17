import { create } from 'zustand';
import type { User } from '../types';
import { CURRENT_USER } from '../services/mockData';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, _password: string) => Promise<void>;
  signup: (email: string, _password: string, name: string, role: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: async (_email, _password) => {
    set({ isLoading: true });
    await new Promise(r => setTimeout(r, 1200));
    set({ user: CURRENT_USER, isAuthenticated: true, isLoading: false });
  },
  signup: async (_email, _password, _name, _role) => {
    set({ isLoading: true });
    await new Promise(r => setTimeout(r, 1500));
    set({ user: CURRENT_USER, isAuthenticated: true, isLoading: false });
  },
  logout: () => set({ user: null, isAuthenticated: false }),
  updateProfile: (updates) => set(state => ({
    user: state.user ? { ...state.user, ...updates } : null,
  })),
}));
