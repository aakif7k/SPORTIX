/**
 * src/lib/appwrite/client.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single Appwrite Client + service instances for the entire SPORTiX app.
 *
 * Rule: Import Appwrite SDK resources ONLY from this file.
 *       Never call `new Client()` anywhere else.
 */

import { Client, Account, Databases, Storage, ID, Query } from 'appwrite';

// ─── Environment-aware endpoint resolution ────────────────────────────────────
const endpoint =
  import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';
const projectId =
  import.meta.env.VITE_APPWRITE_PROJECT_ID || '6a5fab1d0026ad341f32';

// ─── Singleton client ─────────────────────────────────────────────────────────
export const client = new Client().setEndpoint(endpoint).setProject(projectId);

// ─── Service instances ────────────────────────────────────────────────────────
export const account   = new Account(client);
export const databases = new Databases(client);
export const storage   = new Storage(client);

// ─── Database & bucket IDs ───────────────────────────────────────────────────
export const DATABASE_ID =
  import.meta.env.VITE_APPWRITE_DATABASE_ID || '6a5faf43003e0b2d9f34';

export const BUCKET_ID =
  import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID || 'sportix-media';

export const BUCKETS = {
  MEDIA:        import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID || 'sportix-media',
  POST_IMAGES:  'sportix-images',
  POST_VIDEOS:  'sportix-videos',
  PROOFS:       'sportix-proofs',
  AVATARS:      'sportix-images',
} as const;

// ─── Collection IDs ───────────────────────────────────────────────────────────
export const COLLECTIONS = {
  PROFILES:             'profiles',
  POSTS:                'posts',
  POST_LIKES:           'post_likes',
  COMMENTS:             'comments',
  STORIES:              'stories',
  STORY_VIEWS:          'story_views',
  REELS:                'reels',
  REEL_LIKES:           'reel_likes',
  FOLLOWERS:            'followers',
  NOTIFICATIONS:        'notifications',
  EVENTS:               'events',
  EVENT_PARTICIPANTS:   'event_participants',
  SQUADS:               'squads',
  SQUAD_MEMBERS:        'squad_members',
  MATCHES:              'matches',
  PLAYER_STATS:         'player_stats',
  PULSE_SCORES:         'pulse_scores',
  USER_LEVELS:          'user_levels',
  USER_COINS:           'user_coins',
  USER_STREAKS:         'user_streaks',
  DAILY_MISSIONS:       'daily_missions',
  USER_MISSIONS:        'user_missions',
  BADGES:               'badges',
  CONVERSATIONS:        'conversations',
  CONVERSATION_MEMBERS: 'conversation_members',
  MESSAGES:             'messages',
  USER_BADGES:          'user_badges',
  GENERATED_SQUAD:      'generated_squads',
  AUTOSQUAD_REQUESTS:   'autosquad_requests',
  SPORTIX_SPORT_ROLES:  'sportix_sport_roles',
} as const;

// ─── Re-export Appwrite helpers so callers have one import ───────────────────
export { ID, Query };
export default client;
