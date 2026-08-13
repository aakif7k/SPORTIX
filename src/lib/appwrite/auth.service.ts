/**
 * src/lib/appwrite/auth.service.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Typed authentication service for SPORTiX.
 *
 * Architecture: UI → Hooks → AuthContext → THIS FILE → Appwrite SDK
 *
 * Rules:
 *  1. Every function here is a thin wrapper around Appwrite SDK calls.
 *  2. Every Appwrite exception is caught and re-thrown as `AuthError` so
 *     UI layers never receive raw AppwriteException objects.
 *  3. Session collision (409 / user_session_already_exists) is handled
 *     transparently — no caller ever needs to worry about it.
 */

import { AppwriteException } from 'appwrite';
import { account, databases, ID, Query, DATABASE_ID, COLLECTIONS } from './client';

// ─────────────────────────────────────────────────────────────────────────────
//  Typed error
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthErrorAction {
  label: string;
  route?: string;
  callback?: 'retry';
}

export class AuthError extends Error {
  readonly code: string;
  readonly title: string;
  readonly field?: string;
  readonly action?: AuthErrorAction;
  readonly severity: 'error' | 'warning' | 'info';

  constructor(opts: {
    code: string;
    title: string;
    message: string;
    field?: string;
    action?: AuthErrorAction;
    severity?: 'error' | 'warning' | 'info';
  }) {
    super(opts.message);
    this.name = 'AuthError';
    this.code = opts.code;
    this.title = opts.title;
    this.field = opts.field;
    this.action = opts.action;
    this.severity = opts.severity ?? 'error';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Internal error mapper — translates AppwriteException → AuthError
// ─────────────────────────────────────────────────────────────────────────────

function mapError(err: unknown): AuthError {
  if (err instanceof AuthError) return err;

  if (err instanceof AppwriteException) {
    // Authentication
    if (err.type === 'user_already_exists' || err.code === 409) {
      return new AuthError({
        code: 'EMAIL_REGISTERED',
        title: 'Email already registered',
        message: 'An account already exists with this email. Try logging in instead.',
        field: 'email',
        action: { label: 'Go to Login', route: '/login' },
      });
    }
    if (err.type === 'user_invalid_credentials' || err.type === 'user_not_found') {
      return new AuthError({
        code: 'INVALID_CREDENTIALS',
        title: 'Incorrect details',
        message: 'Email or password is incorrect.',
      });
    }
    if (err.type === 'user_session_not_found') {
      return new AuthError({
        code: 'SESSION_EXPIRED',
        title: 'Session expired',
        message: 'Your session has expired. Please log in again.',
        action: { label: 'Log In', route: '/login' },
        severity: 'warning',
      });
    }
    if (err.type === 'user_invalid_token') {
      return new AuthError({
        code: 'INVALID_TOKEN',
        title: 'Link expired',
        message: 'Your reset link has expired. Request a new one.',
      });
    }
    if (err.type === 'rate_limit_exceeded') {
      return new AuthError({
        code: 'RATE_LIMITED',
        title: 'Too many attempts',
        message: 'Too many requests. Please wait a moment and try again.',
        severity: 'warning',
      });
    }
    if (err.code === 0 || err.message.toLowerCase().includes('network') || err.message.toLowerCase().includes('fetch')) {
      return new AuthError({
        code: 'NETWORK_ERROR',
        title: 'Connection failed',
        message: "Couldn't connect to SPORTiX. Check your internet.",
        action: { label: 'Try Again', callback: 'retry' },
      });
    }
    if (err.code === 503 || err.code === 502) {
      return new AuthError({
        code: 'SERVICE_DOWN',
        title: 'SPORTiX unavailable',
        message: 'SPORTiX is temporarily down. Please try again shortly.',
      });
    }
    if (err.code === 401 || err.code === 403) {
      return new AuthError({
        code: 'UNAUTHORIZED',
        title: 'Access denied',
        message: "You don't have permission to do that.",
      });
    }

    // Generic Appwrite error
    return new AuthError({
      code: `APPWRITE_${err.type ?? err.code}`,
      title: 'Something went wrong',
      message: err.message || 'An unexpected error occurred.',
      action: { label: 'Try Again', callback: 'retry' },
    });
  }

  // Plain Error / unknown
  const msg = (err as Error)?.message ?? String(err);
  if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('already registered')) {
    return new AuthError({
      code: 'EMAIL_REGISTERED',
      title: 'Email already registered',
      message: 'An account already exists with this email.',
      field: 'email',
      action: { label: 'Go to Login', route: '/login' },
    });
  }
  if (msg.toLowerCase().includes('invalid credentials')) {
    return new AuthError({
      code: 'INVALID_CREDENTIALS',
      title: 'Incorrect details',
      message: 'Email or password is incorrect.',
    });
  }

  return new AuthError({
    code: 'UNKNOWN_ERROR',
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
    action: { label: 'Try Again', callback: 'retry' },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  AuthUser shape
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;      // = Appwrite $id
  email: string;
  name: string;
}

/** Appwrite account.get() raw response shape (v26+, Models removed) */
type AppwriteAccount = {
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

function toAuthUser(a: AppwriteAccount): AuthUser {
  return { id: a.$id, email: a.email, name: a.name };
}

// ─────────────────────────────────────────────────────────────────────────────
//  SignUp data
// ─────────────────────────────────────────────────────────────────────────────

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  username: string;
  role?: 'athlete' | 'recruiter' | 'coach' | 'organizer';
  sport?: string;
  sports?: string[];
  experienceLevel?: string;
  location?: string;
  city?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Public auth functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sign up a new user.
 * 1. Clears any pre-existing session (prevents Appwrite 409)
 * 2. Creates Appwrite auth account
 * 3. Creates an email session (logs them in immediately)
 * 4. Creates the Appwrite DB profile document
 */
export async function signUp(data: SignUpData): Promise<AuthUser> {
  try {
    // 0. Clear stale session
    try { await account.deleteSession('current'); } catch { /* no active session */ }

    // 1. Create auth account
    const user = await account.create(
      ID.unique(),
      data.email.trim().toLowerCase(),
      data.password,
      data.fullName.trim(),
    );

    // 2. Log in immediately
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
        } catch { /* session already established another way */ }
      } else {
        throw sessionErr;
      }
    }

    // 3. Create profile document
    const nowIso = new Date().toISOString();
    try {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.PROFILES,
        user.$id,
        {
          full_name:              data.fullName.trim(),
          username:               data.username.trim().toLowerCase(),
          email:                  data.email.trim().toLowerCase(),
          role:                   data.role || 'athlete',
          sport:                  data.sport || 'Multi-Sport',
          sports:                 data.sports || [],
          experience_level:       data.experienceLevel || 'amateur',
          location:               data.location || '',
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
    } catch (profileErr: any) {
      console.error('[auth.service] Profile document creation failed:', profileErr?.message ?? profileErr);
      throw new AuthError({
        code: 'PROFILE_CREATE_FAILED',
        title: 'Account created but profile failed',
        message: "Your account was created but we couldn't set up your profile. Please contact support.",
      });
    }

    return toAuthUser(user);
  } catch (err) {
    throw mapError(err);
  }
}

/**
 * Log in with email + password.
 * Always clears any pre-existing session first.
 */
export async function login(email: string, password: string): Promise<AuthUser> {
  try {
    try { await account.deleteSession('current'); } catch { /* no active session */ }
    await account.createEmailPasswordSession(email.trim().toLowerCase(), password);
    const user = await account.get();
    return toAuthUser(user as AppwriteAccount);
  } catch (err) {
    throw mapError(err);
  }
}

/**
 * Log out — delete the current session cookie.
 * Throws AuthError if the session is already gone (caller can ignore).
 */
export async function logout(): Promise<void> {
  try {
    await account.deleteSession('current');
  } catch (err) {
    throw mapError(err);
  }
}

/**
 * Get the currently authenticated user, or null if no session exists.
 * Never throws — returns null on any error.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const user = await account.get();
    return toAuthUser(user as AppwriteAccount);
  } catch {
    return null;
  }
}

/**
 * Initiate Google OAuth sign-in.
 * This is a browser redirect — not a Promise.
 * The session is picked up by AuthContext on the callback page.
 */
export function loginWithGoogle(): void {
  account.createOAuth2Session(
    'google' as any,
    `${window.location.origin}/auth/callback`,
    `${window.location.origin}/login`,
  );
}

/**
 * Send an email verification link to the current user.
 * @param url  The URL Appwrite will append the verification token to.
 */
export async function sendVerificationEmail(
  url = `${window.location.origin}/verify-email`,
): Promise<void> {
  try {
    await account.createVerification(url);
  } catch (err) {
    throw mapError(err);
  }
}

/**
 * Confirm an email verification token (from the link in the verification email).
 * @param userId  Appwrite user $id (from the URL param)
 * @param secret  The one-time token (from the URL param)
 */
export async function confirmVerification(userId: string, secret: string): Promise<void> {
  try {
    await account.updateVerification(userId, secret);
  } catch (err) {
    throw mapError(err);
  }
}

/**
 * Send a password recovery email.
 * @param email  The user's email address
 * @param url    Optional custom reset URL. Defaults to /reset-password on the current origin.
 */
export async function sendPasswordRecovery(
  email: string,
  url = `${window.location.origin}/reset-password`,
): Promise<void> {
  try {
    await account.createRecovery(email.trim().toLowerCase(), url);
  } catch (err) {
    throw mapError(err);
  }
}

/**
 * Confirm a password reset (from the link in the recovery email).
 * @param userId         Appwrite user $id (from the URL param)
 * @param secret         The one-time token (from the URL param)
 * @param password       New password
 * @param passwordAgain  Confirmation — must match `password`
 */
export async function confirmPasswordRecovery(
  userId: string,
  secret: string,
  password: string,
  passwordAgain: string,
): Promise<void> {
  if (password !== passwordAgain) {
    throw new AuthError({
      code: 'PASSWORD_MISMATCH',
      title: 'Passwords do not match',
      message: "The passwords you entered don't match.",
      field: 'passwordAgain',
    });
  }
  try {
    await account.updateRecovery(userId, secret, password);
  } catch (err) {
    throw mapError(err);
  }
}

/**
 * Check whether a username is available in the profiles collection.
 * Returns true if available, false if taken. Never throws.
 */
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PROFILES,
      [Query.equal('username', username.toLowerCase().trim()), Query.limit(1)],
    );
    return res.total === 0;
  } catch {
    return true; // Assume available if we can't check
  }
}
