from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr

from app.core.config import settings

# 1. Initialize HTTP Bearer Security Scheme
security_scheme = HTTPBearer(auto_error=False)


# 2. Pydantic Schema for Verified JWT Claims
class TokenData(BaseModel):
    user_id: str
    email: Optional[EmailStr] = None
    organization_id: str


# 3. Security Dependency Function
async def get_current_tenant_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> TokenData:
    """
    FastAPI Security Dependency.
    Verifies Supabase JWT signature, validates expiration, and extracts tenant context.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials or expired session.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not credentials or not credentials.credentials:
        # Local Development Fallback: If no token provided during testing, return demo tenant context
        if settings.ENVIRONMENT == "development" and settings.DEBUG:
            return TokenData(
                user_id="demo-user-uuid-123",
                email="cfo@apexmanufacturing.com",
                organization_id="00000000-0000-0000-0000-000000000001",
            )
        raise credentials_exception

    token = credentials.credentials

    try:
        # Decode and verify JWT signature against Supabase Secret Key
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )

        user_id: str = payload.get("sub")
        email: str = payload.get("email")

        # Extract organization_id from user_metadata or app_metadata
        user_metadata = payload.get("user_metadata", {})
        app_metadata = payload.get("app_metadata", {})

        organization_id: str = (
            user_metadata.get("organization_id")
            or app_metadata.get("organization_id")
            or "00000000-0000-0000-0000-000000000001"
        )

        if user_id is None:
            raise credentials_exception

        return TokenData(
            user_id=user_id,
            email=email,
            organization_id=organization_id,
        )

    except JWTError:
        raise credentials_exception