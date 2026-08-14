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
    # Convert string ID to native Python uuid.UUID object for Postgres
    try:
        organization_id = uuid.UUID(current_user.organization_id)
    except (ValueError, TypeError):
        organization_id = uuid.UUID("00000000-0000-0000-0000-000000000001")

    stmt = select(Organization).where(Organization.id == organization_id)
    result = await db.execute(stmt)
    org = result.scalar_one_or_none()

    if not org:
        # Create default organization if not found
        org = Organization(
            id=organization_id,
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
    try:
        organization_id = uuid.UUID(current_user.organization_id)
    except (ValueError, TypeError):
        organization_id = uuid.UUID("00000000-0000-0000-0000-000000000001")

    stmt = select(Organization).where(Organization.id == organization_id)
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