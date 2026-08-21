/**
 * src/services/storageService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Multi-bucket upload with fallback chain (mirrors the web app storageService).
 * Bucket order: sportix-media → 6a5faf1a000b5d9156b5 → sportix-images → sportix-videos → sportix-proofs
 */
import { storage, ID, BUCKET_FALLBACK_CHAIN } from '../api/appwrite';

export interface UploadResult {
  fileId:   string;
  bucketId: string;
  url:      string;
}

export const storageService = {
  /**
   * Upload a file with automatic fallback through all buckets.
   * @param fileUri   Local file URI (from expo-image-picker)
   * @param mimeType  MIME type e.g. 'image/jpeg'
   * @param fileName  Optional filename
   */
  async upload(fileUri: string, mimeType: string, fileName?: string): Promise<UploadResult> {
    const name = fileName ?? `sportix_${Date.now()}`;
    const fileId = ID.unique();

    for (const bucketId of BUCKET_FALLBACK_CHAIN) {
      try {
        const file = {
          uri:  fileUri,
          name: name,
          type: mimeType,
          size: 0, // Appwrite RN SDK infers size
        };

        await storage.createFile(bucketId, fileId, file as any);

        const url = storage.getFileView(bucketId, fileId).toString();
        return { fileId, bucketId, url };
      } catch (err: any) {
        // Try next bucket unless it's a permission error
        if (err?.code === 401 || err?.code === 403) throw err;
        console.warn(`[storageService] Upload failed on bucket ${bucketId}:`, err?.message);
      }
    }

    throw new Error('Upload failed on all available storage buckets.');
  },

  /**
   * Get the public view URL for a file.
   * Tries each bucket until the file is found.
   */
  getFileUrl(fileId: string, bucketId?: string): string {
    const bucket = bucketId ?? BUCKET_FALLBACK_CHAIN[0];
    return storage.getFileView(bucket, fileId).toString();
  },

  /**
   * Get a thumbnail preview URL.
   */
  getFilePreview(
    fileId:   string,
    bucketId: string,
    width?:   number,
    height?:  number,
  ): string {
    return storage.getFilePreview(bucketId, fileId, width, height).toString();
  },

  /** Delete a file. */
  async deleteFile(fileId: string, bucketId: string): Promise<void> {
    await storage.deleteFile(bucketId, fileId);
  },
};
