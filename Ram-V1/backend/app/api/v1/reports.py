import uuid
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import TokenData, get_current_tenant_user
from app.db.session import get_db
from app.services.reports_service import ReportsService

router = APIRouter(prefix="/reports", tags=["Financial Reports"])


def _parse_uuid(val: Any) -> uuid.UUID:
    try:
        return uuid.UUID(str(val))
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid organization UUID: '{val}'",
        )


@router.get(
    "/income-statement",
    status_code=status.HTTP_200_OK,
    summary="Get GAAP Income Statement (P&L)",
)
async def get_income_statement(
    period_name: str = Query(default="Active Dataset Period"),
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
) -> Dict[str, Any]:
    org_id = _parse_uuid(current_user.organization_id)
    statement = await ReportsService.generate_income_statement(
        db=db,
        organization_id=org_id,
        period_name=period_name,
    )
    return {"success": True, "data": statement, "error": None}


@router.get(
    "/balance-sheet",
    status_code=status.HTTP_200_OK,
    summary="Get GAAP Balance Sheet",
)
async def get_balance_sheet(
    period_name: str = Query(default="As of Active Dataset Date"),
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
) -> Dict[str, Any]:
    org_id = _parse_uuid(current_user.organization_id)
    statement = await ReportsService.generate_balance_sheet(
        db=db,
        organization_id=org_id,
        period_name=period_name,
    )
    return {"success": True, "data": statement, "error": None}


@router.get(
    "/cash-flow",
    status_code=status.HTTP_200_OK,
    summary="Get GAAP Cash Flow Statement",
)
async def get_cash_flow(
    period_name: str = Query(default="Active Dataset Period"),
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
) -> Dict[str, Any]:
    org_id = _parse_uuid(current_user.organization_id)
    statement = await ReportsService.generate_cash_flow(
        db=db,
        organization_id=org_id,
        period_name=period_name,
    )
    return {"success": True, "data": statement, "error": None}
