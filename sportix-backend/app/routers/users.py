from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.core.dependencies import get_current_user
from app.schemas.user import UserUpdate
from app.services import user_service

router = APIRouter()


@router.get("/me")
async def get_my_profile(user=Depends(get_current_user)):
    data = await user_service.get_full_profile(user["id"])
    return {"success": True, "data": data}


@router.put("/me")
async def update_my_profile(payload: UserUpdate, user=Depends(get_current_user)):
    data = await user_service.update_profile(user["id"], payload)
    return {"success": True, "data": data}


@router.get("/me/stats")
async def get_my_stats(user=Depends(get_current_user)):
    data = await user_service.get_profile_stats(user["id"])
    return {"success": True, "data": data}


@router.get("/me/full")
async def get_complete_profile(user=Depends(get_current_user)):
    """Returns profile + pulse + level + coins + badges in one call."""
    data = await user_service.get_complete_profile(user["id"])
    return {"success": True, "data": data}


@router.get("/search")
async def search_users(
    q: Optional[str] = Query(None),
    sport: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    experience_level: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    is_open_to_recruit: Optional[bool] = Query(None),
    page: int = Query(0),
    limit: int = Query(20, le=50),
    user=Depends(get_current_user),
):
    data = await user_service.search_users(
        q=q, sport=sport, role=role,
        experience_level=experience_level,
        city=city, is_open_to_recruit=is_open_to_recruit,
        page=page, limit=limit,
    )
    return {"success": True, "data": data}


@router.get("/suggested")
async def suggested_users(
    limit: int = Query(10, le=30),
    user=Depends(get_current_user),
):
    data = await user_service.get_suggested(user["id"], limit)
    return {"success": True, "data": data}


@router.get("/{username}")
async def get_user_by_username(username: str, user=Depends(get_current_user)):
    data = await user_service.get_by_username(username, viewer_id=user["id"])
    return {"success": True, "data": data}


@router.post("/{user_id}/follow")
async def follow_user(user_id: str, user=Depends(get_current_user)):
    await user_service.follow(user["id"], user_id)
    return {"success": True, "message": "Now following"}


@router.delete("/{user_id}/follow")
async def unfollow_user(user_id: str, user=Depends(get_current_user)):
    await user_service.unfollow(user["id"], user_id)
    return {"success": True, "message": "Unfollowed"}


@router.get("/{user_id}/followers")
async def get_followers(user_id: str, page: int = Query(0), user=Depends(get_current_user)):
    data = await user_service.get_followers(user_id, page)
    return {"success": True, "data": data}


@router.get("/{user_id}/following")
async def get_following(user_id: str, page: int = Query(0), user=Depends(get_current_user)):
    data = await user_service.get_following(user_id, page)
    return {"success": True, "data": data}


@router.get("/{user_id}/posts")
async def get_user_posts(user_id: str, page: int = Query(0), user=Depends(get_current_user)):
    from app.services import post_service
    data = await post_service.get_by_user(user_id, page)
    return {"success": True, "data": data}
