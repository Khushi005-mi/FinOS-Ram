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
    # Extract string organization_id for exact database column matching
    organization_id = str(current_user.organization_id)

    overview = await DashboardService.get_executive_overview(
        db=db,
        organization_id=organization_id,
    )
    return overview["cogs_breakdown"]


@router.get(
    "/insights",
    status_code=status.HTTP_200_OK,
    summary="Get Prescriptive CFO Insights",
)
async def get_cfo_insights_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
) -> List[Dict[str, Any]]:
    organization_id = str(current_user.organization_id)

    overview = await DashboardService.get_executive_overview(
        db=db,
        organization_id=organization_id,
    )
    return overview["insights"]