"""
backend/app/api/v1/dashboard.py

Executive Dashboard API Endpoints:
Strictly isolated to the active dataset (Organization.active_batch_id).
No historical data accumulation fallback.
"""
from typing import Any, Dict, List
import pandas as pd
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import TokenData, get_current_tenant_user
from app.db.models.journal_entry import JournalEntry
from app.db.models.organization import Organization
from app.db.session import get_db
from app.engine.financial_math import (
    compute_executive_metrics,
    compute_monthly_trends,
    _get_empty_metrics,
)

router = APIRouter(prefix="/dashboard", tags=["Executive Dashboard"])


@router.get(
    "/metrics",
    status_code=status.HTTP_200_OK,
    summary="Get Executive Summary KPI Metrics for Active Dataset",
)
async def get_dashboard_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
) -> Dict[str, Any]:
    organization_id = str(current_user.organization_id)

    # 1. Fetch Tenant Profile & Active Batch ID
    org_stmt = select(Organization).where(Organization.id == organization_id)
    org_result = await db.execute(org_stmt)
    org = org_result.scalar_one_or_none()

    currency_code = getattr(org, "currency", "INR") if org else "INR"
    active_batch_id = getattr(org, "active_batch_id", None) if org else None

    # If no active batch is set, return clean zero metrics immediately
    if not active_batch_id:
        return _get_empty_metrics(currency_code)

    # 2. Query Journal Entries strictly isolated to active_batch_id
    stmt = (
        select(JournalEntry)
        .where(
            JournalEntry.organization_id == organization_id,
            JournalEntry.upload_batch_id == str(active_batch_id),
        )
    )
    result = await db.execute(stmt)
    entries = result.scalars().all()

    if not entries:
        return _get_empty_metrics(currency_code)

    # 3. Convert ORM Result Set to Pandas DataFrame
    df = pd.DataFrame(
        [
            {
                "account_category": e.account_category,
                "account_name": e.account_name,
                "debit": float(e.debit or 0.0),
                "credit": float(e.credit or 0.0),
                "transaction_date": e.transaction_date,
            }
            for e in entries
        ]
    )

    # 4. Compute Metrics strictly for active batch
    return compute_executive_metrics(df, currency_code=currency_code)


@router.get(
    "/trends",
    status_code=status.HTTP_200_OK,
    summary="Get Monthly Revenue vs Cost Trends for Active Dataset",
)
async def get_monthly_trends_data(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
) -> List[Dict[str, Any]]:
    organization_id = str(current_user.organization_id)

    org_stmt = select(Organization).where(Organization.id == organization_id)
    org_result = await db.execute(org_stmt)
    org = org_result.scalar_one_or_none()
    active_batch_id = getattr(org, "active_batch_id", None) if org else None

    if not active_batch_id:
        return []

    # Query strictly isolated to active_batch_id
    stmt = (
        select(JournalEntry)
        .where(
            JournalEntry.organization_id == organization_id,
            JournalEntry.upload_batch_id == str(active_batch_id),
        )
    )
    result = await db.execute(stmt)
    entries = result.scalars().all()

    if not entries:
        return []

    df = pd.DataFrame(
        [
            {
                "account_category": e.account_category,
                "account_name": e.account_name,
                "debit": float(e.debit or 0.0),
                "credit": float(e.credit or 0.0),
                "transaction_date": e.transaction_date,
            }
            for e in entries
        ]
    )

    return compute_monthly_trends(df)
