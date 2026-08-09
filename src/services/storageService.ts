/**
 * storageService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Appwrite Storage integration service for the `sportix-media` bucket.
 * Handles profile picture and event banner uploads, file ID storage, and preview URL generation.
 */

import { storage, ID, BUCKET_ID } from '@/lib/appwrite';
import { api } from '@/lib/api';
import { updateProfile } from './profileService';
import { updateEvent } from './eventService';
import toast from 'react-hot-toast';

export const MEDIA_BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID || BUCKET_ID || 'sportix-media';

export interface StorageUploadResult {
  fileId: string;
  fileUrl: string;
}

/**
 * Validate image or video file format and size
 */
export function validateImageFile(file: File, maxSizeMB = 50): boolean {
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    toast.error('Please select a valid image (PNG, JPG, WEBP, GIF) or video file (MP4, MOV, WEBM).');
    return false;
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    toast.error(`File size exceeds ${maxSizeMB}MB limit.`);
    return false;
  }
  return true;
}

/**
 * Upload an image or video file to Appwrite Storage with robust candidate bucket fallbacks and backend upload fallback.
 */
export async function uploadMediaFile(
  file: File,
  bucketId: string = 'sportix-media'
): Promise<StorageUploadResult | null> {
  if (!validateImageFile(file)) return null;

  const candidateBuckets = Array.from(new Set([
    'sportix-media',
    'sportix-images',
    'sportix-videos',
    '6a5faf6c00197d36a3a9',
    bucketId,
    import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID,
    BUCKET_ID,
  ].filter(Boolean))) as string[];

  let lastErr: any = null;

  for (const bId of candidateBuckets) {
    try {
      // 1. Upload to Appwrite Storage
      const fileDoc = await storage.createFile(bId, ID.unique(), file);
      
      // 2. Generate view/preview URL
      const fileUrl = storage.getFileView(bId, fileDoc.$id).toString();

      return { fileId: fileDoc.$id, fileUrl };
    } catch (err: any) {
      lastErr = err;
      console.warn(`[storageService] Upload attempt to bucket '${bId}' failed:`, err?.message || err);
      continue;
    }
  }

  // 3. Fallback to FastAPI backend server upload endpoint if client SDK upload fails
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.upload<any>('/api/upload/post-media', formData);
    if (res.data?.url) {
      return { fileId: res.data.file_id || ID.unique(), fileUrl: res.data.url };
    }
  } catch (backendErr) {
    console.warn('[storageService] Backend server upload fallback error:', backendErr);
  }

  console.error('[storageService] uploadMediaFile failed across all buckets:', lastErr?.message ?? lastErr);
  toast.error(lastErr?.message || 'Failed to upload media to Appwrite storage.');
  return null;
}

/**
 * Get Appwrite Storage preview/view URL for a file ID
 */
export function getMediaFileUrl(
  fileId?: string | null,
  fallbackUrl?: string | null,
  bucketId: string = 'sportix-media'
): string {
  if (fileId) {
    const candidateBuckets = Array.from(new Set([
      bucketId,
      'sportix-media',
      'sportix-images',
      'sportix-videos',
      '6a5faf6c00197d36a3a9',
      MEDIA_BUCKET_ID,
    ].filter(Boolean))) as string[];

    for (const bId of candidateBuckets) {
      try {
        const url = storage.getFileView(bId, fileId).toString();
        if (url) return url;
      } catch {
        continue;
      }
    }
  }
  return fallbackUrl || '';
}

/**
 * Upload profile avatar image to Appwrite Storage bucket and update user's document in `profiles` collection.
 * Stores `profile_image_file_id` and `profile_image_url`.
 */
export async function uploadProfilePicture(
  userId: string,
  file: File
): Promise<{ fileId: string; fileUrl: string } | null> {
  const upload = await uploadMediaFile(file);
  if (!upload) return null;

  try {
    const updated = await updateProfile(userId, {
      profile_image_file_id: upload.fileId,
      profile_image_url: upload.fileUrl,
      avatar_url: upload.fileUrl,
    } as any);

    if (updated) {
      toast.success('Profile picture updated successfully!');
      return upload;
    } else {
      toast.error('Uploaded image to storage, but profile update failed.');
      return upload;
    }
  } catch (err: any) {
    console.error('[storageService] uploadProfilePicture error:', err);
    toast.error('Failed to update profile document with image info.');
    return upload;
  }
}

/**
 * Upload event banner image to Appwrite Storage bucket.
 * Stores `banner_image_file_id` and `banner_image_url` on `events` collection.
 */
export async function uploadEventBannerImage(
  file: File,
  eventId?: string
): Promise<{ fileId: string; fileUrl: string } | null> {
  const upload = await uploadMediaFile(file);
  if (!upload) return null;

  if (eventId) {
    try {
      await updateEvent(eventId, {
        banner_image_file_id: upload.fileId,
        banner_image_url: upload.fileUrl,
        bannerImage: upload.fileUrl,
      } as any);
    } catch (err) {
      console.error('[storageService] uploadEventBannerImage database update error:', err);
    }
  }

  return upload;
}
