from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.core.dependencies import get_current_user
from app.schemas.post import PostCreate, PostUpdate, CommentCreate
from app.services import post_service

router = APIRouter()


@router.get("/feed")
async def get_feed(
    page: int = Query(0),
    limit: int = Query(20, le=50),
    post_type: Optional[str] = Query(None),
    sport: Optional[str] = Query(None),
    user=Depends(get_current_user),
):
    """Home feed — posts from people the user follows, ordered by recency."""
    data = await post_service.get_feed(user["id"], page, limit, post_type, sport)
    return {"success": True, "data": data}


@router.get("/explore")
async def explore_feed(
    page: int = Query(0),
    sport: Optional[str] = Query(None),
    user=Depends(get_current_user),
):
    """Explore feed — public posts from all users."""
    data = await post_service.get_explore(user["id"], page, sport)
    return {"success": True, "data": data}


@router.post("/", status_code=201)
async def create_post(payload: PostCreate, user=Depends(get_current_user)):
    data = await post_service.create(user["id"], payload)
    return {"success": True, "data": data}


@router.get("/user/{user_id}")
async def get_user_posts(user_id: str, page: int = Query(0), user=Depends(get_current_user)):
    data = await post_service.get_by_user(user_id, page)
    return {"success": True, "data": data}


@router.get("/{post_id}")
async def get_post(post_id: str, user=Depends(get_current_user)):
    data = await post_service.get_by_id(post_id, user["id"])
    return {"success": True, "data": data}


@router.put("/{post_id}")
async def update_post(post_id: str, payload: PostUpdate, user=Depends(get_current_user)):
    data = await post_service.update(post_id, user["id"], payload)
    return {"success": True, "data": data}


@router.delete("/{post_id}")
async def delete_post(post_id: str, user=Depends(get_current_user)):
    await post_service.delete(post_id, user["id"])
    return {"success": True, "message": "Post deleted"}


@router.post("/{post_id}/like")
async def toggle_like(post_id: str, user=Depends(get_current_user)):
    data = await post_service.toggle_like(post_id, user["id"])
    return {"success": True, "data": data}


@router.get("/{post_id}/comments")
async def get_comments(post_id: str, page: int = Query(0), user=Depends(get_current_user)):
    data = await post_service.get_comments(post_id, page)
    return {"success": True, "data": data}


@router.post("/{post_id}/comments", status_code=201)
async def add_comment(post_id: str, payload: CommentCreate, user=Depends(get_current_user)):
    data = await post_service.add_comment(post_id, user["id"], payload.content)
    return {"success": True, "data": data}


@router.delete("/{post_id}/comments/{comment_id}")
async def delete_comment(post_id: str, comment_id: str, user=Depends(get_current_user)):
    await post_service.delete_comment(comment_id, user["id"])
    return {"success": True, "message": "Comment deleted"}
