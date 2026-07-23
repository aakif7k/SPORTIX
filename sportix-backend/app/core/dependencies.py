from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from appwrite.client import Client
from appwrite.services.account import Account
from app.core.config import settings

security = HTTPBearer()
security_optional = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Validate Appwrite JWT from Authorization: Bearer <token>.
    Returns {id, email, name} dict on success.
    The frontend passes the Appwrite session JWT obtained from
    account.createJWT() or a session token.
    """
    token = credentials.credentials
    try:
        user_client = Client()
        user_client.set_endpoint(settings.appwrite_endpoint)
        user_client.set_project(settings.appwrite_project_id)
        user_client.set_jwt(token)

        account = Account(user_client)
        user_data = account.get()

        return {
            "id": user_data["$id"],
            "email": user_data.get("email", ""),
            "name": user_data.get("name", ""),
        }
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_optional),
) -> dict | None:
    """Optional auth — returns None if no token is provided."""
    if not credentials:
        return None
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None
