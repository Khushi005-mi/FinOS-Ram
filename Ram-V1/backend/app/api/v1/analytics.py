"""
backend/app/api/v1/analytics.py

Analytics Endpoints for COGS Tri-Breakdown and Automated CFO Insights.
"""
import uuid
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import TokenData, get_current_tenant_user
from app.db.session import get_db
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/analytics", tags=["Manufacturing & Business Analytics"])


def _to_uuid(val: Any) -> uuid.UUID:
    if isinstance(val, uuid.UUID):
        return val
    try:
        return uuid.UUID(str(val))
    except Exception:
        return uuid.UUID("00000000-0000-0000-0000-000000000001")


@router.get(
    "/cogs",
    status_code=status.HTTP_200_OK,
    summary="Get COGS Tri-Breakdown for Active Dataset",
)
async def get_cogs_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
) -> Dict[str, Any]:
    try:
        org_id = _to_uuid(current_user.organization_id)
        return await DashboardService.get_cogs_breakdown(db, org_id)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate COGS breakdown: {str(exc)}",
        )


@router.get(
    "/insights",
    status_code=status.HTTP_200_OK,
    summary="Get Prescriptive CFO Insights for Active Dataset",
)
async def get_cfo_insights_data(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
) -> List[Dict[str, Any]]:
    try:
        org_id = _to_uuid(current_user.organization_id)
        return await DashboardService.get_cfo_insights(db, org_id)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate insights: {str(exc)}",
        )
