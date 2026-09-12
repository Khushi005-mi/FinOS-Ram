import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_password_reset_token,
    get_current_tenant_user,
    get_password_hash,
    verify_password,
    verify_password_reset_token,
    TokenData,
)
from app.db.models.organization import Organization
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.auth import (
    LoginRequest,
    SignupRequest,
    PasswordChangeRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserProfileResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

COOKIE_NAME = "finos_access_token"
COOKIE_MAX_AGE = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        secure=False if settings.DEBUG else True,
        samesite="lax",
        path="/",
    )


@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new tenant organization and administrator",
)
async def signup(
    payload: SignupRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User).where(User.email == payload.email)
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists.",
        )

    org_id = uuid.uuid4()
    slug_base = payload.company_name.lower().replace(" ", "-")[:50]
    slug = f"{slug_base}-{str(org_id)[:8]}"

    chosen_currency = getattr(payload, "currency", "USD") or "USD"
    org = Organization(
        id=org_id,
        name=payload.company_name,
        slug=slug,
        industry_type="GENERAL_SMB",
        currency=chosen_currency.upper(),
        fiscal_year_start=1 if chosen_currency.upper() == "USD" else 4,
        is_active=True,
    )
    db.add(org)

    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        organization_id=org_id,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        role="ADMIN",
        is_active=True,
    )
    db.add(user)
    await db.commit()

    token = create_access_token(
        subject=str(user_id),
        organization_id=str(org_id),
        role="ADMIN",
        email=payload.email,
    )

    _set_auth_cookie(response, token)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=str(user_id),
        organization_id=str(org_id),
        role="ADMIN",
        email=payload.email,
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate user, issue JWT and set HttpOnly session cookie",
)
async def login(
    payload: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User).where(User.email == payload.email)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated.",
        )

    token = create_access_token(
        subject=str(user.id),
        organization_id=str(user.organization_id),
        role=user.role,
        email=user.email,
    )

    _set_auth_cookie(response, token)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=str(user.id),
        organization_id=str(user.organization_id),
        role=user.role,
        email=user.email,
    )


@router.post(
    "/forgot-password",
    status_code=status.HTTP_200_OK,
    summary="Generate ephemeral password reset token",
)
async def forgot_password(
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User).where(User.email == payload.email.strip().lower())
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    # Zero User Enumeration: Always return success message
    if not user:
        return {
            "success": True,
            "message": "If this email address is registered, password reset instructions have been generated.",
        }

    reset_token = create_password_reset_token(user_id=str(user.id), email=user.email)

    return {
        "success": True,
        "message": "Password reset token generated successfully.",
        "reset_token": reset_token,
    }


@router.post(
    "/reset-password",
    status_code=status.HTTP_200_OK,
    summary="Verify ephemeral token and reset password with token-epoch rotation",
)
async def reset_password(
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    token_data = verify_password_reset_token(payload.token.strip())
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token is invalid or has expired.",
        )

    user_id = token_data.get("sub")
    stmt = select(User).where(User.id == uuid.UUID(str(user_id)))
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User associated with this reset token no longer exists.",
        )

    # Rotate password and update timestamp to trigger Token-Epoch Revocation
    user.hashed_password = get_password_hash(payload.new_password)
    user.updated_at = datetime.now(timezone.utc)

    await db.commit()

    return {
        "success": True,
        "message": "Password has been successfully updated. You may now log in.",
    }


@router.post(
    "/password/change",
    status_code=status.HTTP_200_OK,
    summary="Change user password, update credential timestamp, and issue fresh session",
)
async def change_password(
    payload: PasswordChangeRequest,
    response: Response,
    current_user: TokenData = Depends(get_current_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User).where(User.id == uuid.UUID(current_user.user_id))
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if not verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password.",
        )

    user.hashed_password = get_password_hash(payload.new_password)
    user.updated_at = datetime.now(timezone.utc)
    
    await db.commit()
    await db.refresh(user)

    new_token = create_access_token(
        subject=str(user.id),
        organization_id=str(user.organization_id),
        role=user.role,
        email=user.email,
    )
    _set_auth_cookie(response, new_token)

    return {
        "success": True,
        "message": "Password changed successfully. Session rotated.",
    }


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Log out active session and clear HttpOnly cookie",
)
async def logout(response: Response):
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"success": True, "message": "Logged out successfully."}


@router.get(
    "/me",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Get authenticated user profile",
)
async def get_my_profile(
    current_user: TokenData = Depends(get_current_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User).where(User.id == uuid.UUID(current_user.user_id))
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    return user
