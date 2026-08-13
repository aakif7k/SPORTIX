import { account, databases, ID, Query, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
// Appwrite SDK v26+ removed the Models namespace — use inline types
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
type AppwriteDocument = Record<string, any> & { $id: string; $createdAt: string; $updatedAt: string };

/* ─── Normalised user shape ──────────────────────────────────────────────────
 * The rest of the app uses currentUser.id — this adapter keeps that working
 * without touching every component.
 */
export interface AuthUser {
  id: string;    // = appwrite $id
  email: string;
  name: string;
}

/* ─── Profile row type ───────────────────────────────────────────────────── */
export interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: string;
  sport: string;
  sports: string[];
  experience_level: string;
  location: string;
  avatar_url: string | null;
  profile_image_file_id?: string | null;
  profile_image_url?: string | null;
  bio: string;
  date_of_birth?: string | null;   // ISO date string YYYY-MM-DD
  is_open_to_recruit: boolean;
  is_active: boolean;
  is_onboarding_complete: boolean;
  pulse_score: number;
  level: number;
  coins_balance: number;
  login_streak: number;
  created_at: string;
  updated_at: string;
}

export interface RegisterData {
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: 'athlete' | 'recruiter' | 'coach' | 'organizer';
  sport: string;
  sports: string[];
  experienceLevel: string;
  location: string;
  bio?: string;
  dateOfBirth?: string;  // ISO date string YYYY-MM-DD
}

/* ─── Map Appwrite Models.User to AuthUser ───────────────────────────────── */
export function toAuthUser(user: AppwriteUser): AuthUser {
  return {
    id: user.$id,
    email: user.email,
    name: user.name,
  };
}

/* ─── REGISTER ───────────────────────────────────────────────────────────── */
export async function registerUser(data: RegisterData): Promise<AuthUser> {
  // 0. Clear any pre-existing active session to prevent Appwrite Error 409 (user_session_already_exists)
  try {
    await account.deleteSession('current');
  } catch {
    /* no active session */
  }

  // 1. Create Appwrite auth account
  const user = await account.create(
    ID.unique(),
    data.email,
    data.password,
    data.fullName,
  );

  // 2. Create email session immediately (log them in)
  try {
    await account.createEmailPasswordSession(data.email, data.password);
  } catch (sessionErr: any) {
    if (
      sessionErr?.message?.includes('prohibited when a session is active') ||
      sessionErr?.type === 'user_session_already_exists'
    ) {
      try {
        await account.deleteSession('current');
        await account.createEmailPasswordSession(data.email, data.password);
      } catch {
        /* session established */
      }
    } else {
      throw sessionErr;
    }
  }

  // 3. Create profile document in Appwrite Database
  const nowIso = new Date().toISOString();
  try {
      const profileDocData: Record<string, any> = {
        full_name:              data.fullName,
        username:               data.username.toLowerCase().trim(),
        email:                  data.email,
        role:                   data.role || 'athlete',
        sport:                  data.sport || 'Multi-Sport',
        sports:                 data.sports || [],
        experience_level:       data.experienceLevel || 'amateur',
        location:               data.location || '',
        avatar_url:             null,
        bio:                    data.bio || '',
        date_of_birth:          data.dateOfBirth || null,
        is_open_to_recruit:     false,
        is_active:              true,
        is_onboarding_complete: false,
        pulse_score:            100,
        level:                  1,
        coins_balance:          0,
        login_streak:           0,
        created_at:             nowIso,
        updated_at:             nowIso,
      };

      try {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.PROFILES,
          user.$id,
          profileDocData,
        );
      } catch (docErr: any) {
        if (docErr?.message?.includes('date_of_birth') || docErr?.message?.includes('Unknown attribute')) {
          delete profileDocData.date_of_birth;
          await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.PROFILES,
            user.$id,
            profileDocData,
          );
        } else {
          throw docErr;
        }
      }
    } catch (err: any) {
      console.error('Appwrite profiles document creation failed:', err?.message || err);
      // User-friendly error message if write fails
      throw new Error(err?.message || "Couldn't create your profile. Please try again.");
    }

  return toAuthUser(user);
}

/* ─── LOGIN ──────────────────────────────────────────────────────────────── */
export async function loginUser(email: string, password: string): Promise<AuthUser> {
  try {
    await account.deleteSession('current');
  } catch {
    /* no active session */
  }
  await account.createEmailPasswordSession(email, password);
  const user = await account.get();
  return toAuthUser(user);
}

/* ─── GOOGLE OAUTH ───────────────────────────────────────────────────────── */
export function loginWithGoogle(): void {
  // Appwrite OAuth is a browser redirect — not a Promise.
  // After Google auth completes, Appwrite redirects to successUrl,
  // AuthContext.getCurrentUser() picks up the session on mount.
  account.createOAuth2Session(
    'google' as any,
    `${window.location.origin}/auth/callback`,   // success
    `${window.location.origin}/login`,            // failure
  );
}

/* ─── SIGN OUT ───────────────────────────────────────────────────────────── */
export async function logoutUser(): Promise<void> {
  await account.deleteSession('current');
}

/* ─── FORGOT PASSWORD ────────────────────────────────────────────────────── */
export async function forgotPassword(email: string): Promise<void> {
  await account.createRecovery(email, `${window.location.origin}/reset-password`);
}

/* ─── GET CURRENT USER (returns null if not logged in) ───────────────────── */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const user = await account.get();
    return toAuthUser(user);
  } catch {
    return null;
  }
}

export type PostAuthDestination = 'AUTH_REQUIRED' | 'ONBOARDING' | 'APP';

/**
 * Authoritative destination decision for authenticated users.
 * Both email/password users and Google OAuth users MUST converge into this single decision.
 */
export function resolvePostAuthDestination(
  isAuthenticated: boolean,
  profile: UserProfile | null
): PostAuthDestination {
  if (!isAuthenticated) return 'AUTH_REQUIRED';
  if (!profile || !profile.is_onboarding_complete) return 'ONBOARDING';
  return 'APP';
}

/* ─── GET USER PROFILE ───────────────────────────────────────────────────── */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.PROFILES, uid);
    return docToProfile(doc);
  } catch (err) {
    console.warn('getUserProfile: profiles collection not found or uncreated:', err);
    return null;
  }
}

/* ─── UPDATE USER PROFILE ────────────────────────────────────────────────── */
export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>,
): Promise<UserProfile | null> {
  try {
    const { id, created_at, updated_at, ...cleanUpdates } = updates as any;
    const doc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.PROFILES,
      uid,
      cleanUpdates,
    );
    return docToProfile(doc);
  } catch (err) {
    console.warn('updateUserProfile: profiles collection missing, updating local session profile');
    return null;
  }
}

/* ─── CHECK USERNAME AVAILABLE ───────────────────────────────────────────── */
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PROFILES,
      [Query.equal('username', username.toLowerCase().trim()), Query.limit(1)],
    );
    return res.total === 0;
  } catch {
    return true;
  }
}

/* ─── USER-FRIENDLY ERROR MESSAGES ──────────────────────────────────────── */
export function getAuthErrorMessage(error: any): string {
  const msg: string = error?.message || (typeof error === 'string' ? error : '');
  if (msg.includes('user_already_exists') || msg.includes('already exists') || msg.includes('already registered')) {
    return 'An account with this email address already exists. Please log in.';
  }
  if (msg.includes('prohibited when a session is active') || msg.includes('user_session_already_exists')) {
    return 'A session is currently active. Signing out and completing your registration...';
  }
  if (msg.includes('Invalid credentials') || msg.includes('invalid_credentials')) {
    return 'Email or password is incorrect.';
  }
  if (msg.includes('password')) {
    return 'Password must be at least 8 characters.';
  }
  if (msg.includes('invalid_email') || msg.includes('Param "email"')) {
    return 'Please enter a valid email address.';
  }
  if (msg.includes('Rate limit') || msg.includes('rate_limit')) {
    return 'Too many attempts. Please wait a moment.';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Network error. Check your internet connection.';
  }
  return error?.message || 'Something went wrong. Please try again.';
}

/* ─── Internal: Appwrite document → UserProfile ──────────────────────────── */
function docToProfile(doc: AppwriteDocument): UserProfile {
  return {
    id:                     doc.$id,
    full_name:              doc.full_name        ?? '',
    username:               doc.username         ?? '',
    email:                  doc.email            ?? '',
    role:                   doc.role             ?? 'athlete',
    sport:                  doc.sport            ?? '',
    sports:                 doc.sports           ?? [],
    experience_level:       doc.experience_level ?? 'amateur',
    location:               doc.location         ?? '',
    avatar_url:             doc.avatar_url       ?? null,
    bio:                    doc.bio              ?? '',
    date_of_birth:          doc.date_of_birth    ?? null,
    is_open_to_recruit:     doc.is_open_to_recruit     ?? false,
    is_active:              doc.is_active              ?? true,
    is_onboarding_complete: doc.is_onboarding_complete ?? false,
    pulse_score:            doc.pulse_score      ?? 100,
    level:                  doc.level            ?? 1,
    coins_balance:          doc.coins_balance    ?? 0,
    login_streak:           doc.login_streak     ?? 0,
    created_at:             doc.created_at       ?? doc.$createdAt,
    updated_at:             doc.updated_at       ?? doc.$updatedAt,
  };
}
