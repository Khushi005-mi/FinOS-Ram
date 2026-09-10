import uuid
from typing import Any, Dict, List
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, or_
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


def _parse_uuid(val: Any, field_name: str) -> uuid.UUID:
    """Strict UUID parser. Rejects invalid input without fallbacks."""
    if isinstance(val, uuid.UUID):
        return val
    try:
        return uuid.UUID(str(val))
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid {field_name} UUID format.",
        )


@router.get(
    "/metrics",
    status_code=status.HTTP_200_OK,
    summary="Get Executive Summary KPI Metrics for Active Dataset",
)
async def get_dashboard_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
) -> Dict[str, Any]:
    org_id = _parse_uuid(current_user.organization_id, "organization_id")

    org_stmt = select(Organization).where(Organization.id == org_id)
    org_result = await db.execute(org_stmt)
    org = org_result.scalar_one_or_none()

    currency_code = getattr(org, "currency", "INR") if org else "INR"
    raw_batch_id = getattr(org, "active_batch_id", None) if org else None

    if not raw_batch_id:
        return _get_empty_metrics(currency_code)

    try:
        active_batch_uuid = uuid.UUID(str(raw_batch_id))
    except ValueError:
        active_batch_uuid = None

    # Strict multi-tenant query: journal entries MUST match authenticated caller org_id
    stmt = (
        select(JournalEntry)
        .where(
            JournalEntry.organization_id == org_id,
            or_(
                JournalEntry.upload_batch_id == active_batch_uuid,
                JournalEntry.upload_batch_id == str(raw_batch_id),
            )
        )
    )
    result = await db.execute(stmt)
    entries = result.scalars().all()

    if not entries:
        return _get_empty_metrics(currency_code)

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
    org_id = _parse_uuid(current_user.organization_id, "organization_id")

    org_stmt = select(Organization).where(Organization.id == org_id)
    org_result = await db.execute(org_stmt)
    org = org_result.scalar_one_or_none()
    raw_batch_id = getattr(org, "active_batch_id", None) if org else None

    if not raw_batch_id:
        return []

    try:
        active_batch_uuid = uuid.UUID(str(raw_batch_id))
    except ValueError:
        active_batch_uuid = None

    stmt = (
        select(JournalEntry)
        .where(
            JournalEntry.organization_id == org_id,
            or_(
                JournalEntry.upload_batch_id == active_batch_uuid,
                JournalEntry.upload_batch_id == str(raw_batch_id),
            )
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
