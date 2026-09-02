"""
backend/app/api/v1/auth.py
"""
import uuid
import re
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.models.organization import Organization
from app.db.models.user import User
from app.core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
    TokenData,
    get_current_tenant_user,
)

router = APIRouter(prefix="/auth", tags=["Authentication & Tenant Onboarding"])


class SignupRequest(BaseModel):
    company_name: str
    full_name: str
    email: EmailStr
    password: str
    industry_type: str = "GENERAL_SMB"
    currency: str = "INR"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str


def _slugify(text: str) -> str:
    cleaned = re.sub(r"[^\w\s-]", "", text).strip().lower()
    return re.sub(r"[-\s]+", "-", cleaned) or "company"


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def register_company_and_user(
    payload: SignupRequest,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    existing_user = (
        await db.execute(select(User).where(User.email == payload.email))
    ).scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this work email already exists.",
        )

    org_id = uuid.uuid4()
    company_slug = f"{_slugify(payload.company_name)}-{str(org_id)[:6]}"
    
    new_org = Organization(
        id=org_id,
        name=payload.company_name.strip(),
        slug=company_slug,
        industry_type=payload.industry_type,
        currency=payload.currency.upper(),
        fiscal_year_start=4,
        is_active=True,
    )
    db.add(new_org)

    user_id = uuid.uuid4()
    new_user = User(
        id=user_id,
        organization_id=org_id,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name.strip(),
        role="OWNER",
        is_active=True,
    )
    db.add(new_user)
    await db.commit()

    access_token = create_access_token(
        subject=str(user_id),
        organization_id=str(org_id),
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user_id),
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role,
        },
        "organization": {
            "id": str(org_id),
            "name": new_org.name,
            "industry_type": new_org.industry_type,
            "currency": new_org.currency,
        },
    }


@router.post("/login", status_code=status.HTTP_200_OK)
async def login_user(
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    user_stmt = select(User).where(User.email == payload.email)
    user = (await db.execute(user_stmt)).scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    org = (
        await db.execute(select(Organization).where(Organization.id == user.organization_id))
    ).scalar_one_or_none()

    access_token = create_access_token(
        subject=str(user.id),
        organization_id=str(user.organization_id),
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
        },
        "organization": {
            "id": str(org.id) if org else str(user.organization_id),
            "name": org.name if org else "My Workspace",
            "industry_type": getattr(org, "industry_type", "GENERAL_SMB"),
            "currency": getattr(org, "currency", "INR"),
        },
    }


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def request_password_reset(
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    user = (await db.execute(select(User).where(User.email == payload.email))).scalar_one_or_none()
    return {
        "success": True,
        "message": f"Password reset authorized for {payload.email}.",
        "email": payload.email,
    }


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    user = (await db.execute(select(User).where(User.email == payload.email))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    user.hashed_password = get_password_hash(payload.new_password)
    await db.commit()
    return {"success": True, "message": "Password updated successfully. You may now sign in."}


@router.get("/me", status_code=status.HTTP_200_OK)
async def get_authenticated_session_profile(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
) -> Dict[str, Any]:
    org_id = current_user.organization_id
    try:
        org_uuid = uuid.UUID(str(org_id))
    except Exception:
        org_uuid = uuid.UUID("00000000-0000-0000-0000-000000000001")

    org = (await db.execute(select(Organization).where(Organization.id == org_uuid))).scalar_one_or_none()

    return {
        "user": {
            "id": current_user.user_id,
            "email": current_user.email,
            "role": current_user.role,
        },
        "organization": {
            "id": str(org.id) if org else str(org_id),
            "name": org.name if org else "Apex Manufacturing Ltd.",
            "industry_type": getattr(org, "industry_type", "GENERAL_SMB"),
            "currency": getattr(org, "currency", "INR"),
            "active_batch_id": getattr(org, "active_batch_id", None),
        },
    }
