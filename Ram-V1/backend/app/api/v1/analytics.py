import uuid
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import TokenData, get_current_tenant_user
from app.db.session import get_db
from app.services.dashboard_service import DashboardService

# 1. Initialize API Router for Analytics
router = APIRouter(prefix="/analytics", tags=["Manufacturing & Business Analytics"])


@router.get(
    "/cogs",
    status_code=status.HTTP_200_OK,
    summary="Get COGS Tri-Breakdown",
    description="Returns unit economic cost distributions across Direct Raw Materials, Direct Labor, and Overhead.",
)
async def get_cogs_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
) -> Dict[str, Any]:
    """
    Fetches active tenant ledger entries and calculates cost distribution across COGS categories.
    """
    try:
        organization_id = uuid.UUID(current_user.organization_id)
    except ValueError:
        organization_id = uuid.UUID("00000000-0000-0000-0000-000000000001")

    overview = await DashboardService.get_executive_overview(
        db=db,
        organization_id=organization_id,
    )
    return overview["cogs_breakdown"]


@router.get(
    "/insights",
    status_code=status.HTTP_200_OK,
    summary="Get Prescriptive CFO Insights",
    description="Returns rule-based prescriptive diagnostic recommendations for executive decision making.",
)
async def get_cfo_insights_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
) -> List[Dict[str, Any]]:
    """
    Evaluates tenant financial metrics against operational rules and returns prioritized action items.
    """
    try:
        organization_id = uuid.UUID(current_user.organization_id)
    except ValueError:
        organization_id = uuid.UUID("00000000-0000-0000-0000-000000000001")

    overview = await DashboardService.get_execut