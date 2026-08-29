"""
backend/app/services/dashboard_service.py
"""
import uuid
from typing import Any, Dict, List
import pandas as pd
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.journal_entry import JournalEntry
from app.db.models.organization import Organization
from app.engine.financial_math import (
    compute_cogs_breakdown,
    generate_cfo_insights,
)


def _to_uuid(val: Any) -> uuid.UUID:
    if isinstance(val, uuid.UUID):
        return val
    try:
        return uuid.UUID(str(val))
    except Exception:
        return uuid.UUID("00000000-0000-0000-0000-000000000001")


class DashboardService:
    @staticmethod
    async def get_active_batch_dataframe(
        db: AsyncSession,
        organization_id: Any,
    ) -> pd.DataFrame:
        canonical_columns = [
            "account_category",
            "account_name",
            "account_code",
            "debit",
            "credit",
            "transaction_date",
            "description",
        ]

        org_uuid = _to_uuid(organization_id)

        org_stmt = select(Organization).where(Organization.id == org_uuid)
        org_result = await db.execute(org_stmt)
        org = org_result.scalar_one_or_none()

        if not org or not org.active_batch_id:
            return pd.DataFrame(columns=canonical_columns)

        raw_batch = org.active_batch_id
        batch_uuid = _to_uuid(raw_batch)

        entry_stmt = (
            select(JournalEntry)
            .where(
                JournalEntry.organization_id == org_uuid,
                or_(
                    JournalEntry.upload_batch_id == batch_uuid,
                    JournalEntry.upload_batch_id == str(raw_batch),
                )
            )
        )
        entry_result = await db.execute(entry_stmt)
        entries = entry_result.scalars().all()

        if not entries:
            return pd.DataFrame(columns=canonical_columns)

        records = [
            {
                "account_category": str(e.account_category or "OPEX"),
                "account_name": str(e.account_name or "General Account"),
                "account_code": str(e.account_code or ""),
                "debit": float(e.debit or 0.0),
                "credit": float(e.credit or 0.0),
                "transaction_date": e.transaction_date,
                "description": str(e.description or e.account_name or ""),
            }
            for e in entries
        ]
        return pd.DataFrame(records)

    @classmethod
    async def get_cogs_breakdown(
        cls,
        db: AsyncSession,
        organization_id: Any,
    ) -> Dict[str, Any]:
        df = await cls.get_active_batch_dataframe(db, organization_id)
        return compute_cogs_breakdown(df)

    @classmethod
    async def get_cfo_insights(
        cls,
        db: AsyncSession,
        organization_id: Any,
    ) -> List[Dict[str, Any]]:
        df = await cls.get_active_batch_dataframe(db, organization_id)
        return generate_cfo_insights(df)
