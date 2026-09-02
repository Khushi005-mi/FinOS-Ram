"""
backend/app/api/v1/reports.py

Financial Reports & Export Endpoints.
"""
import uuid
from typing import Any, Dict
from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import TokenData, get_current_tenant_user
from app.db.session import get_db
from app.services.reports_service import ReportsService

router = APIRouter(prefix="/reports", tags=["Financial Reports & Statements"])


def _to_uuid(val: Any) -> uuid.UUID:
    if isinstance(val, uuid.UUID):
        return val
    try:
        return uuid.UUID(str(val))
    except Exception:
        return uuid.UUID("00000000-0000-0000-0000-000000000001")


@router.get("/income-statement", status_code=status.HTTP_200_OK)
async def get_income_statement(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
) -> Dict[str, Any]:
    org_id = _to_uuid(current_user.organization_id)
    return await ReportsService.build_income_statement(db, org_id)


@router.get("/balance-sheet", status_code=status.HTTP_200_OK)
async def get_balance_sheet(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
) -> Dict[str, Any]:
    org_id = _to_uuid(current_user.organization_id)
    return await ReportsService.build_balance_sheet(db, org_id)


@router.get("/cash-flow", status_code=status.HTTP_200_OK)
async def get_cash_flow(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
) -> Dict[str, Any]:
    org_id = _to_uuid(current_user.organization_id)
    return await ReportsService.build_cash_flow(db, org_id)


@router.get("/export/excel", status_code=status.HTTP_200_OK)
async def export_financials_excel(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
):
    """Streams a board-ready styled .xlsx workbook to the client."""
    org_id = _to_uuid(current_user.organization_id)
    excel_stream = await ReportsService.generate_board_excel_workbook(db, org_id)
    
    headers = {
        "Content-Disposition": 'attachment; filename="FinOS_Board_Financial_Report.xlsx"'
    }
    return StreamingResponse(
        excel_stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers
    )
