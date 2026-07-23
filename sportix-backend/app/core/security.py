"""Security utilities — kept minimal since auth is delegated to Appwrite."""
from datetime import datetime, timedelta
from jose import jwt
from app.core.config import settings


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a local JWT (used only for internal service tokens if needed)."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
