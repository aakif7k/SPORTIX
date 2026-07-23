"""
Upload service using Appwrite Storage (no AWS S3 dependency).
Files are uploaded to Appwrite Storage bucket and the URL is returned.
"""
from fastapi import UploadFile, HTTPException
from appwrite.services.storage import Storage
from appwrite.input_file import InputFile
from appwrite.id import ID
from app.core.config import settings
import uuid
import os

ALLOWED_IMAGE_TYPES = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
}

ALLOWED_VIDEO_TYPES = {
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/webm': 'webm',
}

ALLOWED_ALL = {**ALLOWED_IMAGE_TYPES, **ALLOWED_VIDEO_TYPES}

MAX_IMAGE_SIZE = 10 * 1024 * 1024   # 10MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100MB


async def upload_to_appwrite(
    file: UploadFile,
    user_id: str,
    allowed_types: dict = None,
    max_size: int = MAX_IMAGE_SIZE,
) -> dict:
    """
    Upload file to Appwrite Storage bucket.
    Returns: { url, file_id, content_type, size }
    """
    from app.core.appwrite import storage_svc

    if allowed_types is None:
        allowed_types = ALLOWED_ALL

    if file.content_type not in allowed_types:
        raise HTTPException(
            400,
            f"File type {file.content_type!r} not allowed. "
            f"Allowed: {list(allowed_types.keys())}"
        )

    content = await file.read()

    if len(content) > max_size:
        size_mb = max_size // (1024 * 1024)
        raise HTTPException(413, f"File too large. Max {size_mb}MB")

    file_id = ID.unique()
    ext = allowed_types[file.content_type]
    filename = f"{user_id}_{uuid.uuid4().hex[:8]}.{ext}"

    input_file = InputFile.from_bytes(
        data=content,
        filename=filename,
        mime_type=file.content_type,
    )

    result = storage_svc.create_file(
        bucket_id=settings.appwrite_storage_bucket_id,
        file_id=file_id,
        file=input_file,
    )

    # Build the public preview URL
    url = (
        f"{settings.appwrite_endpoint}/storage/buckets/"
        f"{settings.appwrite_storage_bucket_id}/files/"
        f"{result['$id']}/view"
        f"?project={settings.appwrite_project_id}"
    )

    return {
        "url": url,
        "file_id": result["$id"],
        "content_type": file.content_type,
        "size": len(content),
        "filename": filename,
    }


async def delete_from_appwrite(file_id: str) -> bool:
    """Delete a file from Appwrite Storage by its file ID."""
    from app.core.appwrite import storage_svc
    try:
        storage_svc.delete_file(
            bucket_id=settings.appwrite_storage_bucket_id,
            file_id=file_id,
        )
        return True
    except Exception:
        return False
