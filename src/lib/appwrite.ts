import { Client, Account, Databases, Storage, ID, Query } from 'appwrite';

export const client = new Client()
  .setEndpoint('https://sgp.cloud.appwrite.io/v1')
  .setProject('6a5fab1d0026ad341f32');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '6a5faf43003e0b2d9f34';
export const BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID || '6a5faf1a000b5d9156b5';

export const COLLECTIONS = {
  PROFILES: 'profiles',
  POSTS: 'posts',
  POST_LIKES: 'post_likes',
  COMMENTS: 'comments',
  STORIES: 'stories',
  STORY_VIEWS: 'story_views',
  REELS: 'reels',
  REEL_LIKES: 'reel_likes',
  FOLLOWERS: 'followers',
  NOTIFICATIONS: 'notifications',
  EVENTS: 'events',
  EVENT_PARTICIPANTS: 'event_participants',
  SQUADS: 'squads',
  SQUAD_MEMBERS: 'squad_members',
  MATCHES: 'matches',
  PLAYER_STATS: 'player_stats',
  PULSE_SCORES: 'pulse_scores',
  USER_LEVELS: 'user_levels',
  USER_COINS: 'user_coins',
  USER_STREAKS: 'user_streaks',
  DAILY_MISSIONS: 'daily_missions',
  USER_MISSIONS: 'user_missions',
  BADGES: 'badges',
  USER_BADGES: 'user_badges',
};

export { ID, Query };
export default client;