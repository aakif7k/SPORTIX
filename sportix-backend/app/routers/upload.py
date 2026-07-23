from fastapi import APIRouter, Depends, UploadFile, File
from app.core.dependencies import get_current_user
from app.services.upload_service import (
    upload_to_appwrite,
    delete_from_appwrite,
    ALLOWED_IMAGE_TYPES,
    ALLOWED_VIDEO_TYPES,
    ALLOWED_ALL,
    MAX_IMAGE_SIZE,
    MAX_VIDEO_SIZE,
)

router = APIRouter()


@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user=Depends(get_current_user)
):
    """Upload profile photo to Appwrite Storage."""
    result = await upload_to_appwrite(
        file=file,
        user_id=user["id"],
        allowed_types=ALLOWED_IMAGE_TYPES,
        max_size=MAX_IMAGE_SIZE,
    )

    # Update user avatar_url in Appwrite DB
    from app.core.appwrite import db
    from app.core.config import settings
    from appwrite.query import Query

    try:
        users = db.list_documents(
            settings.appwrite_database_id,
            settings.collection_users,
            queries=[Query.equal("auth_uid", [user["id"]])]
        )
        if users["documents"]:
            doc_id = users["documents"][0]["$id"]
            db.update_document(
                settings.appwrite_database_id,
                settings.collection_users,
                doc_id,
                {"avatar_url": result["url"]}
            )
    except Exception as e:
        print(f"Failed to update avatar in DB: {e}")

    return {
        "success": True,
        "data": {
            "url": result["url"],
            "file_id": result["file_id"],
        }
    }


@router.post("/post-media")
async def upload_post_media(
    file: UploadFile = File(...),
    user=Depends(get_current_user)
):
    """Upload post image or video to Appwrite Storage."""
    is_video = file.content_type in ALLOWED_VIDEO_TYPES
    result = await upload_to_appwrite(
        file=file,
        user_id=user["id"],
        allowed_types=ALLOWED_ALL,
        max_size=MAX_VIDEO_SIZE if is_video else MAX_IMAGE_SIZE,
    )
    return {
        "success": True,
        "data": {
            "url": result["url"],
            "file_id": result["file_id"],
            "media_type": "video" if is_video else "image",
        }
    }


@router.post("/story-media")
async def upload_story_media(
    file: UploadFile = File(...),
    user=Depends(get_current_user)
):
    """Upload story image/video to Appwrite Storage."""
    result = await upload_to_appwrite(
        file=file,
        user_id=user["id"],
        allowed_types=ALLOWED_ALL,
        max_size=MAX_VIDEO_SIZE,
    )
    return {
        "success": True,
        "data": {
            "url": result["url"],
            "file_id": result["file_id"],
        }
    }


@router.post("/reel-video")
async def upload_reel_video(
    file: UploadFile = File(...),
    user=Depends(get_current_user)
):
    """Upload reel video to Appwrite Storage."""
    result = await upload_to_appwrite(
        file=file,
        user_id=user["id"],
        allowed_types=ALLOWED_VIDEO_TYPES,
        max_size=MAX_VIDEO_SIZE,
    )
    return {
        "success": True,
        "data": {
            "url": result["url"],
            "file_id": result["file_id"],
        }
    }


@router.post("/reel-thumbnail")
async def upload_reel_thumbnail(
    file: UploadFile = File(...),
    user=Depends(get_current_user)
):
    """Upload reel thumbnail image to Appwrite Storage."""
    result = await upload_to_appwrite(
        file=file,
        user_id=user["id"],
        allowed_types=ALLOWED_IMAGE_TYPES,
        max_size=MAX_IMAGE_SIZE,
    )
    return {
        "success": True,
        "data": {"url": result["url"]}
    }


@router.post("/stat-proof")
async def upload_stat_proof(
    file: UploadFile = File(...),
    user=Depends(get_current_user)
):
    """Upload match stat proof to Appwrite Storage."""
    result = await upload_to_appwrite(
        file=file,
        user_id=user["id"],
        allowed_types=ALLOWED_ALL,
        max_size=MAX_IMAGE_SIZE,
    )
    return {
        "success": True,
        "data": {"url": result["url"]}
    }


@router.delete("/delete")
async def delete_file(
    file_id: str,
    user=Depends(get_current_user)
):
    """Delete a file from Appwrite Storage by its file ID."""
    success = await delete_from_appwrite(file_id)
    return {"success": success}