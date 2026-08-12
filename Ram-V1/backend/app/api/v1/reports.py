import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import TokenData, get_current_tenant_user
from app.db.session import get_db
from app.schemas.reports import FinancialStatementResponse
from app.services.reports_service import ReportsService

router = APIRouter(prefix="/reports", tags=["Financial Reports"])


@router.get(
    "/income-statement",
    response_model=FinancialStatementResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Income Statement (P&L)",
)
async def get_income_statement(
    period_name: str = Query(default="Q1 2024 (Jan - Mar)"),
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
):
    # Use string UUID matching for SQLite/Postgres compatibility
    organization_id = str(current_user.organization_id)

    return await ReportsService.generate_income_statement(
        db=db,
        organization_id=organization_id,
        period_name=period_name,
    )