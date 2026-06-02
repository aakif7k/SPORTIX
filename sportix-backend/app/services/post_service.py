import uuid
from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.post import Post, PostLike, Comment
from app.services.pulse_service import add_pulse_points
from app.services.mission_service import update_mission_progress

async def create_new_post(
    db: AsyncSession,
    user_id: uuid.UUID,
    post_in
) -> Post:
    post = Post(
        id=uuid.uuid4(),
        user_id=user_id,
        content=post_in.content,
        media_url=post_in.media_url,
        media_type=post_in.media_type,
        is_highlight=post_in.is_highlight,
        likes_count=0,
        comments_count=0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(post)
    await db.flush()
    
    # Award Pulse Points and Update Missions
    if post.is_highlight:
        await add_pulse_points(db, user_id, 15.0, "highlight", "Uploaded profile video highlight")
        await update_mission_progress(db, user_id, "upload_highlight")
    else:
        await add_pulse_points(db, user_id, 8.0, "post", "Created a community feed post")
        await update_mission_progress(db, user_id, "create_post")
        
    return post

async def like_post(db: AsyncSession, user_id: uuid.UUID, post_id: uuid.UUID) -> dict:
    post = await db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
        
    result = await db.execute(
        select(PostLike).where(
            PostLike.user_id == user_id,
            PostLike.post_id == post_id
        )
    )
    like = result.scalar_one_or_none()
    
    if like:
        # Unlike
        await db.delete(like)
        post.likes_count = max(0, post.likes_count - 1)
        action = "unliked"
    else:
        # Like
        like = PostLike(
            id=uuid.uuid4(),
            user_id=user_id,
            post_id=post_id,
            created_at=datetime.utcnow()
        )
        db.add(like)
        post.likes_count += 1
        action = "liked"
        
        # Award 1 Pulse Point for active community engagement
        await add_pulse_points(db, user_id, 1.0, "reaction", f"Liked post {post_id}")
        await update_mission_progress(db, user_id, "react_posts")
        
    await db.flush()
    return {"success": True, "action": action, "likes_count": post.likes_count}

async def add_comment(
    db: AsyncSession,
    user_id: uuid.UUID,
    post_id: uuid.UUID,
    comment_in
) -> Comment:
    post = await db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
        
    comment = Comment(
        id=uuid.uuid4(),
        post_id=post_id,
        user_id=user_id,
        content=comment_in.content,
        created_at=datetime.utcnow()
    )
    db.add(comment)
    post.comments_count += 1
    await db.flush()
    
    # Award 2 Pulse Points for active communication
    await add_pulse_points(db, user_id, 2.0, "comment", "Commented on a feed post")
    await update_mission_progress(db, user_id, "comment")
    
    return comment

async def list_feed_posts(
    db: AsyncSession,
    current_user_id: uuid.UUID,
    skip: int = 0,
    limit: int = 20
) -> list[Post]:
    result = await db.execute(
        select(Post)
        .options(
            selectinload(Post.user),
            selectinload(Post.comments).selectinload(Comment.user)
        )
        .order_by(Post.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    posts = list(result.scalars().all())
    
    # Mark which ones are liked by current user
    for post in posts:
        like_check = await db.execute(
            select(PostLike).where(
                PostLike.user_id == current_user_id,
                PostLike.post_id == post.id
            )
        )
        post.is_liked = like_check.scalar_one_or_none() is not None
        
    return posts
