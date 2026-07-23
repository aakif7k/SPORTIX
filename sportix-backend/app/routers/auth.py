from fastapi import APIRouter, HTTPException, status
from app.schemas.user import UserCreate, UserLogin
from app.core.dependencies import get_current_user
from fastapi import Depends
from app.services import auth_service

router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate):
    """
    Register a new SPORTiX user.
    - Creates Appwrite Auth account
    - Creates profiles document in DB
    - Initializes pulse, level, coins, streaks documents
    """
    result = await auth_service.register_user(payload)
    return {"success": True, "data": result}


@router.post("/login")
async def login(payload: UserLogin):
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
    url = auth_service.get_google_oauth_url()
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
async def forgot_password(email: str):
    """Sends password reset email via Appwrite."""
    await auth_service.send_reset_email(email)
    return {"success": True, "message": "Password reset email sent"}


@router.put("/change-password")
async def change_password(
    old_password: str,
    new_password: str,
    current_user=Depends(get_current_user),
):
    await auth_service.change_password(current_user["id"], old_password, new_password)
    return {"success": True, "message": "Password updated"}
