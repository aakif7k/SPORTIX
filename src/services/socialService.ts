/**
 * socialService — posts, stories, reels, follows.
 *
 * Every call goes through the FastAPI backend. This file used to talk to Appwrite
 * directly with the browser SDK, which stopped working the moment collection
 * permissions were locked down: clients hold no create, update or delete
 * permission on any collection, because the server API key bypasses permissions
 * and the server owns all denormalisation and counter maintenance.
 *
 * So roughly twenty writes in here — creating posts, stories and reels, toggling
 * likes, recording views, following people, updating an avatar — were being
 * rejected by Appwrite. Several were wrapped in try/catch and reported as
 * "collection pending", so the UI showed success while nothing was saved.
 *
 * The exported signatures are unchanged, so the seven consumers need no edits.
 * What changed is underneath: no databases.*, no storage.*, no ID.unique().
 *
 * Reads go through the API too. The browser SDK could still read (profiles, posts
 * and friends grant Role.users() read for realtime), but splitting reads and
 * writes across two transports is how the field-casing drift started, and the
 * server is what applies is_liked, blocking and privacy rules.
 */
import { api } from '@/lib/api';

type Json = Record<string, unknown>;

/** The backend wraps every success as {success, data}. */
interface Envelope<T> { success: boolean; data: T }

export interface DbProfile {
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

export interface DbPost {
  id: string;
  author_id: string;
  author_name: string;
  author_username: string;
  author_avatar_url: string | null;
  author_sport: string;
  content: string;
  media_urls: string[];
  media_type: 'none' | 'image' | 'multi_image' | 'video';
  post_type: string;
  sport_tag: string | null;
  location_tag: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  is_liked?: boolean;
  // For backwards compat with PostCard which reads author.*
  author?: {
    full_name: string;
    username: string;
    avatar_url: string | null;
    sport: string;
  };
}

export interface DbComment {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  author_avatar_url: string | null;
  content: string;
  created_at: string;
}

export interface DbStory {
  id: string;
  author_id: string;
  author_name: string;
  author_username: string;
  author_avatar: string | null;
  media_url: string;
  media_type: 'image' | 'video';
  caption: string | null;
  sport_tag: string | null;
  view_count: number;
  created_at: string;
  expires_at: string;
  is_seen?: boolean;
}

export interface DbStoryGroup {
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  author_username: string;
  stories: DbStory[];
  has_unseen: boolean;
}

export interface DbReel {
  id: string;
  author_id: string;
  video_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  sport_tag: string | null;
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  is_liked?: boolean;
  author?: {
    full_name: string;
    username: string;
    avatar_url: string | null;
    sport: string;
  };
}

export interface ProfileStats {
  posts: number;
  reels: number;
  followers: number;
  following: number;
}

// ─── Mapping ──────────────────────────────────────────────────────────────────
// Appwrite documents use $id; these interfaces use `id`. The nested `author`
// object is rebuilt from the denormalised author_* columns because PostCard and
// ReelCard read it that way.

function authorOf(d: Json) {
  return {
    full_name: readStr(d.author_full_name) || readStr(d.author_name),
    username: readStr(d.author_username),
    avatar_url: readStrOrNull(d.author_avatar_url),
    sport: readStr(d.author_sport),
  };
}

/**
 * Field readers for an Appwrite document.
 *
 * `Json` was `Record<string, any>`, so every read below compiled regardless of what
 * the field actually held — a number in a string slot, an object in a boolean. These
 * narrow, which is the checking the `any` was suppressing.
 */
const readStr = (v: unknown, fallback = ''): string =>
  typeof v === 'string' ? v : typeof v === 'number' ? String(v) : fallback;

const readStrOrNull = (v: unknown): string | null =>
  typeof v === 'string' ? v : null;

const readNum = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;

const readBool = (v: unknown, fallback = false): boolean =>
  typeof v === 'boolean' ? v : fallback;

/** One of a known set, falling back rather than letting an unknown value through. */
const readEnum = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;

const readStrList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

function toPost(d: Json): DbPost {
  return {
    id: readStr(d.$id) || readStr(d.id),
    author_id: readStr(d.author_id),
    author_name: readStr(d.author_full_name) || readStr(d.author_name),
    author_username: readStr(d.author_username),
    author_avatar_url: readStrOrNull(d.author_avatar_url),
    author_sport: readStr(d.author_sport),
    content: readStr(d.content),
    media_urls: readStrList(d.media_urls),
    media_type: readEnum(d.media_type, ['none', 'image', 'video', 'multi_image'] as const, 'none'),
    post_type: readEnum(d.post_type, ['general', 'highlight', 'achievement', 'training'] as const, 'general'),
    sport_tag: readStrOrNull(d.sport_tag),
    location_tag: readStrOrNull(d.location_tag),
    likes_count: readNum(d.likes_count),
    comments_count: readNum(d.comments_count),
    created_at: readStr(d.created_at) || readStr(d.$createdAt),
    is_liked: readBool(d.is_liked, false),
    author: authorOf(d),
  };
}

function toComment(d: Json): DbComment {
  return {
    id: readStr(d.$id) || readStr(d.id),
    post_id: readStr(d.post_id),
    author_id: readStr(d.author_id),
    author_name: readStr(d.author_name) || readStr(d.author_full_name),
    author_avatar_url: readStrOrNull(d.author_avatar_url),
    content: readStr(d.content),
    created_at: readStr(d.created_at) || readStr(d.$createdAt),
  };
}

function toStory(d: Json): DbStory {
  return {
    id: readStr(d.$id) || readStr(d.id),
    author_id: readStr(d.author_id),
    author_name: readStr(d.author_full_name) || readStr(d.author_name),
    author_username: readStr(d.author_username),
    author_avatar: readStrOrNull(d.author_avatar_url),
    media_url: readStr(d.media_url),
    media_type: readEnum(d.media_type, ['image', 'video'] as const, 'image'),
    caption: readStrOrNull(d.caption),
    sport_tag: readStrOrNull(d.sport_tag),
    view_count: readNum(d.view_count),
    created_at: readStr(d.created_at) || readStr(d.$createdAt),
    expires_at: readStr(d.expires_at),
    is_seen: readBool(d.is_seen, false),
  };
}

function toReel(d: Json): DbReel {
  return {
    id: readStr(d.$id) || readStr(d.id),
    author_id: readStr(d.author_id),
    video_url: readStr(d.video_url),
    thumbnail_url: readStrOrNull(d.thumbnail_url),
    caption: readStrOrNull(d.caption),
    sport_tag: readStrOrNull(d.sport_tag),
    likes_count: readNum(d.likes_count),
    comments_count: readNum(d.comments_count),
    views_count: readNum(d.views_count),
    created_at: readStr(d.created_at) || readStr(d.$createdAt),
    is_liked: readBool(d.is_liked, false),
    author: authorOf(d),
  };
}

/** List endpoints have used `items`, `documents` and a domain key over time. */
function listOf(data: Json | undefined, ...keys: string[]): Json[] {
  if (!data) return [];
  for (const key of [...keys, 'items', 'documents']) {
    if (Array.isArray(data[key])) return data[key];
  }
  return Array.isArray(data) ? (data as unknown as Json[]) : [];
}

// ─── Uploads ──────────────────────────────────────────────────────────────────
export async function uploadMedia(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await api.upload<Envelope<{ url: string }>>('/api/upload/post-media', form);
  return res.data.url;
}

export async function uploadAvatar(_authUid: string, file: File): Promise<string> {
  // The endpoint attaches the URL to the caller's own profile, derived from the
  // JWT, so the uid argument is unused and cannot be used to target someone else.
  const form = new FormData();
  form.append('file', file);
  const res = await api.upload<Envelope<{ url: string }>>('/api/upload/avatar', form);
  return res.data.url;
}

// ─── Posts ────────────────────────────────────────────────────────────────────
export async function getFeedPosts(
  _authUid: string,
  page = 0,
  limit = 20,
): Promise<DbPost[]> {
  const res = await api.get<Envelope<Json>>(`/api/posts/feed?page=${page}&limit=${limit}`);
  return listOf(res.data, 'posts').map(toPost);
}

export async function getUserPosts(authorId: string, page = 0, limit = 20): Promise<DbPost[]> {
  const res = await api.get<Envelope<Json>>(
    `/api/posts/user/${authorId}?page=${page}&limit=${limit}`,
  );
  return listOf(res.data, 'posts').map(toPost);
}

export interface CreatePostPayload {
  content: string;
  mediaFiles?: File[];
  postType?: string;
  sportTag?: string | null;
  locationTag?: string | null;
}

export async function createPost(_authUid: string, payload: CreatePostPayload): Promise<DbPost> {
  // Media first: the post references URLs the upload endpoint returns.
  const mediaUrls: string[] = [];
  for (const file of payload.mediaFiles ?? []) {
    mediaUrls.push(await uploadMedia(file));
  }

  const mediaType =
    mediaUrls.length === 0 ? 'none'
      : mediaUrls.length > 1 ? 'multi_image'
        : (payload.mediaFiles?.[0]?.type.startsWith('video') ? 'video' : 'image');

  const res = await api.post<Envelope<Json>>('/api/posts/', {
    content: payload.content,
    media_urls: mediaUrls,
    media_type: mediaType,
    post_type: payload.postType ?? 'general',
    sport_tag: payload.sportTag ?? null,
    location_tag: payload.locationTag ?? null,
  });
  return toPost(res.data);
}

export async function deletePost(postId: string, _authUid: string): Promise<void> {
  // Ownership is enforced server-side from the JWT.
  await api.delete(`/api/posts/${postId}`);
}

export async function togglePostLike(
  postId: string,
  _authUid: string,
  _currentlyLiked: boolean,
): Promise<{ liked: boolean; likes_count: number }> {
  // The server decides the new state, so the client's belief about the current
  // one is not sent. Two rapid taps therefore cannot desynchronise the counter.
  const res = await api.post<Envelope<{ liked: boolean; likes_count: number }>>(
    `/api/posts/${postId}/like`,
  );
  return res.data;
}

export async function getComments(postId: string): Promise<DbComment[]> {
  const res = await api.get<Envelope<Json>>(`/api/posts/${postId}/comments`);
  return listOf(res.data, 'comments').map(toComment);
}

export async function addComment(
  postId: string,
  _authUid: string,
  content: string,
): Promise<DbComment> {
  const res = await api.post<Envelope<Json>>(`/api/posts/${postId}/comments`, { content });
  return toComment(res.data);
}

// ─── Stories ──────────────────────────────────────────────────────────────────
export async function getActiveStories(_authUid: string): Promise<DbStoryGroup[]> {
  const res = await api.get<Envelope<Json>>('/api/stories/');
  const raw = listOf(res.data, 'stories', 'groups');

  // The endpoint may return either flat stories or pre-grouped authors; grouping
  // here keeps StoryBar working with both.
  if (raw.length && Array.isArray(raw[0]?.stories)) {
    return raw.map(g => ({
      author_id: readStr(g.author_id),
      author_name: readStr(g.author_full_name) || readStr(g.author_name),
      author_avatar: readStrOrNull(g.author_avatar_url),
      author_username: readStr(g.author_username),
      stories: (g.stories as Json[]).map(toStory),
      // A group may state it, or it is derived from the stories themselves.
      has_unseen: typeof g.has_unseen === 'boolean'
        ? g.has_unseen
        : (g.stories as Json[]).some(story => !readBool(story.is_seen)),
    }));
  }

  const byAuthor = new Map<string, DbStoryGroup>();
  for (const story of raw.map(toStory)) {
    let group = byAuthor.get(story.author_id);
    if (!group) {
      group = {
        author_id: story.author_id,
        author_name: story.author_name,
        author_avatar: story.author_avatar,
        author_username: story.author_username,
        stories: [],
        has_unseen: false,
      };
      byAuthor.set(story.author_id, group);
    }
    group.stories.push(story);
    if (!story.is_seen) group.has_unseen = true;
  }
  return [...byAuthor.values()];
}

export async function createStory(
  file: File,
  caption?: string,
  sportTag?: string,
): Promise<void> {
  const form = new FormData();
  form.append('file', file);
  const upload = await api.upload<Envelope<{ url: string }>>('/api/upload/story-media', form);

  await api.post('/api/stories/', {
    media_url: upload.data.url,
    media_type: file.type.startsWith('video') ? 'video' : 'image',
    caption: caption ?? null,
    sport_tag: sportTag ?? null,
  });
}

export async function markStoryViewed(storyId: string, _viewerAuthUid: string): Promise<void> {
  await api.post(`/api/stories/${storyId}/view`);
}

// ─── Reels ────────────────────────────────────────────────────────────────────
export async function getReels(_authUid: string, page = 0, limit = 10): Promise<DbReel[]> {
  const res = await api.get<Envelope<Json>>(`/api/reels/?page=${page}&limit=${limit}`);
  return listOf(res.data, 'reels').map(toReel);
}

export async function getUserReels(authorId: string): Promise<DbReel[]> {
  const res = await api.get<Envelope<Json>>(`/api/reels/user/${authorId}`);
  return listOf(res.data, 'reels').map(toReel);
}

export async function createReel(
  videoFile: File,
  thumbnailFile: File | null,
  caption?: string,
  sportTag?: string,
): Promise<void> {
  // Author name, username, avatar and sport used to be passed in and written by
  // the client. The server denormalises them from the JWT's profile now, so those
  // parameters are gone rather than left as dead arguments.
  const videoForm = new FormData();
  videoForm.append('file', videoFile);
  const video = await api.upload<Envelope<{ url: string }>>('/api/upload/reel-video', videoForm);

  let thumbnailUrl: string | null = null;
  if (thumbnailFile) {
    const thumbForm = new FormData();
    thumbForm.append('file', thumbnailFile);
    const thumb = await api.upload<Envelope<{ url: string }>>(
      '/api/upload/reel-thumbnail', thumbForm,
    );
    thumbnailUrl = thumb.data.url;
  }

  await api.post('/api/reels/', {
    video_url: video.data.url,
    thumbnail_url: thumbnailUrl,
    caption: caption ?? null,
    sport_tag: sportTag ?? null,
  });
}

export async function toggleReelLike(
  reelId: string,
  _authUid: string,
  _currentlyLiked: boolean,
): Promise<void> {
  await api.post(`/api/reels/${reelId}/like`);
}

export async function recordReelView(reelId: string): Promise<void> {
  // Best effort: a lost view must never interrupt playback.
  try {
    await api.post(`/api/reels/${reelId}/view`);
  } catch {
    /* ignore */
  }
}

// ─── Follows ──────────────────────────────────────────────────────────────────
export async function followUser(_followerUid: string, followingUid: string): Promise<void> {
  await api.post(`/api/users/${followingUid}/follow`);
}

export async function unfollowUser(_followerUid: string, followingUid: string): Promise<void> {
  await api.delete(`/api/users/${followingUid}/follow`);
}

export async function checkIsFollowing(
  _followerUid: string,
  followingUid: string,
): Promise<boolean> {
  const res = await api.get<Envelope<{ is_following: boolean }>>(
    `/api/users/${followingUid}/is-following`,
  );
  return res.data.is_following;
}

export async function getFollowCounts(
  _authUid: string,
): Promise<{ followers: number; following: number }> {
  const res = await api.get<Envelope<Json>>('/api/users/me/stats');
  return {
    followers: readNum(res.data.followers) || readNum(res.data.followers_count),
    following: readNum(res.data.following) || readNum(res.data.following_count),
  };
}

export async function getProfileStats(_authUid: string): Promise<ProfileStats> {
  const res = await api.get<Envelope<Json>>('/api/users/me/stats');
  return {
    posts: readNum(res.data.posts) || readNum(res.data.posts_count),
    reels: readNum(res.data.reels) || readNum(res.data.reels_count),
    followers: readNum(res.data.followers) || readNum(res.data.followers_count),
    following: readNum(res.data.following) || readNum(res.data.following_count),
  };
}

// ─── Match reports ────────────────────────────────────────────────────────────
export async function hasPendingMatchReport(_authUid: string): Promise<boolean> {
  const res = await api.get<Envelope<{ has_pending: boolean }>>(
    '/api/matches/pending-report/check',
  );
  return res.data.has_pending ?? false;
}

/**
 * No-op kept for call-site compatibility.
 *
 * The Pulse, level, coins and streak rows are created by the register endpoint,
 * alongside the profile, so there is nothing left for the client to initialise.
 */
export async function initializeNewUserRecords(_authUid: string): Promise<void> {
  /* intentionally empty */
}
