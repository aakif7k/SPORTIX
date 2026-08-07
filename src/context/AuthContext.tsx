import {
  createContext, useContext, useEffect,
  useState, useCallback
} from 'react';
import type { ReactNode } from 'react';
import { account } from '@/lib/appwrite';
import { useAuthStore } from '@/store/authStore';
import { getProfile, profileToUserShape } from '@/services/profileService';
import type { UserProfile } from '@/services/profileService';

// Appwrite SDK v26+ removed the Models namespace — use inline type
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

interface AuthUser {
  id: string;
  email: string;
  name: string;
  username?: string;
  avatar_url?: string | null;
  role?: string;
  sport?: string;
  level?: number;
  pulse_score?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;      // full Appwrite profile document
  appwriteUser: AppwriteUser | null;
  authLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

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

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [appwriteUser, setAppwriteUser] = useState<AppwriteUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  /**
   * Load the full profile from Appwrite directly.
   * Falls back to a minimal AuthUser if the profile document doesn't exist yet
   * (e.g. during Google OAuth first-time signup).
   */
  const loadProfileFromAppwrite = useCallback(async (uid: string, appwriteAcc: AppwriteUser) => {
    const appwriteProfile = await getProfile(uid);

    if (appwriteProfile) {
      // Rich profile document found — use it everywhere
      const richUser: AuthUser = {
        id: appwriteProfile.id,
        email: appwriteProfile.email || appwriteAcc.email,
        name: appwriteProfile.full_name || appwriteAcc.name,
        username: appwriteProfile.username,
        avatar_url: appwriteProfile.avatar_url,
        role: appwriteProfile.role,
        sport: appwriteProfile.sport,
        level: appwriteProfile.level,
        pulse_score: appwriteProfile.pulse_score,
      };
      setUser(richUser);
      setProfile(appwriteProfile);
      // Also push to Zustand so legacy components using useAuthStore still work
      useAuthStore.getState().setUser(profileToUserShape(appwriteProfile) as any);
    } else {
      // No profile doc yet (new OAuth user) — use minimal auth data
      const basicUser: AuthUser = {
        id: appwriteAcc.$id,
        email: appwriteAcc.email,
        name: appwriteAcc.name,
        username: appwriteAcc.name
          ? appwriteAcc.name.toLowerCase().replace(/\s+/g, '_')
          : 'user',
        role: 'athlete',
        sport: '',
        level: 1,
        pulse_score: 100,
      };
      setUser(basicUser);
      setProfile(null);
      useAuthStore.getState().setUser(basicUser as any);
    }
  }, []);

  // ─── Check existing session on app load ────────────────────────────────────
  const checkSession = useCallback(async () => {
    setAuthLoading(true);
    try {
      // 1. Check if an Appwrite session exists
      const appwriteAccount = await account.get();
      setAppwriteUser(appwriteAccount);

      // Store UID for any remaining FastAPI calls elsewhere
      localStorage.setItem('sportix_uid', appwriteAccount.$id);

      // 2. Load profile from Appwrite (no FastAPI involved)
      await loadProfileFromAppwrite(appwriteAccount.$id, appwriteAccount);
    } catch {
      // No active session
      setUser(null);
      setProfile(null);
      setAppwriteUser(null);
      useAuthStore.getState().setUser(null);
      localStorage.removeItem('sportix_uid');
      localStorage.removeItem('sportix_jwt');
    } finally {
      setAuthLoading(false);
      useAuthStore.getState().setAuthLoading(false);
    }
  }, [loadProfileFromAppwrite]);

  useEffect(() => {
    checkSession();
  }, []);

  // ─── LOGIN ─────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    // Delete any stale session first
    try { await account.deleteSession('current'); } catch { /* no session */ }

    await account.createEmailPasswordSession(email, password);
    await checkSession();
  };

  // ─── REGISTER ──────────────────────────────────────────────────────────────
  // Registration still goes through FastAPI (creates auth + profile).
  // After success we create an Appwrite session and load the profile from Appwrite.
  const register = async (data: RegisterData) => {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/auth/register`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          full_name: data.fullName,
          username: data.username,
          role: data.role,
          sport: data.sport,
          sports: data.sports,
          experience_level: data.experienceLevel,
          location: data.location,
          city: data.city,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Registration failed');
    }

    const result = await res.json();
    if (result.data?.jwt) {
      localStorage.setItem('sportix_jwt', result.data.jwt);
    }

    // Create Appwrite session (so the SDK can authenticate further calls)
    await account.createEmailPasswordSession(data.email, data.password);

    // Load profile from Appwrite (the FastAPI endpoint already created it)
    await checkSession();
  };

  // ─── LOGOUT ────────────────────────────────────────────────────────────────
  const logout = async () => {
    try { await account.deleteSession('current'); } catch { /* already gone */ }
    setUser(null);
    setProfile(null);
    setAppwriteUser(null);
    useAuthStore.getState().setUser(null);
    localStorage.removeItem('sportix_jwt');
    localStorage.removeItem('sportix_uid');
  };

  // ─── REFRESH ───────────────────────────────────────────────────────────────
  const refreshUser = async () => {
    const uid = localStorage.getItem('sportix_uid');
    if (!uid || !appwriteUser) return;
    await loadProfileFromAppwrite(uid, appwriteUser);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      appwriteUser,
      authLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}