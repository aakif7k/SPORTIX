import { storage, BUCKET_ID } from '../api/appwrite';

const BUCKET_CANDIDATES = [
  BUCKET_ID,
  '6a5faf1a000b5d9156b5',
  'sportix-media',
];

export function getMediaFileUrl(fileId: string | null | undefined): string | null {
  if (!fileId) return null;
  if (fileId.startsWith('http://') || fileId.startsWith('https://')) {
    return fileId;
  }

  for (const bucketId of BUCKET_CANDIDATES) {
    try {
      const url = storage.getFileView(bucketId, fileId).toString();
      if (url) return url;
    } catch {
      continue;
    }
  }

  return `https://sgp.cloud.appwrite.io/v1/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=6a5fab1d0026ad341f32`;
}
