from typing import Any, Dict, List

from fastapi import APIRouter, Depends, status
import pandas as pd
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import TokenData, get_current_tenant_user
from app.db.models.journal_entry import JournalEntry
from app.db.models.organization import Organization
from app.db.session import get_db
from app.engine.financial_math import compute_executive_metrics, compute_monthly_trends

router = APIRouter(prefix="/dashboard", tags=["Executive Dashboard"])


@router.get(
    "/metrics",
    status_code=status.HTTP_200_OK,
    summary="Get Executive Summary KPI Metrics",
)
async def get_dashboard_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
) -> Dict[str, Any]:
    organization_id = str(current_user.organization_id)

    # 1. Fetch Tenant Currency
    org_stmt = select(Organization).where(Organization.id == organization_id)
    org_result = await db.execute(org_stmt)
    org = org_result.scalar_one_or_none()
    currency_code = org.currency if org else "INR"

    # 2. Query Journal Entries from Database (String UUID matching)
    stmt = select(JournalEntry).where(JournalEntry.organization_id == organization_id)
    result = await db.execute(stmt)
    entries = result.scalars().all()

    # 3. Convert ORM Result Set to Pandas DataFrame
    if not entries:
        df = pd.DataFrame(columns=["account_category", "debit", "credit", "transaction_date"])
    else:
        df = pd.DataFrame(
            [
                {
                    "account_category": e.account_category,
                    "debit": float(e.debit),
                    "credit": float(e.credit),
                    "transaction_date": e.transaction_date,
                }
                for e in entries
            ]
        )

    # 4. Compute and Return Metrics formatted with Tenant Currency (₹)
    return compute_executive_metrics(df, currency_code=currency_code)


@router.get(
    "/trends",
    status_code=status.HTTP_200_OK,
    summary="Get Monthly Revenue vs Cost Trends",
)
async def get_monthly_trends_data(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
) -> List[Dict[str, Any]]:
    organization_id = str(current_user.organization_id)

    stmt = select(JournalEntry).where(JournalEntry.organization_id == organization_id)
    result = await db.execute(stmt)
    entries = result.scalars().all()

    if not entries:
        df = pd.DataFrame(columns=["account_category", "debit", "credit", "transaction_date"])
    else:
        df = pd.DataFrame(
            [
                {
                    "account_category": e.account_category,
                    "debit": float(e.debit),
                    "credit": float(e.credit),
                    "transaction_date": e.transaction_date,
                }
                for e in entries
            ]
        )

    return compute_monthly_trends(df)