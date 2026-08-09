/**
 * hypezoneService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Full production service for HypeZone backed by Appwrite Database & Storage.
 * Handles Posts, Likes, Comments, Followers, Notifications, and Media Storage.
 */

import { client, databases, storage, Query, ID, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { uploadMediaFile } from './storageService';

export interface HypezonePost {
  $id: string;
  author_id: string;
  author_username: string;
  author_full_name: string;
  author_avatar_url: string | null;
  author_sport: string;
  author_level: number;
  content: string;
  media_urls: string[];
  media_file_ids?: string[];
  media_type: 'none' | 'image' | 'video' | 'multi_image';
  post_type: 'general' | 'training' | 'highlights' | 'achievements' | 'events';
  sport_tag: string | null;
  location_tag: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_liked?: boolean;
  is_bookmarked?: boolean;
  is_deleted: boolean;
  created_at: string;
  $createdAt: string;
}

export interface PostComment {
  $id: string;
  post_id: string;
  author_id: string;
  author_username: string;
  author_name: string;
  author_avatar_url: string | null;
  content: string;
  is_deleted: boolean;
  created_at: string;
  $createdAt: string;
}

/**
 * Fetch feed posts from Appwrite
 */
export async function fetchHypezonePosts(options: {
  currentUserId?: string;
  page?: number;
  limit?: number;
  feedType?: 'explore' | 'following';
  category?: string;
  sportTag?: string;
  authorId?: string;
}): Promise<{ posts: HypezonePost[]; hasMore: boolean; total: number }> {
  const {
    currentUserId,
    page = 0,
    limit = 20,
    feedType = 'explore',
    category,
    sportTag,
    authorId,
  } = options;

  try {
    const queries: string[] = [
      Query.equal('is_deleted', [false]),
      Query.orderDesc('$createdAt'),
      Query.limit(limit),
      Query.offset(page * limit),
    ];

    // Filter by author ID if requesting profile posts
    if (authorId) {
      queries.push(Query.equal('author_id', [authorId]));
    }

    // Filter by Category
    if (category && category !== 'All') {
      const lowerCat = category.toLowerCase();
      if (['training', 'highlights', 'achievements', 'events', 'general'].includes(lowerCat)) {
        queries.push(Query.equal('post_type', [lowerCat]));
      }
    }

    // Filter by Sport
    if (sportTag && sportTag !== 'All Sports') {
      queries.push(Query.equal('sport_tag', [sportTag]));
    }

    // Filter by Following if requested
    if (feedType === 'following' && currentUserId) {
      try {
        const follows = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.FOLLOWERS,
          [Query.equal('follower_id', [currentUserId]), Query.limit(100)]
        );
        const followingIds = follows.documents.map((doc: any) => doc.following_id);
        if (followingIds.length > 0) {
          queries.push(Query.equal('author_id', followingIds));
        } else {
          // User follows nobody yet
          return { posts: [], hasMore: false, total: 0 };
        }
      } catch (err) {
        console.warn('[hypezoneService] Failed to query followers list:', err);
      }
    }

    // Execute query on Appwrite
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.POSTS,
      queries
    );

    let rawPosts = response.documents;

    // Fetch user liked post IDs if logged in
    let likedPostIds = new Set<string>();
    if (currentUserId && rawPosts.length > 0) {
      try {
        const postIds = rawPosts.map(p => p.$id);
        const likesRes = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.POST_LIKES,
          [
            Query.equal('user_id', [currentUserId]),
            Query.equal('post_id', postIds.slice(0, 25)), // Appwrite query limit
          ]
        );
        likesRes.documents.forEach((l: any) => likedPostIds.add(l.post_id));
      } catch (err) {
        console.warn('[hypezoneService] Liked posts lookup warn:', err);
      }
    }

    // Parse and map posts to clean HypezonePost type
    const parsedPosts: HypezonePost[] = rawPosts.map((doc: any) => {
      let mediaUrls: string[] = [];
      if (doc.media_urls) {
        if (Array.isArray(doc.media_urls)) {
          mediaUrls = doc.media_urls;
        } else if (typeof doc.media_urls === 'string') {
          try {
            const jsonParsed = JSON.parse(doc.media_urls);
            mediaUrls = Array.isArray(jsonParsed) ? jsonParsed : [doc.media_urls];
          } catch {
            mediaUrls = doc.media_urls.includes(',') 
              ? doc.media_urls.split(',').map((s: string) => s.trim())
              : [doc.media_urls];
          }
        }
      }

      return {
        $id: doc.$id,
        author_id: doc.author_id,
        author_username: doc.author_username || 'athlete',
        author_full_name: doc.author_full_name || 'SportiX Athlete',
        author_avatar_url: doc.author_avatar_url || null,
        author_sport: doc.author_sport || 'Multi-Sport',
        author_level: doc.author_level || 1,
        content: doc.content || '',
        media_urls: mediaUrls,
        media_file_ids: doc.media_file_ids ? (Array.isArray(doc.media_file_ids) ? doc.media_file_ids : [doc.media_file_ids]) : [],
        media_type: doc.media_type || (mediaUrls.length > 0 ? 'image' : 'none'),
        post_type: doc.post_type || 'general',
        sport_tag: doc.sport_tag || null,
        location_tag: doc.location_tag || null,
        likes_count: doc.likes_count || 0,
        comments_count: doc.comments_count || 0,
        shares_count: doc.shares_count || 0,
        is_liked: likedPostIds.has(doc.$id),
        is_deleted: doc.is_deleted || false,
        created_at: doc.created_at || doc.$createdAt,
        $createdAt: doc.$createdAt,
      };
    });

    return {
      posts: parsedPosts,
      total: response.total,
      hasMore: (page + 1) * limit < response.total,
    };
  } catch (err: any) {
    console.error('[hypezoneService] fetchHypezonePosts error:', err);
    throw err;
  }
}

/**
 * Create a new HypeZone post with storage file uploads
 */
export async function createHypezonePost(params: {
  authorId: string;
  authorUsername: string;
  authorFullName: string;
  authorAvatarUrl?: string | null;
  authorSport?: string;
  authorLevel?: number;
  content: string;
  files?: File[];
  postType?: 'general' | 'training' | 'highlights' | 'achievements' | 'events';
  sportTag?: string | null;
  locationTag?: string | null;
}): Promise<HypezonePost> {
  const {
    authorId,
    authorUsername,
    authorFullName,
    authorAvatarUrl = null,
    authorSport = 'Multi-Sport',
    authorLevel = 1,
    content,
    files = [],
    postType = 'general',
    sportTag = null,
    locationTag = null,
  } = params;

  if (!content.trim() && files.length === 0) {
    throw new Error('Post content or media attachment is required.');
  }

  // Upload media files to Appwrite Storage
  const mediaUrls: string[] = [];
  const mediaFileIds: string[] = [];
  let mediaType: 'none' | 'image' | 'video' | 'multi_image' = 'none';

  if (files.length > 0) {
    for (const file of files) {
    const uploadRes = await uploadMediaFile(file);
      if (uploadRes) {
        mediaUrls.push(uploadRes.fileUrl);
        mediaFileIds.push(uploadRes.fileId);
      } else {
        // Clean up any uploaded media files if one fails
        for (const fid of mediaFileIds) {
          try {
            await storage.deleteFile('sportix-media', fid);
          } catch {}
        }
        throw new Error("Couldn't publish your post due to media upload failure. Please try again.");
      }
    }

    if (files.length > 1) {
      mediaType = 'multi_image';
    } else if (files[0].type.startsWith('video/')) {
      mediaType = 'video';
    } else {
      mediaType = 'image';
    }
  }

  const sanitizedMediaUrls: string[] = Array.isArray(mediaUrls) ? mediaUrls : [];
  const sanitizedMediaFileIds: string[] = Array.isArray(mediaFileIds) ? mediaFileIds : [];

  const newDocData = {
    author_id: authorId,
    author_username: authorUsername || 'athlete',
    author_full_name: authorFullName || 'SportiX Athlete',
    author_avatar_url: authorAvatarUrl || null,
    author_sport: authorSport || 'Multi-Sport',
    author_level: typeof authorLevel === 'number' ? authorLevel : 1,
    content: content.trim(),
    media_urls: sanitizedMediaUrls,
    media_file_ids: sanitizedMediaFileIds,
    media_type: mediaType,
    post_type: postType || 'general',
    sport_tag: sportTag || null,
    location_tag: locationTag || null,
    likes_count: 0,
    comments_count: 0,
    shares_count: 0,
    is_deleted: false,
    created_at: new Date().toISOString(),
  };

  try {
    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.POSTS,
      ID.unique(),
      newDocData
    );

    return {
      $id: doc.$id,
      author_id: authorId,
      author_username: authorUsername,
      author_full_name: authorFullName,
      author_avatar_url: authorAvatarUrl,
      author_sport: authorSport,
      author_level: authorLevel,
      content: content.trim(),
      media_urls: sanitizedMediaUrls,
      media_file_ids: sanitizedMediaFileIds,
      media_type: mediaType,
      post_type: postType,
      sport_tag: sportTag,
      location_tag: locationTag,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      is_liked: false,
      is_deleted: false,
      created_at: doc.created_at || doc.$createdAt,
      $createdAt: doc.$createdAt,
    };
  } catch (err: any) {
    // Clean up orphaned uploaded media files if database creation fails
    for (const fid of sanitizedMediaFileIds) {
      try {
        await storage.deleteFile('sportix-media', fid);
      } catch {}
    }
    console.error('[hypezoneService] createDocument failed:', err);
    throw new Error(err?.message || "Couldn't publish your post. Please try again.");
  }
}

/**
 * Toggle Like on a HypeZone Post
 */
export async function togglePostLike(
  postId: string,
  userId: string,
  userProfile?: { name?: string; username?: string; avatar?: string }
): Promise<{ liked: boolean; likesCount: number }> {
  try {
    // Check if user already liked this post
    const existing = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.POST_LIKES,
      [Query.equal('post_id', [postId]), Query.equal('user_id', [userId])]
    );

    const postDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.POSTS, postId);
    const currentLikes = postDoc.likes_count || 0;

    if (existing.documents.length > 0) {
      // Unlike
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.POST_LIKES, existing.documents[0].$id);
      const newCount = Math.max(0, currentLikes - 1);
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.POSTS, postId, { likes_count: newCount });
      return { liked: false, likesCount: newCount };
    } else {
      // Like
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.POST_LIKES,
        ID.unique(),
        {
          post_id: postId,
          user_id: userId,
          created_at: new Date().toISOString(),
        }
      );
      const newCount = currentLikes + 1;
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.POSTS, postId, { likes_count: newCount });

      // Create Notification for post author
      if (postDoc.author_id && postDoc.author_id !== userId) {
        try {
          await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.NOTIFICATIONS,
            ID.unique(),
            {
              user_id: postDoc.author_id,
              type: 'post_like',
              title: 'New Like on your HypeZone post',
              body: `${userProfile?.name || 'An athlete'} liked your post.`,
              actor_id: userId,
              actor_name: userProfile?.name || 'Athlete',
              actor_avatar_url: userProfile?.avatar || null,
              entity_id: postId,
              entity_type: 'post',
              is_read: false,
              created_at: new Date().toISOString(),
            }
          );
        } catch (nErr) {
          console.warn('[hypezoneService] Failed to send like notification:', nErr);
        }
      }

      return { liked: true, likesCount: newCount };
    }
  } catch (err: any) {
    console.error('[hypezoneService] togglePostLike error:', err);
    throw err;
  }
}

/**
 * Fetch comments for a post
 */
export async function fetchPostComments(postId: string): Promise<PostComment[]> {
  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.COMMENTS,
      [
        Query.equal('post_id', [postId]),
        Query.equal('is_deleted', [false]),
        Query.orderAsc('$createdAt'),
        Query.limit(50),
      ]
    );

    return res.documents.map((doc: any) => ({
      $id: doc.$id,
      post_id: doc.post_id,
      author_id: doc.author_id,
      author_username: doc.author_username || 'athlete',
      author_name: doc.author_name || doc.author_username || 'Athlete',
      author_avatar_url: doc.author_avatar_url || null,
      content: doc.content,
      is_deleted: doc.is_deleted || false,
      created_at: doc.created_at || doc.$createdAt,
      $createdAt: doc.$createdAt,
    }));
  } catch (err: any) {
    console.error('[hypezoneService] fetchPostComments error:', err);
    return [];
  }
}

/**
 * Add a comment to a post
 */
export async function addPostComment(params: {
  postId: string;
  authorId: string;
  authorUsername: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  content: string;
}): Promise<PostComment> {
  const { postId, authorId, authorUsername, authorName, authorAvatarUrl = null, content } = params;

  if (!content.trim()) throw new Error('Comment cannot be empty.');

  const commentDoc = await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.COMMENTS,
    ID.unique(),
    {
      post_id: postId,
      author_id: authorId,
      author_username: authorUsername,
      author_name: authorName,
      author_avatar_url: authorAvatarUrl,
      content: content.trim(),
      is_deleted: false,
      created_at: new Date().toISOString(),
    }
  );

  // Increment comments_count on post
  try {
    const postDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.POSTS, postId);
    const newCount = (postDoc.comments_count || 0) + 1;
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.POSTS, postId, { comments_count: newCount });

    // Send Notification to post author
    if (postDoc.author_id && postDoc.author_id !== authorId) {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.NOTIFICATIONS,
        ID.unique(),
        {
          user_id: postDoc.author_id,
          type: 'post_comment',
          title: 'New Comment on your HypeZone post',
          body: `${authorName} commented: "${content.slice(0, 30)}..."`,
          actor_id: authorId,
          actor_name: authorName,
          actor_avatar_url: authorAvatarUrl,
          entity_id: postId,
          entity_type: 'post',
          is_read: false,
          created_at: new Date().toISOString(),
        }
      );
    }
  } catch (err) {
    console.warn('[hypezoneService] Comment count/notification update warning:', err);
  }

  return {
    $id: commentDoc.$id,
    post_id: postId,
    author_id: authorId,
    author_username: authorUsername,
    author_name: authorName,
    author_avatar_url: authorAvatarUrl,
    content: content.trim(),
    is_deleted: false,
    created_at: commentDoc.created_at || commentDoc.$createdAt,
    $createdAt: commentDoc.$createdAt,
  };
}

/**
 * Delete a post (author only)
 */
export async function deleteHypezonePost(postId: string, currentUserId: string): Promise<void> {
  const postDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.POSTS, postId);
  if (postDoc.author_id !== currentUserId) {
    throw new Error('Unauthorized: You can only delete your own posts.');
  }

  await databases.updateDocument(DATABASE_ID, COLLECTIONS.POSTS, postId, {
    is_deleted: true,
  });
}

/**
 * Appwrite Realtime Feed Subscription
 */
export function subscribeToHypezoneFeed(onFeedChange: (event: any) => void): () => void {
  const channel = `databases.${DATABASE_ID}.collections.${COLLECTIONS.POSTS}.documents`;
  return client.subscribe(channel, response => {
    onFeedChange(response);
  });
}
