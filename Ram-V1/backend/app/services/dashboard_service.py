"""
backend/app/services/dashboard_service.py

Service Layer orchestrator for executive financial analytics.
Guarantees strict active dataset scoping with zero historical cross-batch leakage.
"""
import uuid
from typing import Any, Dict, List
import pandas as pd
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.journal_entry import JournalEntry
from app.db.models.organization import Organization
from app.engine.financial_math import (
    compute_cogs_breakdown,
    generate_cfo_insights,
)


class DashboardService:
    @staticmethod
    async def get_active_batch_dataframe(
        db: AsyncSession,
        organization_id: str,
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

        # 1. Fetch organization to get the active batch pointer
        org_stmt = select(Organization).where(Organization.id == str(organization_id))
        org_result = await db.execute(org_stmt)
        org = org_result.scalar_one_or_none()

        if not org or not org.active_batch_id:
            return pd.DataFrame(columns=canonical_columns)

        # 2. Query entries strictly matching active_batch_id
        entry_stmt = (
            select(JournalEntry)
            .where(
                JournalEntry.organization_id == str(organization_id),
                JournalEntry.upload_batch_id == str(org.active_batch_id),
            )
        )
        entry_result = await db.execute(entry_stmt)
        entries = entry_result.scalars().all()

        if not entries:
            return pd.DataFrame(columns=canonical_columns)

        # 3. Convert ORM rows to Pandas DataFrame
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
        organization_id: str,
    ) -> Dict[str, Any]:
        """Calculates COGS breakdown strictly for the active batch."""
        df = await cls.get_active_batch_dataframe(db, organization_id)
        return compute_cogs_breakdown(df)

    @classmethod
    async def get_cfo_insights(
        cls,
        db: AsyncSession,
        organization_id: str,
    ) -> List[Dict[str, Any]]:
        """Generates automated CFO insights strictly for the active batch."""
        df = await cls.get_active_batch_dataframe(db, organization_id)
        return generate_cfo_insights(df)
