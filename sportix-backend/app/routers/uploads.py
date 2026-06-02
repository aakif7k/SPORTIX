from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
import os
import uuid
import shutil
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    category: str = "posts",  # avatars | posts | events
    current_user: User = Depends(get_current_user)
):
    if category not in ["avatars", "posts", "events"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid upload category")
        
    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".gif", ".mp4", ".mov", ".avi"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File type not supported. Allowed formats: images, videos."
        )
        
    # Ensure directories exist
    target_dir = os.path.join(settings.UPLOAD_DIR, category)
    os.makedirs(target_dir, exist_ok=True)
    
    # Save file with unique filename
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(target_dir, unique_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save file: {str(e)}"
        )
        
    # Return path relative to base uploads directory
    url_path = f"/uploads/{category}/{unique_filename}"
    return {
        "success": True,
        "filename": file.filename,
        "url": url_path,
        "size_bytes": os.path.getsize(file_path)
    }
