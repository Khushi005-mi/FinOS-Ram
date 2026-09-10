import uuid
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import TokenData, get_current_tenant_user
from app.db.session import get_db
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/analytics", tags=["Manufacturing & Business Analytics"])


@router.get(
    "/cogs",
    status_code=status.HTTP_200_OK,
    summary="Get COGS Tri-Breakdown",
)
async def get_cogs_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
) -> Dict[str, Any]:
    cogs_data = await DashboardService.get_cogs_breakdown(
        db=db,
        organization_id=current_user.organization_id,
    )
    return {"success": True, "data": cogs_data, "error": None}


@router.get(
    "/insights",
    status_code=status.HTTP_200_OK,
    summary="Get Prescriptive CFO Insights",
)
async def get_cfo_insights_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
) -> Dict[str, Any]:
    insights_data = await DashboardService.get_cfo_insights(
        db=db,
        organization_id=current_user.organization_id,
    )
    return {"success": True, "data": insights_data, "error": None}
