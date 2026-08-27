import uuid
from typing import Any, Dict
import pandas as pd
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.journal_entry import JournalEntry
from app.engine.cogs_breakdown import compute_cogs_breakdown
from app.engine.financial_math import compute_executive_metrics, compute_monthly_trends
from app.engine.insights_generator import generate_cfo_insights


class DashboardService:
    """
    Service Layer orchestrator for executive financial dashboards.
    Executes single-pass database queries and coordinates financial math engines.
    """

    @staticmethod
    async def get_executive_overview(
        db: AsyncSession,
        organization_id: uuid.UUID,
    ) -> Dict[str, Any]:
        # 1. Execute Single Database Query for Active Tenant
        stmt = select(JournalEntry).where(JournalEntry.organization_id == organization_id)
        result = await db.execute(stmt)
        entries = result.scalars().all()

        # 2. Convert ORM Result Set to Pandas DataFrame
        if not entries:
            df = pd.DataFrame(
                columns=["account_category", "account_name", "debit", "credit", "transaction_date"]
            )
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

        # 3. Execute In-Memory Calculation Engines
        metrics = compute_executive_metrics(df)
        trends = compute_monthly_trends(df)
        cogs = compute_cogs_breakdown(df)
        insights = generate_cfo_insights(metrics, cogs)

        # 4. Return Aggregated Payload
        return {
            "metrics": metrics,
            "trends": trends,
            "cogs_breakdown": cogs,
            "insights": insights,
        }