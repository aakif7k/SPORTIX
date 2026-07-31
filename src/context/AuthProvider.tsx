import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';

import { account } from '@/lib/appwrite';
import { api, ApiError, clearJWT, SESSION_EXPIRED_EVENT } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { AuthContext } from '@/context/AuthContext';
import type { AppwriteUser, AuthUser, RegisterData } from '@/context/AuthContext';

type SessionResult =
  | {
      kind: 'authenticated';
      appwriteUser: AppwriteUser;
      profile: AuthUser | null;
      /** True when the profile REQUEST failed, as distinct from not existing yet. */
      profileFailed: boolean;
    }
  | { kind: 'anonymous' };

/**
 * Stand-in profile for an Appwrite session that has no profile document yet — a
 * new Google OAuth user on first sign-in. Only ever used when the request
 * succeeded and genuinely returned nothing, never to cover up a failure.
 */
function buildProvisionalUser(appwriteAccount: AppwriteUser): AuthUser {
  return {
    id: appwriteAccount.$id,
    email: appwriteAccount.email,
    name: appwriteAccount.name,
    username: appwriteAccount.name
      ? appwriteAccount.name.toLowerCase().replace(/\s+/g, '_')
      : 'user',
    role: 'athlete',
    sport: 'Football',
    level: 1,
    pulse_score: 100,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [appwriteUser, setAppwriteUser] = useState<AppwriteUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  /**
   * True when we have a session but could not load its profile. Exposed so a
   * screen can offer a retry instead of rendering placeholder values as if they
   * were the user's own data.
   */
  const [profileError, setProfileError] = useState(false);

  /**
   * Fetch the profile through the shared API client.
   *
   * This used to hand-roll a fetch with a 2000 ms abort and swallow every
   * failure, so a slow backend produced a signed-in user carrying no profile
   * data — no username, sport, level or Pulse — with nothing to distinguish that
   * from a real profile. api.get brings JWT refresh, a 15 s timeout and the typed
   * error envelope, and the failure is now reported rather than hidden.
   */
  const loadUserProfile = useCallback(async (): Promise<{
    profile: AuthUser | null;
    failed: boolean;
  }> => {
    try {
      const res = await api.get<{ success: boolean; data: AuthUser }>('/api/users/me');
      return { profile: res.data ?? null, failed: false };
    } catch (err) {
      const detail = err instanceof ApiError ? `${err.code} (${err.status})` : String(err);
      console.error(`Could not load the profile for the current session: ${detail}`);
      return { profile: null, failed: true };
    }
  }, []);

  // Reading the session is separated from applying it so the mount effect can
  // apply the result inside a promise continuation; calling one async function
  // that writes state from the effect body cascades an extra render pass.
  const resolveSession = useCallback(async (): Promise<SessionResult> => {
    let appwriteAccount: AppwriteUser;
    try {
      appwriteAccount = await account.get();
    } catch {
      return { kind: 'anonymous' };
    }

    // The uid is kept for the few call sites that still read it directly. The
    // JWT is no longer cached here: api.ts owns minting and refreshing it, and
    // two places writing the same token is how it went stale in the first place.
    try {
      localStorage.setItem('sportix_uid', appwriteAccount.$id);
    } catch {
      /* private browsing */
    }

    const { profile, failed } = await loadUserProfile();
    return {
      kind: 'authenticated',
      appwriteUser: appwriteAccount,
      profile,
      profileFailed: failed,
    };
  }, [loadUserProfile]);

  const applySession = useCallback((result: SessionResult) => {
    if (result.kind === 'anonymous') {
      setProfileError(false);
      setUser(null);
      setAppwriteUser(null);
      useAuthStore.getState().setUser(null);
      clearJWT();
      try { localStorage.removeItem('sportix_uid'); } catch { /* private browsing */ }
    } else {
      setAppwriteUser(result.appwriteUser);
      setProfileError(result.profileFailed);
      const profile = result.profile ?? buildProvisionalUser(result.appwriteUser);
      setUser(profile);
      // The zustand store models a richer User than the auth payload; the cast is
      // deliberate and narrow, and disappears once the store reads from the API.
      useAuthStore.getState().setUser(profile as never);
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

  const logout = useCallback(async () => {
    try {
      await account.deleteSession('current');
    } catch {
      // Already signed out server-side — still clear local state below.
    }
    setUser(null);
    setAppwriteUser(null);
    setProfileError(false);
    useAuthStore.getState().setUser(null);
    clearJWT();
    try { localStorage.removeItem('sportix_uid'); } catch { /* private browsing */ }
  }, []);

  /**
   * api.ts fires this when a freshly minted JWT is still rejected, meaning the
   * Appwrite session is genuinely gone. Without it the app would sit on a dead
   * session showing empty screens and blaming the network.
   */
  useEffect(() => {
    const onExpired = () => {
      // Guard against a burst of parallel 401s each announcing the same thing.
      if (!useAuthStore.getState().user && !user) return;
      toast.error('Session expired, please sign in again.');
      void logout();
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [logout, user]);

  const login = async (email: string, password: string) => {
    setAuthLoading(true);
    try {
      await account.deleteSession('current');
    } catch {
      // No session to clear — proceed to create one.
    }
    await account.createEmailPasswordSession(email, password);
    clearJWT();          // the new session needs its own token
    await checkSession();
  };

  /**
   * Registration is owned by the backend, which creates the auth account, the
   * profile and the Pulse/level/coins/streak rows together and rolls the auth
   * account back if the profile write fails. The browser then opens its own
   * session, which is what the SDK needs for realtime and for minting JWTs.
   */
  const register = async (data: RegisterData) => {
    await api.post('/api/auth/register', {
      email: data.email,
      password: data.password,
      full_name: data.fullName,
      username: data.username,
      role: data.role,
      sport: data.sport,
      sports: data.sports,
      experience_level: data.experienceLevel,
      location: data.location,
      city: data.city || data.location,
    });

    setAuthLoading(true);
    await account.createEmailPasswordSession(data.email, data.password);
    clearJWT();
    await checkSession();
  };

  const refreshUser = async () => {
    const { profile, failed } = await loadUserProfile();
    setProfileError(failed);
    if (profile) {
      setUser(profile);
      useAuthStore.getState().setUser(profile as never);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      appwriteUser,
      authLoading,
      profileError,
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
