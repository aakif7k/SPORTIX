import { create } from 'zustand';
import type { User } from '../types';
import { CURRENT_USER } from '../services/mockData';
import { auth, db } from '../config/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  authLoading: true,
  showLogoutConfirm: false,
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      if (email === 'demo@sportix.io') {
        set({ user: CURRENT_USER, isAuthenticated: true, isLoading: false });
        return;
      }
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        set({ user: userDoc.data() as User, isAuthenticated: true, isLoading: false });
      } else {
        const newUser: User = {
          ...CURRENT_USER,
          uid: userCredential.user.uid,
          email: userCredential.user.email || email,
          name: userCredential.user.displayName || email.split('@')[0],
          username: email.split('@')[0],
        };
        set({ user: newUser, isAuthenticated: true, isLoading: false });
      }
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },
  signup: async (email, password, name, role) => {
    set({ isLoading: true });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser: User = {
        ...CURRENT_USER,
        uid: userCredential.user.uid,
        email,
        name: name,
        username: email.split('@')[0],
        role: role as any,
      };
      await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
      set({ user: newUser, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },
  logout: async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Firebase signout failed, clearing local state", e);
    }
    set({ user: null, isAuthenticated: false, showLogoutConfirm: false });
    // Reset all stores
    localStorage.removeItem('sportix-theme');
  },
  updateProfile: (updates) => set(state => ({
    user: state.user ? { ...state.user, ...updates } : null,
  })),
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setAuthLoading: (loading) => set({ authLoading: loading }),
  setShowLogoutConfirm: (show) => set({ showLogoutConfirm: show }),
}));

// Initialize session listener
onAuthStateChanged(auth, async (firebaseUser) => {
  if (firebaseUser) {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        useAuthStore.getState().setUser(userDoc.data() as User);
      } else {
        const newUser: User = {
          ...CURRENT_USER,
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
          username: firebaseUser.email?.split('@')[0] || '',
        };
        useAuthStore.getState().setUser(newUser);
      }
    } catch {
      const newUser: User = {
        ...CURRENT_USER,
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
      };
      useAuthStore.getState().setUser(newUser);
    }
  } else {
    // If not demo user, clear state
    const storeUser = useAuthStore.getState().user;
    if (storeUser && storeUser.email === 'demo@sportix.io') {
      // keep demo user session active
    } else {
      useAuthStore.getState().setUser(null);
    }
  }
  useAuthStore.getState().setAuthLoading(false);
});
