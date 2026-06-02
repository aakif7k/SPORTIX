import uuid
from datetime import datetime, date
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.user import User
from app.core.security import verify_password, get_password_hash, create_access_token
from app.services.level_service import get_or_create_user_level
from app.services.coins_service import get_or_create_user_coins, add_coins
from app.services.streak_service import get_or_create_user_streak, update_user_streak
from app.services.pulse_service import add_pulse_points, get_or_create_pulse_score

async def register_user(db: AsyncSession, user_in) -> User:
    # Check if email/username exists
    email_check = await db.execute(select(User).where(User.email == user_in.email))
    if email_check.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        
    username_check = await db.execute(select(User).where(User.username == user_in.username))
    if username_check.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered")
        
    db_user = User(
        id=uuid.uuid4(),
        email=user_in.email,
        username=user_in.username,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
        sport=user_in.sport,
        sports=user_in.sports,
        position=user_in.position,
        experience_level=user_in.experience_level,
        location=user_in.location,
        city=user_in.city,
        latitude=user_in.latitude,
        longitude=user_in.longitude,
        bio=user_in.bio,
        avatar_url=user_in.avatar_url,
        is_open_to_recruit=user_in.is_open_to_recruit,
        is_active=True,
        last_login=None,
        login_streak=0,
        longest_streak=0,
        profile_theme="default",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(db_user)
    await db.flush()
    
    # Initialize gamification profiles
    await get_or_create_user_level(db, db_user.id)
    await get_or_create_user_coins(db, db_user.id)
    await get_or_create_user_streak(db, db_user.id)
    await get_or_create_pulse_score(db, db_user.id)
    
    # Welcome reward: 150 Coins
    await add_coins(db, db_user.id, 150, "welcome_bonus", "SPORTiX Registration Bonus")
    
    return db_user

async def authenticate_user(db: AsyncSession, username: str, password_raw: str) -> dict:
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
        
    if not verify_password(password_raw, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
        
    # Check if this is the first login of the day
    today = date.today()
    first_login_today = False
    if user.last_login is None or user.last_login.date() < today:
        first_login_today = True
        
    user.last_login = datetime.utcnow()
    await db.flush()
    
    # Apply login pulse reward and streak tracking
    pulse_info = None
    streak_info = None
    if first_login_today:
        # Update streak
        streak_info = await update_user_streak(db, user.id)
        # Add pulse points
        pulse_info = await add_pulse_points(db, user.id, 5.0, "login", "Daily login bonus")
        
    access_token = create_access_token(subject=str(user.id))
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": str(user.id),
        "username": user.username,
        "role": user.role,
        "first_login_today": first_login_today,
        "streak_info": streak_info,
        "pulse_info": pulse_info
    }
