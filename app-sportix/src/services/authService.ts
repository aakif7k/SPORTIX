/**
 * src/services/authService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Authentication service for SPORTiX mobile.
 * Rules:
 *  1. Session token stored in expo-secure-store only — never AsyncStorage.
 *  2. Every ownership-sensitive write verifies account.get().$id at call time.
 *  3. No mock data, no demo profiles.
 *  4. Google OAuth via expo-web-browser + Appwrite createOAuth2Token (native flow).
 */
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { account, databases, DATABASE_ID, COLLECTIONS, ID } from '../api/appwrite';
import { AuthUser, UserProfile } from '../types';
import { markSessionActive, clearSession, saveUserId } from '../utils/secureSession';

WebBrowser.maybeCompleteAuthSession();

// ─── Map raw Appwrite account → typed AuthUser ────────────────────────────────
function toAuthUser(raw: any): AuthUser {
  return { id: raw.$id, email: raw.email, name: raw.name };
}

// ─── Map raw profile document → typed UserProfile ────────────────────────────
export function toUserProfile(doc: any): UserProfile {
  return {
    $id:                    doc.$id,
    full_name:              doc.full_name        ?? '',
    username:               doc.username         ?? '',
    email:                  doc.email            ?? '',
    role:                   doc.role             ?? 'athlete',
    sport:                  doc.sport            ?? 'Football',
    sports:                 doc.sports           ?? [],
    experience_level:       doc.experience_level ?? 'amateur',
    location:               doc.location         ?? '',
    avatar_url:             doc.avatar_url       ?? null,
    bio:                    doc.bio              ?? '',
    is_open_to_recruit:     doc.is_open_to_recruit     ?? false,
    is_active:              doc.is_active              ?? true,
    is_onboarding_complete: doc.is_onboarding_complete ?? false,
    pulse_score:            doc.pulse_score      ?? 100,
    level:                  doc.level            ?? 1,
    coins_balance:          doc.coins_balance    ?? 0,
    login_streak:           doc.login_streak     ?? 0,
    city:                   doc.city             ?? '',
    $createdAt:             doc.$createdAt,
    $updatedAt:             doc.$updatedAt,
  };
}

export const authService = {
  /** Get authenticated Appwrite user. Returns null if no session. */
  async getCurrentAuthUser(): Promise<AuthUser | null> {
    try {
      const raw = await account.get();
      return toAuthUser(raw);
    } catch {
      return null;
    }
  },

  /** Get the profile document for the current authenticated user. */
  async getCurrentProfile(): Promise<UserProfile | null> {
    try {
      const raw = await account.get();
      const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, raw.$id);
      return toUserProfile(doc);
    } catch {
      return null;
    }
  },

  /**
   * Email/password sign-in.
   * Clears any stale session first (prevents 409 conflicts).
   */
  async loginWithEmail(email: string, password: string): Promise<{ auth: AuthUser; profile: UserProfile }> {
    // Clear stale session
    try { await account.deleteSession('current'); } catch { /* no active session */ }

    await account.createEmailPasswordSession(email.trim().toLowerCase(), password);
    const raw = await account.get();
    const auth = toAuthUser(raw);

    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, raw.$id);
    const profile = toUserProfile(doc);

    await markSessionActive();
    await saveUserId(auth.id);
    return { auth, profile };
  },

  /**
   * Email/password sign-up.
   * 1. Creates Appwrite auth account
   * 2. Creates email session
   * 3. Creates profile document
   */
  async signupWithEmail(data: {
    email: string;
    password: string;
    fullName: string;
    username: string;
  }): Promise<{ auth: AuthUser; profile: UserProfile }> {
    // Clear stale session
    try { await account.deleteSession('current'); } catch { /* no active session */ }

    const user = await account.create(
      ID.unique(),
      data.email.trim().toLowerCase(),
      data.password,
      data.fullName.trim(),
    );

    // Log in immediately
    try {
      await account.createEmailPasswordSession(data.email, data.password);
    } catch (e: any) {
      if (e?.type === 'user_session_already_exists') {
        await account.deleteSession('current');
        await account.createEmailPasswordSession(data.email, data.password);
      } else {
        throw e;
      }
    }

    const nowIso = new Date().toISOString();
    await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.PROFILES,
      user.$id,
      {
        full_name:              data.fullName.trim(),
        username:               data.username.trim().toLowerCase(),
        email:                  data.email.trim().toLowerCase(),
        role:                   'athlete',
        sport:                  'Football',
        sports:                 [],
        experience_level:       'amateur',
        location:               '',
        avatar_url:             null,
        bio:                    '',
        is_open_to_recruit:     false,
        is_active:              true,
        is_onboarding_complete: false,
        pulse_score:            100,
        level:                  1,
        coins_balance:          0,
        login_streak:           0,
        created_at:             nowIso,
        updated_at:             nowIso,
      },
    );

    const auth: AuthUser = { id: user.$id, email: user.email, name: user.name };
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, user.$id);
    const profile = toUserProfile(doc);

    await markSessionActive();
    await saveUserId(auth.id);
    return { auth, profile };
  },

  /**
   * Google OAuth — native token-exchange via expo-web-browser.
   * Deep-link callback: sportix://auth/callback
   */
  async loginWithGoogle(): Promise<{ auth: AuthUser; profile: UserProfile } | null> {
    try {
      const redirectUrl = Linking.createURL('auth/callback');
      // Get Appwrite OAuth2 token URL
      const result = await account.createOAuth2Token(
        'google' as any,
        redirectUrl,
        redirectUrl,
      );

      if (!result) return null;

      // Open browser with the OAuth URL
      const browserResult = await WebBrowser.openAuthSessionAsync(result.toString(), redirectUrl);

      if (browserResult.type !== 'success') return null;

      const url = new URL(browserResult.url);
      const secret = url.searchParams.get('secret');
      const userId = url.searchParams.get('userId');

      if (!secret || !userId) return null;

      await account.createSession(userId, secret);
      const raw = await account.get();
      const auth = toAuthUser(raw);

      // Upsert profile
      let profile: UserProfile;
      try {
        const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, raw.$id);
        profile = toUserProfile(doc);
      } catch {
        // First-time Google login — create profile
        const nowIso = new Date().toISOString();
        const doc = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.PROFILES,
          raw.$id,
          {
            full_name: raw.name,
            username: raw.email.split('@')[0].toLowerCase(),
            email: raw.email,
            role: 'athlete',
            sport: 'Football',
            sports: [],
            experience_level: 'amateur',
            location: '',
            avatar_url: null,
            bio: '',
            is_open_to_recruit: false,
            is_active: true,
            is_onboarding_complete: false,
            pulse_score: 100,
            level: 1,
            coins_balance: 0,
            login_streak: 0,
            created_at: nowIso,
            updated_at: nowIso,
          },
        );
        profile = toUserProfile(doc);
      }

      await markSessionActive();
      await saveUserId(auth.id);
      return { auth, profile };
    } catch (error) {
      console.error('[authService] Google OAuth error:', error);
      return null;
    }
  },

  /** Generate a short-lived JWT for FastAPI requests. */
  async createJWT(): Promise<string> {
    const token = await account.createJWT();
    return (token as any).jwt ?? String(token);
  },

  /** Log out — delete session, clear SecureStore. */
  async logout(): Promise<void> {
    try { await account.deleteSession('current'); } catch { /* already gone */ }
    await clearSession();
  },

  /** Check username availability in the profiles collection. */
  async checkUsernameAvailable(username: string): Promise<boolean> {
    try {
      const { Query } = await import('../api/appwrite');
      const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
        Query.equal('username', username.toLowerCase().trim()),
        Query.limit(1),
      ]);
      return res.total === 0;
    } catch {
      return true; // Assume available if we can't check
    }
  },
};
