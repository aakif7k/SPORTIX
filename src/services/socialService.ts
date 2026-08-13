/**
 * socialService.ts — Appwrite backend
 * ─────────────────────────────────────────────────────────────────────────────
 * All social content (posts, stories, reels) reads from and writes to Appwrite.
 * NO Supabase. NO mock data. author_id is ALWAYS the Appwrite auth user $id.
 *
 * NOTE: Appwrite has no JOINs, so author info is denormalised into each document
 * at creation time (author_name, author_avatar_url, author_sport).
 */

import {
  databases, storage, ID, Query,
  DATABASE_ID, COLLECTIONS, BUCKET_ID,
} from '@/lib/appwrite';
type AppwriteDocument = Record<string, any> & { $id: string; $createdAt: string; $updatedAt: string };

// ─── Shared types ──────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function docToPost(doc: AppwriteDocument, isLiked = false): DbPost {
  const post: DbPost = {
    id:               doc.$id,
    author_id:        doc.author_id,
    author_name:      doc.author_name       ?? '',
    author_username:  doc.author_username   ?? '',
    author_avatar_url:doc.author_avatar_url ?? null,
    author_sport:     doc.author_sport      ?? '',
    content:          doc.content           ?? '',
    media_urls:       doc.media_urls        ?? [],
    media_type:       doc.media_type        ?? 'none',
    post_type:        doc.post_type         ?? 'general',
    sport_tag:        doc.sport_tag         ?? null,
    location_tag:     doc.location_tag      ?? null,
    likes_count:      doc.likes_count       ?? 0,
    comments_count:   doc.comments_count    ?? 0,
    created_at:       doc.created_at        ?? doc.$createdAt,
    is_liked:         isLiked,
  };
  // Attach nested author shape so PostCard.author.* access works
  post.author = {
    full_name:  post.author_name,
    username:   post.author_username,
    avatar_url: post.author_avatar_url,
    sport:      post.author_sport,
  };
  return post;
}

function docToStory(doc: AppwriteDocument, isSeen = false): DbStory {
  return {
    id:             doc.$id,
    author_id:      doc.author_id,
    author_name:    doc.author_name     ?? '',
    author_username:doc.author_username ?? '',
    author_avatar:  doc.author_avatar   ?? null,
    media_url:      doc.media_url       ?? '',
    media_type:     doc.media_type      ?? 'image',
    caption:        doc.caption         ?? null,
    sport_tag:      doc.sport_tag       ?? null,
    view_count:     doc.view_count      ?? 0,
    created_at:     doc.created_at      ?? doc.$createdAt,
    expires_at:     doc.expires_at      ?? '',
    is_seen:        isSeen,
  };
}

function docToReel(doc: AppwriteDocument, isLiked = false): DbReel {
  const reel: DbReel = {
    id:             doc.$id,
    author_id:      doc.author_id,
    video_url:      doc.video_url       ?? '',
    thumbnail_url:  doc.thumbnail_url   ?? null,
    caption:        doc.caption         ?? null,
    sport_tag:      doc.sport_tag       ?? null,
    likes_count:    doc.likes_count     ?? 0,
    comments_count: doc.comments_count  ?? 0,
    views_count:    doc.views_count     ?? 0,
    created_at:     doc.created_at      ?? doc.$createdAt,
    is_liked:       isLiked,
  };
  reel.author = {
    full_name:  doc.author_name      ?? '',
    username:   doc.author_username  ?? '',
    avatar_url: doc.author_avatar_url ?? null,
    sport:      doc.author_sport     ?? '',
  };
  return reel;
}

// ─── MEDIA UPLOAD ─────────────────────────────────────────────────────────────

export async function uploadMedia(file: File): Promise<string> {
  const uploaded = await storage.createFile(BUCKET_ID, ID.unique(), file);
  const url = storage.getFileView(BUCKET_ID, uploaded.$id);
  return url.toString();
}

export async function uploadAvatar(authUid: string, file: File): Promise<string> {
  const url = await uploadMedia(file);
  await databases.updateDocument(DATABASE_ID, COLLECTIONS.PROFILES, authUid, {
    avatar_url: url,
    updated_at: new Date().toISOString(),
  });
  return url;
}

// ─── POSTS ────────────────────────────────────────────────────────────────────

export async function getFeedPosts(
  authUid: string,
  page = 0,
  limit = 20,
): Promise<DbPost[]> {
  const res = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.POSTS,
    [
      Query.orderDesc('created_at'),
      Query.limit(limit),
      Query.offset(page * limit),
    ],
  );

  if (res.documents.length === 0) return [];

  // Check which posts are liked by current user
  const postIds = res.documents.map(d => d.$id);
  const likesRes = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.POST_LIKES,
    [
      Query.equal('user_id', authUid),
      Query.equal('post_id', postIds),
      Query.limit(limit),
    ],
  );
  const likedSet = new Set(likesRes.documents.map(l => l.post_id as string));

  return res.documents.map(doc => docToPost(doc, likedSet.has(doc.$id)));
}

export async function getUserPosts(authorId: string, page = 0, limit = 20): Promise<DbPost[]> {
  const res = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.POSTS,
    [
      Query.equal('author_id', authorId),
      Query.orderDesc('created_at'),
      Query.limit(limit),
      Query.offset(page * limit),
    ],
  );
  return res.documents.map(doc => docToPost(doc));
}

export interface CreatePostPayload {
  content: string;
  files?: File[];
  post_type?: string;
  sport_tag?: string;
  location_tag?: string;
  // Denormalised author info (passed from the caller who has profile data)
  authorName: string;
  authorUsername: string;
  authorAvatarUrl?: string | null;
  authorSport?: string;
}

export async function createPost(authUid: string, payload: CreatePostPayload): Promise<DbPost> {
  // Upload media files first
  let mediaUrls: string[] = [];
  let mediaType: DbPost['media_type'] = 'none';

  if (payload.files && payload.files.length > 0) {
    const uploads = await Promise.all(payload.files.map(f => uploadMedia(f)));
    mediaUrls = uploads;

    const first = payload.files[0];
    if (first.type.startsWith('video/')) {
      mediaType = 'video';
    } else if (payload.files.length === 1) {
      mediaType = 'image';
    } else {
      mediaType = 'multi_image';
    }
  }

  const now = new Date().toISOString();
  const doc = await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.POSTS,
    ID.unique(),
    {
      author_id:          authUid,
      author_full_name:   payload.authorName,
      author_username:    payload.authorUsername,
      author_avatar_url:  payload.authorAvatarUrl  ?? null,
      author_sport:       payload.authorSport       ?? '',
      content:            payload.content.trim(),
      media_urls:         mediaUrls,
      media_type:         mediaType,
      post_type:          payload.post_type   ?? 'general',
      sport_tag:          payload.sport_tag   ?? null,
      location_tag:       payload.location_tag ?? null,
      likes_count:        0,
      comments_count:     0,
      created_at:         now,
    },
  );

  return docToPost(doc, false);
}

export async function deletePost(postId: string, authUid: string): Promise<void> {
  // Verify ownership before deleting
  const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.POSTS, postId);
  if (doc.author_id !== authUid) throw new Error('Not authorised to delete this post.');
  await databases.deleteDocument(DATABASE_ID, COLLECTIONS.POSTS, postId);
}

export async function updatePost(
  postId: string,
  authUid: string,
  updates: {
    content?: string;
    post_type?: string;
    sport_tag?: string | null;
    location_tag?: string | null;
    media_urls?: string[];
  }
): Promise<DbPost> {
  const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.POSTS, postId);
  if (doc.author_id !== authUid) throw new Error('Not authorised to edit this post.');

  const updatedDoc = await databases.updateDocument(
    DATABASE_ID,
    COLLECTIONS.POSTS,
    postId,
    {
      ...updates,
      updated_at: new Date().toISOString(),
    }
  );

  return docToPost(updatedDoc, false);
}

export async function deleteReel(reelId: string, authUid: string): Promise<void> {
  const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.REELS, reelId);
  if (doc.author_id !== authUid) throw new Error('Not authorised to delete this reel.');
  await databases.deleteDocument(DATABASE_ID, COLLECTIONS.REELS, reelId);
}

export async function updateReel(
  reelId: string,
  authUid: string,
  updates: {
    caption?: string | null;
    sport_tag?: string | null;
    video_url?: string;
    thumbnail_url?: string | null;
  }
): Promise<DbReel> {
  const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.REELS, reelId);
  if (doc.author_id !== authUid) throw new Error('Not authorised to edit this reel.');

  const updatedDoc = await databases.updateDocument(
    DATABASE_ID,
    COLLECTIONS.REELS,
    reelId,
    {
      ...updates,
      updated_at: new Date().toISOString(),
    }
  );

  return docToReel(updatedDoc, false);
}

export async function togglePostLike(
  postId: string,
  authUid: string,
  currentlyLiked: boolean,
): Promise<void> {
  if (currentlyLiked) {
    // Find and delete the like document
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.POST_LIKES,
      [Query.equal('post_id', postId), Query.equal('user_id', authUid), Query.limit(1)],
    );
    if (res.documents.length > 0) {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.POST_LIKES, res.documents[0].$id);
    }
    // Decrement counter
    const post = await databases.getDocument(DATABASE_ID, COLLECTIONS.POSTS, postId);
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.POSTS, postId, {
      likes_count: Math.max(0, (post.likes_count ?? 1) - 1),
    });
  } else {
    await databases.createDocument(DATABASE_ID, COLLECTIONS.POST_LIKES, ID.unique(), {
      post_id: postId,
      user_id: authUid,
      created_at: new Date().toISOString(),
    });
    const post = await databases.getDocument(DATABASE_ID, COLLECTIONS.POSTS, postId);
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.POSTS, postId, {
      likes_count: (post.likes_count ?? 0) + 1,
    });
  }
}

// ─── COMMENTS ─────────────────────────────────────────────────────────────────

export async function getComments(postId: string): Promise<DbComment[]> {
  const res = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.COMMENTS,
    [Query.equal('post_id', postId), Query.orderAsc('created_at'), Query.limit(100)],
  );
  return res.documents.map(doc => ({
    id:               doc.$id,
    post_id:          doc.post_id,
    author_id:        doc.author_id,
    author_name:      doc.author_name      ?? '',
    author_avatar_url:doc.author_avatar_url ?? null,
    content:          doc.content,
    created_at:       doc.created_at       ?? doc.$createdAt,
  }));
}

export async function addComment(
  postId: string,
  authUid: string,
  content: string,
  authorName: string,
  authorAvatarUrl?: string | null,
): Promise<DbComment> {
  const doc = await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.COMMENTS,
    ID.unique(),
    {
      post_id:           postId,
      author_id:         authUid,
      author_name:       authorName,
      author_avatar_url: authorAvatarUrl ?? null,
      content:           content.trim(),
      created_at:        new Date().toISOString(),
    },
  );
  // Increment comments_count
  const post = await databases.getDocument(DATABASE_ID, COLLECTIONS.POSTS, postId);
  await databases.updateDocument(DATABASE_ID, COLLECTIONS.POSTS, postId, {
    comments_count: (post.comments_count ?? 0) + 1,
  });

  return {
    id:               doc.$id,
    post_id:          doc.post_id,
    author_id:        doc.author_id,
    author_name:      doc.author_name      ?? '',
    author_avatar_url:doc.author_avatar_url ?? null,
    content:          doc.content,
    created_at:       doc.created_at       ?? doc.$createdAt,
  };
}

// ─── STORIES ──────────────────────────────────────────────────────────────────

export async function getActiveStories(authUid: string): Promise<DbStoryGroup[]> {
  const now = new Date().toISOString();
  const res = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.STORIES,
    [
      Query.greaterThan('expires_at', now),
      Query.orderDesc('created_at'),
      Query.limit(100),
    ],
  );
  if (res.documents.length === 0) return [];

  // Get seen story IDs for current user
  const storyIds = res.documents.map(d => d.$id);
  const viewsRes = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.STORY_VIEWS,
    [
      Query.equal('viewer_id', authUid),
      Query.equal('story_id', storyIds),
      Query.limit(200),
    ],
  );
  const seenSet = new Set(viewsRes.documents.map(v => v.story_id as string));

  // Group by author
  const map = new Map<string, DbStoryGroup>();
  for (const doc of res.documents) {
    const authorId = doc.author_id as string;
    const isSeen = seenSet.has(doc.$id);
    const story = docToStory(doc, isSeen);

    if (!map.has(authorId)) {
      map.set(authorId, {
        author_id:       authorId,
        author_name:     doc.author_name     ?? '',
        author_avatar:   doc.author_avatar   ?? null,
        author_username: doc.author_username ?? '',
        stories:         [],
        has_unseen:      false,
      });
    }
    const group = map.get(authorId)!;
    group.stories.push(story);
    if (!isSeen) group.has_unseen = true;
  }

  return Array.from(map.values());
}

export async function createStory(
  authUid: string,
  authorName: string,
  authorUsername: string,
  authorAvatar: string | null,
  file: File,
  caption?: string,
  sportTag?: string,
): Promise<void> {
  const isVideo = file.type.startsWith('video/');
  const mediaUrl = await uploadMedia(file);

  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  await databases.createDocument(DATABASE_ID, COLLECTIONS.STORIES, ID.unique(), {
    author_id:       authUid,
    author_name:     authorName,
    author_username: authorUsername,
    author_avatar:   authorAvatar,
    media_url:       mediaUrl,
    media_type:      isVideo ? 'video' : 'image',
    caption:         caption?.trim() ?? null,
    sport_tag:       sportTag ?? null,
    view_count:      0,
    created_at:      now.toISOString(),
    expires_at:      expires.toISOString(),
  });
}

export async function markStoryViewed(storyId: string, viewerAuthUid: string): Promise<void> {
  // Check if already viewed
  const existing = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.STORY_VIEWS,
    [
      Query.equal('story_id', storyId),
      Query.equal('viewer_id', viewerAuthUid),
      Query.limit(1),
    ],
  );
  if (existing.total > 0) return; // Already recorded

  await databases.createDocument(DATABASE_ID, COLLECTIONS.STORY_VIEWS, ID.unique(), {
    story_id:  storyId,
    viewer_id: viewerAuthUid,
    viewed_at: new Date().toISOString(),
  });

  // Increment view_count
  const story = await databases.getDocument(DATABASE_ID, COLLECTIONS.STORIES, storyId);
  await databases.updateDocument(DATABASE_ID, COLLECTIONS.STORIES, storyId, {
    view_count: (story.view_count ?? 0) + 1,
  });
}

// ─── REELS ────────────────────────────────────────────────────────────────────

export async function getReels(authUid: string, page = 0, limit = 10): Promise<DbReel[]> {
  const res = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.REELS,
    [Query.orderDesc('created_at'), Query.limit(limit), Query.offset(page * limit)],
  );
  if (res.documents.length === 0) return [];

  const reelIds = res.documents.map(d => d.$id);
  const likesRes = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.REEL_LIKES,
    [Query.equal('user_id', authUid), Query.equal('reel_id', reelIds), Query.limit(limit)],
  );
  const likedSet = new Set(likesRes.documents.map(l => l.reel_id as string));

  return res.documents.map(doc => docToReel(doc, likedSet.has(doc.$id)));
}

export async function getUserReels(authorId: string): Promise<DbReel[]> {
  const res = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.REELS,
    [Query.equal('author_id', authorId), Query.orderDesc('created_at'), Query.limit(50)],
  );
  return res.documents.map(doc => docToReel(doc));
}

export async function createReel(
  authUid: string,
  authorName: string,
  authorUsername: string,
  authorAvatarUrl: string | null,
  authorSport: string,
  videoFile: File,
  thumbnailFile: File | null,
  caption?: string,
  sportTag?: string,
): Promise<void> {
  const videoUrl = await uploadMedia(videoFile);
  let thumbUrl: string | null = null;
  if (thumbnailFile) thumbUrl = await uploadMedia(thumbnailFile);

  await databases.createDocument(DATABASE_ID, COLLECTIONS.REELS, ID.unique(), {
    author_id:          authUid,
    author_name:        authorName,
    author_username:    authorUsername,
    author_avatar_url:  authorAvatarUrl,
    author_sport:       authorSport,
    video_url:          videoUrl,
    thumbnail_url:      thumbUrl,
    caption:            caption?.trim() ?? null,
    sport_tag:          sportTag ?? null,
    likes_count:        0,
    comments_count:     0,
    views_count:        0,
    created_at:         new Date().toISOString(),
  });
}

export async function toggleReelLike(
  reelId: string,
  authUid: string,
  currentlyLiked: boolean,
): Promise<void> {
  if (currentlyLiked) {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.REEL_LIKES,
      [Query.equal('reel_id', reelId), Query.equal('user_id', authUid), Query.limit(1)],
    );
    if (res.documents.length > 0) {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.REEL_LIKES, res.documents[0].$id);
    }
    const reel = await databases.getDocument(DATABASE_ID, COLLECTIONS.REELS, reelId);
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.REELS, reelId, {
      likes_count: Math.max(0, (reel.likes_count ?? 1) - 1),
    });
  } else {
    await databases.createDocument(DATABASE_ID, COLLECTIONS.REEL_LIKES, ID.unique(), {
      reel_id:    reelId,
      user_id:    authUid,
      created_at: new Date().toISOString(),
    });
    const reel = await databases.getDocument(DATABASE_ID, COLLECTIONS.REELS, reelId);
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.REELS, reelId, {
      likes_count: (reel.likes_count ?? 0) + 1,
    });
  }
}

export async function recordReelView(reelId: string): Promise<void> {
  try {
    const reel = await databases.getDocument(DATABASE_ID, COLLECTIONS.REELS, reelId);
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.REELS, reelId, {
      views_count: (reel.views_count ?? 0) + 1,
    });
  } catch {
    // Silent — view count is non-critical
  }
}

// ─── FOLLOW SYSTEM ────────────────────────────────────────────────────────────

export async function followUser(followerUid: string, followingUid: string): Promise<void> {
  await databases.createDocument(DATABASE_ID, COLLECTIONS.FOLLOWERS, ID.unique(), {
    follower_id:  followerUid,
    following_id: followingUid,
    created_at:   new Date().toISOString(),
  });
}

export async function unfollowUser(followerUid: string, followingUid: string): Promise<void> {
  const res = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.FOLLOWERS,
    [
      Query.equal('follower_id', followerUid),
      Query.equal('following_id', followingUid),
      Query.limit(1),
    ],
  );
  if (res.documents.length > 0) {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.FOLLOWERS, res.documents[0].$id);
  }
}

export async function checkIsFollowing(
  followerUid: string,
  followingUid: string,
): Promise<boolean> {
  const res = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.FOLLOWERS,
    [
      Query.equal('follower_id', followerUid),
      Query.equal('following_id', followingUid),
      Query.limit(1),
    ],
  );
  return res.total > 0;
}

export async function getFollowCounts(authUid: string): Promise<{ followers: number; following: number }> {
  const [followerRes, followingRes] = await Promise.all([
    databases.listDocuments(DATABASE_ID, COLLECTIONS.FOLLOWERS, [
      Query.equal('following_id', authUid),
      Query.limit(1),
    ]),
    databases.listDocuments(DATABASE_ID, COLLECTIONS.FOLLOWERS, [
      Query.equal('follower_id', authUid),
      Query.limit(1),
    ]),
  ]);
  return { followers: followerRes.total, following: followingRes.total };
}

// ─── PROFILE STATS ────────────────────────────────────────────────────────────

export async function getProfileStats(authUid: string): Promise<ProfileStats> {
  const [postsRes, reelsRes, followData] = await Promise.all([
    databases.listDocuments(DATABASE_ID, COLLECTIONS.POSTS, [
      Query.equal('author_id', authUid),
      Query.limit(1),
    ]),
    databases.listDocuments(DATABASE_ID, COLLECTIONS.REELS, [
      Query.equal('author_id', authUid),
      Query.limit(1),
    ]),
    getFollowCounts(authUid),
  ]);
  return {
    posts:     postsRes.total,
    reels:     reelsRes.total,
    followers: followData.followers,
    following: followData.following,
  };
}

// ─── PENDING MATCH REPORT CHECK ───────────────────────────────────────────────

/**
 * Returns true ONLY if the user has a real unsubmitted match report in the DB.
 * New users with zero match history always return false.
 */
export async function hasPendingMatchReport(authUid: string): Promise<boolean> {
  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      'match_reports',
      [
        Query.equal('user_id', authUid),
        Query.equal('report_submitted', false),
        Query.limit(1),
      ],
    );
    return res.total > 0;
  } catch {
    return false;
  }
}

// ─── USER INITIALISATION (after signup) ──────────────────────────────────────

/**
 * Called once after successful registration.
 * Appwrite doesn't need separate gamification rows — they're part of the profile.
 * This is a no-op kept for API compatibility.
 */
export async function initializeNewUserRecords(_authUid: string): Promise<void> {
  // Profile document created in registerUser() already contains
  // pulse_score: 100, level: 1, coins_balance: 0, login_streak: 0
  // Nothing extra needed.
}
