import { useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { account } from '@/lib/appwrite';
import { useAuthStore } from '@/store/authStore';
import { AuthContext } from '@/context/AuthContext';
import type { AppwriteUser, AuthUser, RegisterData } from '@/context/AuthContext';

type SessionResult =
  | { kind: 'authenticated'; appwriteUser: AppwriteUser; profile: any }
  | { kind: 'anonymous' };

/**
 * Stand-in profile for an Appwrite session that has no profile document yet.
 * The backend is the real source of these defaults; this only keeps the UI
 * renderable until the profile exists.
 */
function buildProvisionalUser(appwriteAccount: AppwriteUser) {
  return {
    id: appwriteAccount.$id,
    email: appwriteAccount.email,
    name: appwriteAccount.name,
    username: appwriteAccount.name
      ? appwriteAccount.name.toLowerCase().replace(/\s+/g, '_')
      : 'user',
    role: 'athlete' as const,
    sport: 'Football',
    sports: ['Football'],
    openToRecruit: false,
    verified: false,
    joinedDate: new Date().toISOString(),
    performanceData: { speed: 80, strength: 75, endurance: 85, agility: 80, technique: 78, teamwork: 82 },
  };
}

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

  // Reading the session is separated from applying it so the mount effect can
  // apply the result inside a promise continuation. Calling a single async
  // checkSession() from the effect writes state while the effect body runs,
  // which cascades an extra render pass (react-hooks/set-state-in-effect).
  const resolveSession = useCallback(async (): Promise<SessionResult> => {
    try {
      // 1. Check if Appwrite session exists
      const appwriteAccount = await account.get();

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

      return { kind: 'authenticated', appwriteUser: appwriteAccount, profile };
    } catch {
      return { kind: 'anonymous' };
    }
  }, [loadUserProfile]);

  const applySession = useCallback((result: SessionResult) => {
    if (result.kind === 'anonymous') {
      // No active session
      setUser(null);
      setAppwriteUser(null);
      useAuthStore.getState().setUser(null);
      localStorage.removeItem('sportix_jwt');
      localStorage.removeItem('sportix_uid');
    } else {
      setAppwriteUser(result.appwriteUser);
      // An Appwrite session can exist before a profile does — new Google OAuth
      // users land here on their first sign-in.
      const profile = result.profile ?? buildProvisionalUser(result.appwriteUser);
      setUser(profile);
      useAuthStore.getState().setUser(profile);
    }

    setAuthLoading(false);
    useAuthStore.getState().setAuthLoading(false);
  }, []);

  const checkSession = useCallback(async () => {
    applySession(await resolveSession());
  }, [resolveSession, applySession]);

  useEffect(() => {
    let cancelled = false;
    resolveSession().then(result => {
      if (!cancelled) applySession(result);
    });
    return () => { cancelled = true; };
  }, [resolveSession, applySession]);

  const login = async (email: string, password: string) => {
    setAuthLoading(true);

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

    setAuthLoading(true);

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
