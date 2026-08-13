/**
 * src/context/AuthContext.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Central auth state machine for SPORTiX.
 *
 * State machine: 'checking' → 'authenticated' | 'unauthenticated' | 'error'
 *
 * Exposes to consumers:
 *   status, user, profile, appwriteUser, authLoading (compat), isAuthenticated,
 *   error, login, register, logout, refreshUser
 *
 * Backward compat: useAuth() is exported from here so no existing consumer
 * needs to change its import path.
 */

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import { account } from '@/lib/appwrite';
import { registerUser } from '@/lib/authService';
import { useAuthStore } from '@/store/authStore';
import { ensureUserProfile, profileToUserShape } from '@/services/profileService';
import type { UserProfile } from '@/services/profileService';
import { evaluateDailyLogin } from '@/services/userStateService';

// ─────────────────────────────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────────────────────────────

// Appwrite SDK v26+ removed Models namespace — inline type
type AppwriteUser = {
  $id: string;
  email: string;
  name: string;
  emailVerification: boolean;
  phoneVerification: boolean;
  status: boolean;
  labels: string[];
  prefs: Record<string, unknown>;
  registration: string;
  accessedAt: string;
};

export type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated' | 'error';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  username?: string;
  avatar_url?: string | null;
  avatar?: string | null;
  role?: string;
  sport?: string;
  level?: number;
  pulse_score?: number;
}

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  profile: UserProfile | null;
  appwriteUser: AppwriteUser | null;
  error: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Reducer
// ─────────────────────────────────────────────────────────────────────────────

type AuthAction =
  | { type: 'SET_CHECKING' }
  | { type: 'SET_AUTHENTICATED'; user: AuthUser; profile: UserProfile | null; appwriteUser: AppwriteUser }
  | { type: 'SET_UNAUTHENTICATED' }
  | { type: 'SET_ERROR'; error: string };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_CHECKING':
      return { ...state, status: 'checking', error: null };
    case 'SET_AUTHENTICATED':
      return {
        status: 'authenticated',
        user: action.user,
        profile: action.profile,
        appwriteUser: action.appwriteUser,
        error: null,
      };
    case 'SET_UNAUTHENTICATED':
      return {
        status: 'unauthenticated',
        user: null,
        profile: null,
        appwriteUser: null,
        error: null,
      };
    case 'SET_ERROR':
      return {
        status: 'error',
        user: null,
        profile: null,
        appwriteUser: null,
        error: action.error,
      };
    default:
      return state;
  }
}

const initialState: AuthState = {
  status: 'checking',
  user: null,
  profile: null,
  appwriteUser: null,
  error: null,
};

// ─────────────────────────────────────────────────────────────────────────────
//  Context shape
// ─────────────────────────────────────────────────────────────────────────────

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  username: string;
  role: string;
  sport: string;
  sports: string[];
  experienceLevel: string;
  location: string;
  city: string;
}

interface AuthContextType {
  // State
  status: AuthStatus;
  user: AuthUser | null;
  profile: UserProfile | null;
  appwriteUser: AppwriteUser | null;
  error: string | null;

  // Computed shorthands (backward compat)
  authLoading: boolean;        // = status === 'checking'
  isAuthenticated: boolean;    // = status === 'authenticated'

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Provider
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ─── Internal: build AuthUser from Appwrite account + profile ──────────────
  const buildAuthUser = (appwriteAcc: AppwriteUser, profile: UserProfile | null): AuthUser => {
    if (profile) {
      return {
        id:          profile.id,
        email:       profile.email || appwriteAcc.email,
        name:        profile.full_name || appwriteAcc.name,
        username:    profile.username,
        avatar_url:  profile.avatar_url,
        avatar:      profile.avatar_url,
        role:        profile.role,
        sport:       profile.sport,
        level:       profile.level,
        pulse_score: profile.pulse_score,
      };
    }
    // Fallback: profile load failed — use basic Appwrite account info
    return {
      id:         appwriteAcc.$id,
      email:      appwriteAcc.email,
      name:       appwriteAcc.name,
      username:   appwriteAcc.name?.toLowerCase().replace(/\s+/g, '_') || 'user',
      role:       'athlete',
      sport:      'Multi-Sport',
      level:      1,
      pulse_score: 100,
    };
  };

  // ─── Internal: load/ensure profile + hydrate state ─────────────────────────
  const hydrateSession = useCallback(async (appwriteAcc: AppwriteUser) => {
    let profile: UserProfile | null = null;
    try {
      profile = await ensureUserProfile(appwriteAcc);
      try {
        const loginEval = await evaluateDailyLogin(profile.id);
        profile.login_streak = loginEval.streak;
      } catch { /* non-critical */ }

      // [AUTH TRACE]
      console.log(
        '[AUTH TRACE] Session hydrated',
        '| user=' + appwriteAcc.$id,
        '| profile=' + profile.id,
        '| onboarding=' + profile.is_onboarding_complete,
        '| path=' + window.location.pathname,
      );
    } catch (profileErr) {
      console.warn('[AuthContext] Profile load failed — basic user state set:', profileErr);
      console.warn('[AUTH TRACE] Profile load FAILED | user=' + appwriteAcc.$id + ' | profile=null');
    }

    const user = buildAuthUser(appwriteAcc, profile);

    dispatch({ type: 'SET_AUTHENTICATED', user, profile, appwriteUser: appwriteAcc });
    useAuthStore.getState().setUser(
      profile ? (profileToUserShape(profile) as any) : (user as any)
    );
  }, []);

  // ─── Check existing session once on mount ──────────────────────────────────
  const checkSession = useCallback(async () => {
    dispatch({ type: 'SET_CHECKING' });
    try {
      const appwriteAcc = await account.get() as AppwriteUser;
      localStorage.setItem('sportix_uid', appwriteAcc.$id);
      await hydrateSession(appwriteAcc);
    } catch {
      // No active session
      dispatch({ type: 'SET_UNAUTHENTICATED' });
      useAuthStore.getState().setUser(null);
      localStorage.removeItem('sportix_uid');
      localStorage.removeItem('sportix_jwt');
    } finally {
      useAuthStore.getState().setAuthLoading(false);
    }
  }, [hydrateSession]);

  useEffect(() => {
    checkSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── LOGIN ─────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string): Promise<void> => {
    // Clear stale session first
    try { await account.deleteSession('current'); } catch { /* no session */ }
    await account.createEmailPasswordSession(email, password);
    await checkSession();
  };

  // ─── REGISTER ──────────────────────────────────────────────────────────────
  const register = async (data: RegisterData): Promise<void> => {
    // Clear stale session first
    try { await account.deleteSession('current'); } catch { /* no session */ }

    await registerUser({
      email:           data.email.trim().toLowerCase(),
      password:        data.password,
      fullName:        data.fullName.trim(),
      username:        data.username.trim().toLowerCase(),
      role:            (data.role as any) || 'athlete',
      sport:           data.sport || 'Multi-Sport',
      sports:          data.sports || [],
      experienceLevel: data.experienceLevel || 'amateur',
      location:        data.location || '',
    });

    await checkSession();
  };

  // ─── LOGOUT ────────────────────────────────────────────────────────────────
  const logout = async (): Promise<void> => {
    try { await account.deleteSession('current'); } catch { /* already gone */ }
    dispatch({ type: 'SET_UNAUTHENTICATED' });
    useAuthStore.getState().setUser(null);
    localStorage.removeItem('sportix_jwt');
    localStorage.removeItem('sportix_uid');
  };

  // ─── REFRESH ───────────────────────────────────────────────────────────────
  const refreshUser = async (): Promise<void> => {
    try {
      const appwriteAcc = (state.appwriteUser || await account.get()) as AppwriteUser;
      localStorage.setItem('sportix_uid', appwriteAcc.$id);
      await hydrateSession(appwriteAcc);
    } catch (err) {
      console.warn('[AuthContext] refreshUser error:', err);
    }
  };

  // ─── Derived shorthands ────────────────────────────────────────────────────
  const authLoading     = state.status === 'checking';
  const isAuthenticated = state.status === 'authenticated';

  return (
    <AuthContext.Provider value={{
      status:         state.status,
      user:           state.user,
      profile:        state.profile,
      appwriteUser:   state.appwriteUser,
      error:          state.error,
      authLoading,
      isAuthenticated,
      login,
      register,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Consumer hook (also exported from hooks/useAuth.ts)
// ─────────────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}