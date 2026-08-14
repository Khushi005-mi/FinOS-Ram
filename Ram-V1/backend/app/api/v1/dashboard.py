import uuid
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
    summary="Get Executive Summary KPI Metrics for Active Dataset",
)
async def get_dashboard_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
) -> Dict[str, Any]:
    try:
        org_uuid = uuid.UUID(current_user.organization_id)
    except (ValueError, TypeError):
        org_uuid = uuid.UUID("00000000-0000-0000-0000-000000000001")

    # 1. Fetch Tenant Profile & Active Batch ID
    org_stmt = select(Organization).where(Organization.id == org_uuid)
    org_result = await db.execute(org_stmt)
    org = org_result.scalar_one_or_none()
    currency_code = getattr(org, "currency", "INR") if org else "INR"
    active_batch_id = getattr(org, "active_batch_id", None) if org else None

    # 2. Query Journal Entries ISOLATED TO ACTIVE BATCH!
    stmt = select(JournalEntry).where(JournalEntry.organization_id == str(org_uuid))

    if active_batch_id:
        stmt = stmt.where(JournalEntry.upload_batch_id == str(active_batch_id))

    result = await db.execute(stmt)
    entries = result.scalars().all()

    # Fallback to all tenant entries if no active batch filter match
    if not entries and active_batch_id:
        fallback_stmt = select(JournalEntry).where(JournalEntry.organization_id == str(org_uuid))
        result = await db.execute(fallback_stmt)
        entries = result.scalars().all()

    # 3. Convert ORM Result Set to Pandas DataFrame
    if not entries:
        df = pd.DataFrame(columns=["account_category", "account_name", "debit", "credit", "transaction_date"])
    else:
        df = pd.DataFrame(
            [
                {
                    "account_category": e.account_category,
                    "account_name": e.account_name,
                    "debit": float(e.debit),
                    "credit": float(e.credit),
                    "transaction_date": e.transaction_date,
                }
                for e in entries
            ]
        )

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
    try:
        org_uuid = uuid.UUID(current_user.organization_id)
    except (ValueError, TypeError):
        org_uuid = uuid.UUID("00000000-0000-0000-0000-000000000001")

    org_stmt = select(Organization).where(Organization.id == org_uuid)
    org_result = await db.execute(org_stmt)
    org = org_result.scalar_one_or_none()
    active_batch_id = getattr(org, "active_batch_id", None) if org else None

    stmt = select(JournalEntry).where(JournalEntry.organization_id == str(org_uuid))
    if active_batch_id:
        stmt = stmt.where(JournalEntry.upload_batch_id == str(active_batch_id))

    result = await db.execute(stmt)
    entries = result.scalars().all()

    if not entries and active_batch_id:
        fallback_stmt = select(JournalEntry).where(JournalEntry.organization_id == str(org_uuid))
        result = await db.execute(fallback_stmt)
        entries = result.scalars().all()

    if not entries:
        df = pd.DataFrame(columns=["account_category", "account_name", "debit", "credit", "transaction_date"])
    else:
        df = pd.DataFrame(
            [
                {
                    "account_category": e.account_category,
                    "account_name": e.account_name,
                    "debit": float(e.debit),
                    "credit": float(e.credit),
                    "transaction_date": e.transaction_date,
                }
                for e in entries
            ]
        )

    return compute_monthly_trends(df)