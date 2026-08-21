/**
 * src/api/appwrite.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single Appwrite Client + service instances for the entire SPORTiX mobile app.
 * Rule: Import Appwrite SDK resources ONLY from this file.
 *       Never call `new Client()` anywhere else.
 */
import { Client, Account, Databases, Storage, Realtime, ID, Query } from 'react-native-appwrite';

// ─── Connection config ────────────────────────────────────────────────────────
export const APPWRITE_CONFIG = {
  ENDPOINT:   'https://sgp.cloud.appwrite.io/v1',
  PROJECT_ID: '6a5fab1d0026ad341f32',
  DATABASE_ID:'6a5faf43003e0b2d9f34',
} as const;

// ─── Singleton client ─────────────────────────────────────────────────────────
export const client = new Client()
  .setEndpoint(APPWRITE_CONFIG.ENDPOINT)
  .setProject(APPWRITE_CONFIG.PROJECT_ID)
  .setPlatform('com.sportix.app');

// ─── Service instances ────────────────────────────────────────────────────────
export const account   = new Account(client);
export const databases = new Databases(client);
export const storage   = new Storage(client);
export const realtime  = new Realtime(client);

// ─── Database ID ──────────────────────────────────────────────────────────────
export const DATABASE_ID = APPWRITE_CONFIG.DATABASE_ID;

// ─── Storage buckets (fallback chain: primary → fallbacks) ────────────────────
export const BUCKETS = {
  MEDIA:        'sportix-media',           // primary
  FALLBACK_1:   '6a5faf1a000b5d9156b5',   // fallback
  IMAGES:       'sportix-images',
  VIDEOS:       'sportix-videos',
  PROOFS:       'sportix-proofs',
} as const;

export const BUCKET_FALLBACK_CHAIN = [
  BUCKETS.MEDIA,
  BUCKETS.FALLBACK_1,
  BUCKETS.IMAGES,
  BUCKETS.VIDEOS,
  BUCKETS.PROOFS,
] as const;

// ─── Collection IDs (exact Appwrite names — do not rename) ───────────────────
export const COLLECTIONS = {
  PROFILES:              'profiles',
  POSTS:                 'posts',
  POST_LIKES:            'post_likes',
  COMMENTS:              'comments',
  STORIES:               'stories',
  STORY_VIEWS:           'story_views',
  REELS:                 'reels',
  REEL_LIKES:            'reel_likes',
  FOLLOWERS:             'followers',
  NOTIFICATIONS:         'notifications',
  EVENTS:                'events',
  EVENT_PARTICIPANTS:    'event_participants',
  SQUADS:                'squads',
  SQUAD_MEMBERS:         'squad_members',
  MATCHES:               'matches',
  PLAYER_STATS:          'player_stats',
  STAT_VALIDATIONS:      'stat_validations',
  PULSE_SCORES:          'pulse_scores',
  PULSE_HISTORY:         'pulse_history',
  USER_LEVELS:           'user_levels',
  LEVEL_HISTORY:         'level_history',
  USER_COINS:            'user_coins',
  COIN_TRANSACTIONS:     'coin_transactions',
  DAILY_MISSIONS:        'daily_missions',
  USER_MISSIONS:         'user_missions',
  USER_STREAKS:          'user_streaks',
  BADGES:                'badges',
  USER_BADGES:           'user_badges',
  CONVERSATIONS:         'conversations',
  CONVERSATION_MEMBERS:  'conversation_members',
  MESSAGES:              'messages',
  GENERATED_SQUADS:      'generated_squads',
  AUTOSQUAD_REQUESTS:    'autosquad_requests',
  RETENTION_VOTES:       'retention_votes',
  LEADERBOARD:           'leaderboard',
  CREWS:                 'crews',
  CREW_MEMBERS:          'crew_members',
  SPORTIX_SPORT_ROLES:   'sportix_sport_roles',
} as const;

// ─── FastAPI base URL ─────────────────────────────────────────────────────────
export const FASTAPI_URL = 'http://localhost:8000';

// ─── Re-exports ───────────────────────────────────────────────────────────────
export { ID, Query };
export default client;
