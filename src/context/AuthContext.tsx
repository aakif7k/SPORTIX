import {
  createContext, useContext, useEffect,
  useState, useCallback
} from 'react';
import type { ReactNode } from 'react';
import { account } from '@/lib/appwrite';
import { useAuthStore } from '@/store/authStore';
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
  const [appwriteUser, setAppwriteUser] =
    useState<AppwriteUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Load user profile from FastAPI backend with fail-fast 2s timeout
  const loadUserProfile = useCallback(async (
    _appwriteUid: string,
    jwt: string
  ) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(
        `${apiUrl}/api/users/me`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        return data.data;
      }
    } catch {
      console.warn('Backend loadUserProfile skipped or timed out, falling back to local session user');
    }
    return null;
  }, []);

  // Check existing session on app load
  const checkSession = useCallback(async () => {
    setAuthLoading(true);
    try {
      // 1. Check if Appwrite session exists
      const appwriteAccount = await account.get();
      setAppwriteUser(appwriteAccount);

      // 2. Get JWT from current session
      const session = await account.createJWT();
      const jwt = session.jwt;

      // Store JWT for API calls
      localStorage.setItem('sportix_jwt', jwt);
      localStorage.setItem('sportix_uid', appwriteAccount.$id);

      // 3. Load full profile from backend
      const profile = await loadUserProfile(
        appwriteAccount.$id, jwt
      );

      if (profile) {
        setUser(profile);
        useAuthStore.getState().setUser(profile);
      } else {
        // Appwrite session exists but no profile yet
        // This happens with new Google OAuth users
        const basicUser = {
          id: appwriteAccount.$id,
          email: appwriteAccount.email,
          name: appwriteAccount.name,
          username: appwriteAccount.name ? appwriteAccount.name.toLowerCase().replace(/\s+/g, '_') : 'user',
          role: 'athlete' as const,
          sport: 'Football',
          sports: ['Football'],
          openToRecruit: false,
          verified: false,
          joinedDate: new Date().toISOString(),
          performanceData: { speed: 80, strength: 75, endurance: 85, agility: 80, technique: 78, teamwork: 82 },
        };
        setUser(basicUser as any);
        useAuthStore.getState().setUser(basicUser as any);
      }
    } catch {
      // No active session
      setUser(null);
      setAppwriteUser(null);
      useAuthStore.getState().setUser(null);
      localStorage.removeItem('sportix_jwt');
      localStorage.removeItem('sportix_uid');
    } finally {
      setAuthLoading(false);
      useAuthStore.getState().setAuthLoading(false);
    }
  }, [loadUserProfile]);

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    // Delete any existing session first
    try {
      await account.deleteSession('current');
    } catch {
      // No session to clear — proceed to create one.
    }

    // Create new session
    await account.createEmailPasswordSession(email, password);

    // Refresh full auth state
    await checkSession();
  };

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
      throw new Error(
        err.error?.message || 'Registration failed'
      );
    }

    const result = await res.json();

    // Store JWT from registration response
    if (result.data?.jwt) {
      localStorage.setItem('sportix_jwt', result.data.jwt);
    }

    // Now create Appwrite session for frontend
    await account.createEmailPasswordSession(
      data.email, data.password
    );

    await checkSession();
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
    } catch {
      // Already signed out server-side — still clear local state below.
    }
    setUser(null);
    setAppwriteUser(null);
    localStorage.removeItem('sportix_jwt');
    localStorage.removeItem('sportix_uid');
  };

  const refreshUser = async () => {
    const jwt = localStorage.getItem('sportix_jwt');
    const uid = localStorage.getItem('sportix_uid');
    if (jwt && uid) {
      const profile = await loadUserProfile(uid, jwt);
      if (profile) setUser(profile);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
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