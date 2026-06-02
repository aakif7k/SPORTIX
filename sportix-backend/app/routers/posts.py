from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from typing import List

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.post import PostCreate, PostResponse, CommentCreate, CommentResponse
from app.services.post_service import create_new_post, like_post, add_comment, list_feed_posts

router = APIRouter(prefix="/api/posts", tags=["posts"])

@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    post_in: PostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await create_new_post(db, current_user.id, post_in)

@router.get("", response_model=List[PostResponse])
async def get_feed(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await list_feed_posts(db, current_user.id, skip, limit)

@router.post("/{post_id}/like")
async def toggle_like(
    post_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await like_post(db, current_user.id, post_id)

@router.post("/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def comment(
    post_id: uuid.UUID,
    comment_in: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await add_comment(db, current_user.id, post_id, comment_in)
