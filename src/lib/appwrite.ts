/**
 * src/lib/appwrite.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Backward-compatibility barrel.
 *
 * All Appwrite SDK resources now live in `src/lib/appwrite/client.ts`.
 * This file re-exports everything so every existing import continues to work
 * without any changes to the 20+ files that reference `@/lib/appwrite`.
 */
export * from './appwrite/client';
export { default } from './appwrite/client';