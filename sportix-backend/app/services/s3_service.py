import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile, HTTPException
from app.core.config import settings
import uuid
import os

def get_s3_client():
    return boto3.client(
        's3',
        region_name=settings.aws_region,
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
    )

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
MAX_VIDEO_SIZE = 200 * 1024 * 1024  # 200MB

async def upload_to_s3(
    file: UploadFile,
    folder: str,
    user_id: str,
    allowed_types: dict = None,
    max_size: int = MAX_IMAGE_SIZE,
) -> dict:
    """
    Upload file to AWS S3 bucket: sportix-socialmedia
    Returns: { url, key, content_type, size }
    """
    if allowed_types is None:
        allowed_types = ALLOWED_ALL

    # Validate file type
    if file.content_type not in allowed_types:
        raise HTTPException(
            400,
            f"File type {file.content_type} not allowed. "
            f"Allowed: {list(allowed_types.keys())}"
        )

    # Read content
    content = await file.read()

    # Validate size
    if len(content) > max_size:
        size_mb = max_size // (1024 * 1024)
        raise HTTPException(
            413, f"File too large. Max {size_mb}MB"
        )

    # Generate unique S3 key
    ext = allowed_types[file.content_type]
    file_id = str(uuid.uuid4()).replace('-', '')
    s3_key = f"{folder}/{user_id}/{file_id}.{ext}"

    # Upload to S3
    s3 = get_s3_client()
    try:
        s3.put_object(
            Bucket=settings.aws_s3_bucket,
            Key=s3_key,
            Body=content,
            ContentType=file.content_type,
            # Make publicly readable
            ACL='public-read',
        )
    except ClientError as e:
        raise HTTPException(
            500,
            f"S3 upload failed: {e.response['Error']['Message']}"
        )

    # Build public URL
    url = (
        f"https://{settings.aws_s3_bucket}"
        f".s3.{settings.aws_region}"
        f".amazonaws.com/{s3_key}"
    )

    return {
        "url": url,
        "key": s3_key,
        "content_type": file.content_type,
        "size": len(content),
        "filename": file.filename,
    }

async def delete_from_s3(s3_key: str) -> bool:
    """Delete a file from S3 by its key."""
    s3 = get_s3_client()
    try:
        s3.delete_object(
            Bucket=settings.aws_s3_bucket,
            Key=s3_key,
        )
        return True
    except ClientError:
        return False

def generate_presigned_url(
    s3_key: str,
    expiration: int = 3600
) -> str:
    """
    Generate a presigned URL for private files.
    Use for temporary access to non-public content.
    """
    s3 = get_s3_client()
    try:
        url = s3.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': settings.aws_s3_bucket,
                'Key': s3_key,
            },
            ExpiresIn=expiration,
        )
        return url
    except ClientError:
        return ""