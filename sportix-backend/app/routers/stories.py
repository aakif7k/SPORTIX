from fastapi import APIRouter, Depends, Query, Request
from app.core.rate_limit import limiter, WRITE_LIMIT
from typing import Optional
from app.core.dependencies import get_current_user
from app.schemas.post import StoryCreate
from app.services import story_service

router = APIRouter()


@router.get("/")
async def get_active_stories(user=Depends(get_current_user)):
    """Returns active stories (<24h) from followed users + self."""
    data = await story_service.get_active(user["id"])
    return {"success": True, "data": data}


@router.post("/", status_code=201)
@limiter.limit(WRITE_LIMIT)
async def create_story(request: Request, payload: StoryCreate, user=Depends(get_current_user)):
    data = await story_service.create(user["id"], payload)
    return {"success": True, "data": data}


@router.post("/{story_id}/view")
async def view_story(story_id: str, user=Depends(get_current_user)):
    await story_service.mark_viewed(story_id, user["id"])
    return {"success": True}


@router.delete("/{story_id}")
async def delete_story(story_id: str, user=Depends(get_current_user)):
    await story_service.delete(story_id, user["id"])
    return {"success": True, "message": "Story deleted"}


@router.get("/{story_id}/viewers")
async def get_story_viewers(story_id: str, user=Depends(get_current_user)):
    data = await story_service.get_viewers(story_id, user["id"])
    return {"success": True, "data": data}
