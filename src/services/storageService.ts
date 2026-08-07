/**
 * storageService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Appwrite Storage integration service for the `sportix-media` bucket.
 * Handles profile picture and event banner uploads, file ID storage, and preview URL generation.
 */

import { storage, ID, BUCKET_ID } from '@/lib/appwrite';
import { updateProfile } from './profileService';
import { updateEvent } from './eventService';
import toast from 'react-hot-toast';

export const MEDIA_BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID || BUCKET_ID || '6a5faf1a000b5d9156b5';

export interface StorageUploadResult {
  fileId: string;
  fileUrl: string;
}

/**
 * Validate image file format and size
 */
export function validateImageFile(file: File, maxSizeMB = 10): boolean {
  if (!file.type.startsWith('image/')) {
    toast.error('Please select a valid image file (PNG, JPG, WEBP, GIF).');
    return false;
  }
  if (file.size > maxSizeMB * 1024 * 1024) {
    toast.error(`Image size exceeds ${maxSizeMB}MB limit.`);
    return false;
  }
  return true;
}

/**
 * Upload an image file to Appwrite Storage.
 * Attempts upload using configured bucket ID, then candidate bucket ID fallbacks.
 * Returns { fileId, fileUrl } or null on failure.
 */
export async function uploadMediaFile(
  file: File,
  bucketId: string = MEDIA_BUCKET_ID
): Promise<StorageUploadResult | null> {
  if (!validateImageFile(file)) return null;

  const candidateBuckets = Array.from(new Set([
    bucketId,
    import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID,
    BUCKET_ID,
    '6a5faf1a000b5d9156b5',
    'sportix-media',
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
      // If 404 / bucket not found, try next candidate bucket ID
      if (err?.code === 404 || err?.message?.includes('could not be found') || err?.type === 'storage_bucket_not_found') {
        console.warn(`[storageService] Bucket '${bId}' not found, trying next candidate...`);
        continue;
      }
      break;
    }
  }

  console.error('[storageService] uploadMediaFile error:', lastErr?.message ?? lastErr);
  toast.error(lastErr?.message || 'Failed to upload image to Appwrite storage.');
  return null;
}

/**
 * Get Appwrite Storage preview/view URL for a file ID
 */
export function getMediaFileUrl(
  fileId?: string | null,
  fallbackUrl?: string | null,
  bucketId: string = MEDIA_BUCKET_ID
): string {
  if (fileId) {
    try {
      return storage.getFileView(bucketId, fileId).toString();
    } catch (err) {
      console.error('[storageService] getMediaFileUrl error:', err);
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
