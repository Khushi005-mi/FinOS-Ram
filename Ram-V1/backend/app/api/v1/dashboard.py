"""
backend/app/api/v1/dashboard.py

Executive Dashboard API Endpoints:
- Dynamic KPI metrics & chronological monthly trends
- Transaction drill-down inspector for active batch auditability
"""
import uuid
from typing import Any, Dict, List, Optional
import pandas as pd
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select, or_, and_
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


def _to_uuid(val: Any) -> uuid.UUID:
    """Defensive UUID caster for PostgreSQL asyncpg queries."""
    if isinstance(val, uuid.UUID):
        return val
    try:
        return uuid.UUID(str(val))
    except Exception:
        return uuid.UUID("00000000-0000-0000-0000-000000000001")


@router.get(
    "/metrics",
    status_code=status.HTTP_200_OK,
    summary="Get Executive Summary KPI Metrics for Active Dataset",
)
async def get_dashboard_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
) -> Dict[str, Any]:
    org_id = _to_uuid(current_user.organization_id)

    org_stmt = select(Organization).where(Organization.id == org_id)
    org_result = await db.execute(org_stmt)
    org = org_result.scalar_one_or_none()

    currency_code = getattr(org, "currency", "INR") if org else "INR"
    raw_batch_id = getattr(org, "active_batch_id", None) if org else None

    # Guard clause: Return clean zero metrics if no active batch is set
    if not raw_batch_id:
        return _get_empty_metrics(currency_code)

    active_batch_uuid = _to_uuid(raw_batch_id)

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
    org_id = _to_uuid(current_user.organization_id)

    org_stmt = select(Organization).where(Organization.id == org_id)
    org_result = await db.execute(org_stmt)
    org = org_result.scalar_one_or_none()
    raw_batch_id = getattr(org, "active_batch_id", None) if org else None

    if not raw_batch_id:
        return []

    active_batch_uuid = _to_uuid(raw_batch_id)

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


@router.get(
    "/transactions",
    status_code=status.HTTP_200_OK,
    summary="Drill-down: Get transactions for active batch with search & category filter",
)
async def get_active_batch_transactions(
    category: Optional[str] = Query(None, description="Filter by category: REVENUE, COGS, OPEX, ASSET"),
    search: Optional[str] = Query(None, description="Search account name, code, or description"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
) -> Dict[str, Any]:
    """
    Returns ledger transactions strictly belonging to the active dataset.
    Computes net financial impact per row for audit drill-down views.
    """
    org_id = _to_uuid(current_user.organization_id)

    # 1. Resolve active batch pointer
    org_stmt = select(Organization).where(Organization.id == org_id)
    org = (await db.execute(org_stmt)).scalar_one_or_none()
    raw_batch_id = getattr(org, "active_batch_id", None) if org else None

    if not raw_batch_id:
        return {"total_count": 0, "transactions": [], "category": category, "active_batch_id": None}

    active_batch_uuid = _to_uuid(raw_batch_id)

    # 2. Build base query bound to active batch
    filters = [
        JournalEntry.organization_id == org_id,
        or_(
            JournalEntry.upload_batch_id == active_batch_uuid,
            JournalEntry.upload_batch_id == str(raw_batch_id),
        )
    ]

    # Category filter (e.g. user clicked on the 'COGS' card)
    if category and category.upper() != "ALL":
        filters.append(JournalEntry.account_category == category.upper())

    # Search keyword filter (searches account name or description)
    if search and search.strip():
        search_pattern = f"%{search.strip().lower()}%"
        filters.append(
            or_(
                JournalEntry.account_name.ilike(search_pattern),
                JournalEntry.account_code.ilike(search_pattern),
                JournalEntry.description.ilike(search_pattern),
            )
        )

    # 3. Query total count & paginated rows
    count_stmt = select(JournalEntry).where(and_(*filters))
    all_matching = (await db.execute(count_stmt)).scalars().all()
    total_count = len(all_matching)

    paginated_stmt = count_stmt.offset(offset).limit(limit)
    entries = (await db.execute(paginated_stmt)).scalars().all()

    # 4. Map to clean transaction payload with net impact calculations
    transactions = []
    for e in entries:
        debit = float(e.debit or 0.0)
        credit = float(e.credit or 0.0)
        cat = str(e.account_category or "OPEX").upper()

        # Net impact calculation:
        # In revenue, credit increases total. In cost/expenses, debit increases cost.
        if cat == "REVENUE":
            net_amount = credit - debit
        else:
            net_amount = debit - credit

        transactions.append({
            "id": str(e.id),
            "date": e.transaction_date.isoformat() if hasattr(e.transaction_date, "isoformat") else str(e.transaction_date),
            "account_code": e.account_code or "—",
            "account_name": e.account_name or "Unclassified Account",
            "category": cat,
            "debit": debit,
            "credit": credit,
            "net_amount": net_amount,
            "description": e.description or e.account_name,
            "reference_id": e.reference_id or "—",
        })

    return {
        "total_count": total_count,
        "active_batch_id": str(raw_batch_id),
        "category_filter": category or "ALL",
        "transactions": transactions,
    }
