import uuid
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import TokenData, get_current_tenant_user
from app.db.models.organization import Organization
from app.db.session import get_db
from app.schemas.organization import OrganizationCreateSchema, OrganizationResponseSchema

router = APIRouter(prefix="/organization", tags=["Organization & Tenant Setup"])


@router.get(
    "/me",
    response_model=OrganizationResponseSchema,
    status_code=status.HTTP_200_OK,
    summary="Get Active Tenant Organization Profile",
)
async def get_my_organization(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
):
    raw_id = current_user.organization_id
    try:
        org_uuid = uuid.UUID(raw_id)
    except (ValueError, TypeError):
        org_uuid = uuid.UUID("00000000-0000-0000-0000-000000000001")

    # Match both native UUID and string UUID representations for cross-DB compatibility
    stmt = select(Organization).where(
        (Organization.id == org_uuid) | (Organization.id == str(org_uuid))
    )
    result = await db.execute(stmt)
    org = result.scalar_one_or_none()

    if not org:
        org = Organization(
            id=org_uuid,
            name="Apex Manufacturing Ltd.",
            slug="apex-manufacturing",
            industry_type="MANUFACTURING",
            currency="INR",
            fiscal_year_start=4,
            is_active=True,
        )
        db.add(org)
        await db.commit()
        await db.refresh(org)

    return org


@router.patch(
    "/me",
    response_model=OrganizationResponseSchema,
    status_code=status.HTTP_200_OK,
    summary="Update Tenant Organization Settings & Currency",
)
async def update_my_organization(
    payload: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
):
    raw_id = current_user.organization_id
    try:
        org_uuid = uuid.UUID(raw_id)
    except (ValueError, TypeError):
        org_uuid = uuid.UUID("00000000-0000-0000-0000-000000000001")

    stmt = select(Organization).where(
        (Organization.id == org_uuid) | (Organization.id == str(org_uuid))
    )
    result = await db.execute(stmt)
    org = result.scalar_one_or_none()

    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    if "name" in payload:
        org.name = payload["name"]
    if "industryType" in payload or "industry_type" in payload:
        org.industry_type = payload.get("industryType") or payload.get("industry_type")
    if "currency" in payload:
        org.currency = payload["currency"].upper()
    if "fiscalYearStart" in payload or "fiscal_year_start" in payload:
        org.fiscal_year_start = payload.get("fiscalYearStart") or payload.get("fiscal_year_start")

    await db.commit()
    await db.refresh(org)
    return org
import hashlib
import secrets
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr, Field
from app.core.security import require_roles
from app.db.models.user import User
from app.db.models.invitation import OrganizationInvitation

class InviteMemberRequest(BaseModel):
    email: EmailStr
    role: str = Field(default="ANALYST", description="Assigned role: FINANCE_MANAGER, ANALYST, AUDITOR")

@router.get(
    "/team",
    status_code=status.HTTP_200_OK,
    summary="Get Workspace Member Roster and Pending Invites",
)
async def get_workspace_team(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
):
    org_id = uuid.UUID(current_user.organization_id)
    
    # 1. Active Users
    user_stmt = select(User).where(User.organization_id == org_id)
    user_res = await db.execute(user_stmt)
    users = user_res.scalars().all()
    
    # 2. Pending Invitations
    inv_stmt = select(OrganizationInvitation).where(
        OrganizationInvitation.organization_id == org_id,
        OrganizationInvitation.accepted_at == None,
        OrganizationInvitation.expires_at > datetime.utcnow()
    )
    inv_res = await db.execute(inv_stmt)
    invitations = inv_res.scalars().all()
    
    return {
        "success": True,
        "data": {
            "members": [
                {
                    "id": str(u.id),
                    "email": u.email,
                    "fullName": u.full_name or "Active Colleague",
                    "role": u.role,
                    "status": "Active" if u.is_active else "Deactivated",
                    "joinedAt": u.created_at.isoformat() if u.created_at else None
                }
                for u in users
            ],
            "pendingInvitations": [
                {
                    "id": str(i.id),
                    "email": i.email,
                    "role": i.role,
                    "expiresAt": i.expires_at.isoformat(),
                }
                for i in invitations
            ]
        }
    }

@router.post(
    "/invitations",
    status_code=status.HTTP_201_CREATED,
    summary="Invite Colleague to Workspace (Restricted to ADMIN)",
)
async def invite_team_member(
    payload: InviteMemberRequest,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(require_roles(["ADMIN"])),
):
    org_id = uuid.UUID(current_user.organization_id)
    caller_id = uuid.UUID(current_user.user_id)
    
    # Check if user already exists
    existing_user_stmt = select(User).where(User.email == payload.email)
    existing_user_res = await db.execute(existing_user_stmt)
    if existing_user_res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email is already an active member of an organization.",
        )
    
    # Generate 32-byte cryptographic token
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    
    invitation = OrganizationInvitation(
        id=uuid.uuid4(),
        organization_id=org_id,
        email=payload.email,
        role=payload.role.upper(),
        token_hash=token_hash,
        invited_by=caller_id,
        expires_at=datetime.utcnow() + timedelta(hours=48),
    )
    db.add(invitation)
    await db.commit()
    
    return {
        "success": True,
        "message": f"Invitation generated for {payload.email} with role {payload.role.upper()}.",
        "data": {
            "email": payload.email,
            "role": payload.role.upper(),
            "expiresAt": invitation.expires_at.isoformat(),
            "inviteToken": raw_token,
            "inviteUrl": f"http://localhost:3000/accept-invite?token={raw_token}"
        }
    }

import hashlib
import secrets
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr, Field
from app.core.security import require_roles
from app.db.models.user import User
from app.db.models.invitation import OrganizationInvitation

class InviteMemberRequest(BaseModel):
    email: EmailStr
    role: str = Field(default="ANALYST", description="Assigned role: FINANCE_MANAGER, ANALYST, AUDITOR")

@router.get(
    "/team",
    status_code=status.HTTP_200_OK,
    summary="Get Workspace Member Roster and Pending Invites",
)
async def get_workspace_team(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
):
    org_id = uuid.UUID(current_user.organization_id)
    
    # 1. Active Users
    user_stmt = select(User).where(User.organization_id == org_id)
    user_res = await db.execute(user_stmt)
    users = user_res.scalars().all()
    
    # 2. Pending Invitations
    inv_stmt = select(OrganizationInvitation).where(
        OrganizationInvitation.organization_id == org_id,
        OrganizationInvitation.accepted_at == None,
        OrganizationInvitation.expires_at > datetime.utcnow()
    )
    inv_res = await db.execute(inv_stmt)
    invitations = inv_res.scalars().all()
    
    return {
        "success": True,
        "data": {
            "members": [
                {
                    "id": str(u.id),
                    "email": u.email,
                    "fullName": u.full_name or "Active Colleague",
                    "role": u.role,
                    "status": "Active" if u.is_active else "Deactivated",
                    "joinedAt": u.created_at.isoformat() if u.created_at else None
                }
                for u in users
            ],
            "pendingInvitations": [
                {
                    "id": str(i.id),
                    "email": i.email,
                    "role": i.role,
                    "expiresAt": i.expires_at.isoformat(),
                }
                for i in invitations
            ]
        }
    }

@router.post(
    "/invitations",
    status_code=status.HTTP_201_CREATED,
    summary="Invite Colleague to Workspace (Restricted to ADMIN)",
)
async def invite_team_member(
    payload: InviteMemberRequest,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(require_roles(["ADMIN"])),
):
    org_id = uuid.UUID(current_user.organization_id)
    caller_id = uuid.UUID(current_user.user_id)
    
    # Check if user already exists
    existing_user_stmt = select(User).where(User.email == payload.email)
    existing_user_res = await db.execute(existing_user_stmt)
    if existing_user_res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email is already an active member of an organization.",
        )
    
    # Generate 32-byte cryptographic token
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    
    invitation = OrganizationInvitation(
        id=uuid.uuid4(),
        organization_id=org_id,
        email=payload.email,
        role=payload.role.upper(),
        token_hash=token_hash,
        invited_by=caller_id,
        expires_at=datetime.utcnow() + timedelta(hours=48),
    )
    db.add(invitation)
    await db.commit()
    
    return {
        "success": True,
        "message": f"Invitation generated for {payload.email} with role {payload.role.upper()}.",
        "data": {
            "email": payload.email,
            "role": payload.role.upper(),
            "expiresAt": invitation.expires_at.isoformat(),
            "inviteToken": raw_token,
            "inviteUrl": f"http://localhost:3000/accept-invite?token={raw_token}"
        }
    }
