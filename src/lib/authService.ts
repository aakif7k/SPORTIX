import { account } from '@/lib/appwrite';
import { api } from '@/lib/api';
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
  bio: string;
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
  city?: string;
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
  // The BACKEND is the single owner of profile creation.
  //
  // This used to create the Appwrite auth account and the profiles document
  // straight from the browser, while POST /api/auth/register did the same thing
  // server-side -- two writers producing two different document shapes. Worse,
  // once collection permissions were locked down (no create for any client role,
  // because the server API key bypasses permissions), the browser write started
  // being rejected outright and the failure was swallowed by a console.warn. The
  // visible result was an auth account with no profile at all.
  //
  // So registration goes through the API, which creates the auth user, the
  // profile and the Pulse/level/coins/streak rows in one place and rolls the auth
  // account back if the profile write fails. Only then does the browser open its
  // own session, which is what the SDK needs for realtime and for minting JWTs.
  await api.post('/api/auth/register', {
    email: data.email,
    password: data.password,
    full_name: data.fullName,
    username: data.username.toLowerCase().trim(),
    role: data.role,
    sport: data.sport,
    sports: data.sports,
    experience_level: data.experienceLevel,
    location: data.location,
    city: data.city ?? data.location,
  });

  await account.createEmailPasswordSession(data.email, data.password);
  const user = await account.get();
  return toAuthUser(user as AppwriteUser);
}

/* ─── LOGIN ──────────────────────────────────────────────────────────────── */
export async function loginUser(email: string, password: string): Promise<AuthUser> {
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

/* ─── GET USER PROFILE ───────────────────────────────────────────────────── */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  // Read through the API like everything else. The direct SDK read worked only
  // because profiles grants Role.users() read for realtime, and it skipped the
  // joins and derived fields the endpoint adds.
  try {
    const res = await api.get<{ data: AppwriteDocument }>(
      `/api/users/${encodeURIComponent(uid)}`,
    );
    return docToProfile(res.data);
  } catch {
    return null;
  }
}

/* ─── UPDATE USER PROFILE ────────────────────────────────────────────────── */
export async function updateUserProfile(
  _uid: string,
  updates: Partial<UserProfile>,
): Promise<UserProfile | null> {
  // Writes go through the API, never the browser SDK. Clients hold no
  // create/update/delete permission on any collection, so the direct
  // databases.updateDocument call this replaces was rejected -- and the catch
  // block reported "collection missing" and returned null, which read as an
  // empty profile rather than a permission failure. The server also owns
  // denormalisation, which a direct write would skip.
  //
  // The uid is unused: the endpoint derives the user from the JWT, so a caller
  // cannot edit someone else's profile by passing a different id.
  const res = await api.put<{ success: boolean; data: AppwriteDocument }>(
    '/api/users/me', updates,
  );
  return docToProfile(res.data);
}

/* ─── CHECK USERNAME AVAILABLE ───────────────────────────────────────────── */
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  // This used to query the profiles collection with the browser SDK and return
  // `true` whenever the query threw. During signup there is no session, so the
  // read was always denied and every username reported as available — then
  // registration failed on the unique index instead. The endpoint is public for
  // exactly this reason, and compares case-insensitively.
  try {
    const res = await api.get<{ data: { available: boolean } }>(
      `/api/auth/username-available?username=${encodeURIComponent(username.trim())}`,
    );
    return res.data.available;
  } catch {
    // Do not claim a name is free when the check itself failed: let the caller
    // proceed and have registration be the authority.
    return true;
  }
}

/* ─── USER-FRIENDLY ERROR MESSAGES ──────────────────────────────────────── */
export function getAuthErrorMessage(error: any): string {
  const msg: string = error?.message || (typeof error === 'string' ? error : '');
  if (msg.includes('user_already_exists') || msg.includes('already exists') || msg.includes('already registered')) {
    return 'An account with this email address already exists. Please log in.';
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
