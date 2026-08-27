import uuid
from typing import Any, Dict, List
import pandas as pd
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.journal_entry import JournalEntry
from app.db.models.organization import Organization


class ReportsService:
    @staticmethod
    async def generate_income_statement(
        db: AsyncSession,
        organization_id: uuid.UUID,
        period_name: str = "Q1 2024 (Jan - Mar)",
    ) -> Dict[str, Any]:
        org_stmt = select(Organization).where(Organization.id == organization_id)
        org_result = await db.execute(org_stmt)
        org = org_result.scalar_one_or_none()
        org_name = org.name if org else "FinOS Enterprise Workspace"
        currency = org.currency if org else "USD"

        stmt = select(JournalEntry).where(JournalEntry.organization_id == organization_id)
        result = await db.execute(stmt)
        entries = result.scalars().all()

        if not entries:
            return _get_empty_income_statement(org_name, period_name, currency)

        df = pd.DataFrame(
            [
                {
                    "account_code": e.account_code or "",
                    "account_name": e.account_name,
                    "account_category": e.account_category.upper(),
                    "debit": float(e.debit),
                    "credit": float(e.credit),
                }
                for e in entries
            ]
        )

        revenue_items = _extract_line_items(df, "REVENUE", is_credit_normal=True)
        cogs_items = _extract_line_items(df, "COGS", is_credit_normal=False)
        opex_items = _extract_line_items(df, "OPEX", is_credit_normal=False)

        total_revenue = round(sum(item["amount"] for item in revenue_items), 2)
        total_cogs = round(sum(item["amount"] for item in cogs_items), 2)
        gross_profit = round(total_revenue - total_cogs, 2)
        total_opex = round(sum(item["amount"] for item in opex_items), 2)
        net_income = round(gross_profit - total_opex, 2)

        return {
            "organization_name": org_name,
            "period_name": period_name,
            "currency": currency,
            "revenue": revenue_items,
            "cost_of_sales": cogs_items,
            "operating_expenses": opex_items,
            "total_revenue": total_revenue,
            "total_cost_of_sales": total_cogs,
            "gross_profit": gross_profit,
            "total_operating_expenses": total_opex,
            "net_income": net_income,
        }


def _extract_line_items(
    df: pd.DataFrame,
    category: str,
    is_credit_normal: bool,
) -> List[Dict[str, Any]]:
    filtered_df = df[df["account_category"] == category]
    if filtered_df.empty:
        return []

    line_items: List[Dict[str, Any]] = []
    grouped = filtered_df.groupby(["account_code", "account_name"], dropna=False)

    for idx, ((code, name), group) in enumerate(grouped):
        if is_credit_normal:
            net_amount = float(group["credit"].sum() - group["debit"].sum())
        else:
            net_amount = float(group["debit"].sum() - group["credit"].sum())

        line_items.append(
            {
                "id": str(idx + 1),
                "accountCode": str(code) if code else None,
                "accountName": str(name),
                "amount": round(net_amount, 2),
                "isHeader": False,
                "isTotal": False,
            }
        )

    return line_items


def _get_empty_income_statement(org_name: str, period_name: str, currency: str) -> Dict[str, Any]:
    return {
        "organization_name": org_name,
        "period_name": period_name,
        "currency": currency,
        "revenue": [],
        "cost_of_sales": [],
        "operating_expenses": [],
        "total_revenue": 0.0,
        "total_cost_of_sales": 0.0,
        "gross_profit": 0.0,
        "total_operating_expenses": 0.0,
        "net_income": 0.0,
    }