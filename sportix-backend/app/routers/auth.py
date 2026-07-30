from fastapi import APIRouter, HTTPException, status, Request
from app.core.rate_limit import limiter, AUTH_LIMIT
from app.schemas.user import (
    UserCreate, UserLogin, ForgotPasswordRequest, ChangePasswordRequest,
)
from app.core.dependencies import get_current_user
from fastapi import Depends
from app.services import auth_service

router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED)
@limiter.limit(AUTH_LIMIT)
async def register(request: Request, payload: UserCreate):
    """
    Register a new SPORTiX user.
    - Creates Appwrite Auth account
    - Creates profiles document in DB
    - Initializes pulse, level, coins, streaks documents
    """
    result = await auth_service.register_user(payload)
    return {"success": True, "data": result}


@router.post("/login")
@limiter.limit(AUTH_LIMIT)
async def login(request: Request, payload: UserLogin):
    """
    Email/password login.
    Returns Appwrite session JWT — frontend stores this and sends it
    as Authorization: Bearer <token> on every request.
    """
    result = await auth_service.login_user(payload.email, payload.password)
    return {"success": True, "data": result}


@router.get("/google")
async def google_oauth():
    """Returns the Appwrite Google OAuth redirect URL."""
    url = await auth_service.get_google_oauth_url()
    return {"success": True, "data": {"oauth_url": url}}


@router.post("/logout")
async def logout(current_user=Depends(get_current_user)):
    """Session deletion is handled client-side via Appwrite SDK."""
    return {"success": True, "message": "Logged out"}


@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    """Returns the currently authenticated user."""
    return {"success": True, "data": current_user}


@router.post("/forgot-password")
@limiter.limit(AUTH_LIMIT)
async def forgot_password(request: Request, payload: ForgotPasswordRequest):
    """
    Sends a password reset email.

    Always reports success, so the response cannot be used to test whether an
    address is registered.
    """
    result = await auth_service.send_reset_email(payload.email)
    return {"success": True, "data": result}


@router.put("/change-password")
@limiter.limit(AUTH_LIMIT)
async def change_password(request: Request, 
    payload: ChangePasswordRequest,
    current_user=Depends(get_current_user),
):
    """Changes the password after verifying the current one."""
    result = await auth_service.change_password(
        current_user["id"], payload.old_password, payload.new_password
    )
    return {"success": True, "data": result}
