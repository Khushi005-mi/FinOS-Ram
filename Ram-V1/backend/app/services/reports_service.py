import uuid
from typing import Any, Dict, List, Optional
import pandas as pd
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.journal_entry import JournalEntry
from app.db.models.organization import Organization


class ReportsService:
    @staticmethod
    async def _get_active_df(
        db: AsyncSession,
        organization_id: uuid.UUID,
    ) -> tuple[Optional[Organization], pd.DataFrame]:
        org_stmt = select(Organization).where(Organization.id == organization_id)
        org_result = await db.execute(org_stmt)
        org = org_result.scalar_one_or_none()

        if not org or not org.active_batch_id:
            return org, pd.DataFrame()

        try:
            batch_uuid = uuid.UUID(str(org.active_batch_id))
        except ValueError:
            batch_uuid = None

        stmt = (
            select(JournalEntry)
            .where(
                JournalEntry.organization_id == organization_id,
                or_(
                    JournalEntry.upload_batch_id == batch_uuid,
                    JournalEntry.upload_batch_id == str(org.active_batch_id),
                )
            )
        )
        result = await db.execute(stmt)
        entries = result.scalars().all()

        if not entries:
            return org, pd.DataFrame()

        df = pd.DataFrame(
            [
                {
                    "account_code": e.account_code or "",
                    "account_name": e.account_name,
                    "account_category": str(e.account_category).upper(),
                    "debit": float(e.debit or 0.0),
                    "credit": float(e.credit or 0.0),
                }
                for e in entries
            ]
        )
        return org, df

    @staticmethod
    async def generate_income_statement(
        db: AsyncSession,
        organization_id: uuid.UUID,
        period_name: str = "Active Dataset Period",
    ) -> Dict[str, Any]:
        org, df = await ReportsService._get_active_df(db, organization_id)
        org_name = org.name if org else "FinOS Enterprise Workspace"
        currency = org.currency if org else "USD"

        if df.empty:
            return _get_empty_income_statement(org_name, period_name, currency)

        revenue_items = _extract_line_items(df, ["REVENUE", "SALES", "INCOME"], is_credit_normal=True)
        cogs_items = _extract_line_items(df, ["COGS", "DIRECT_COST"], is_credit_normal=False)
        opex_items = _extract_line_items(df, ["OPEX", "OPERATING_EXPENSE"], is_credit_normal=False)

        total_revenue = round(sum(item["amount"] for item in revenue_items), 2)
        total_cogs = round(sum(item["amount"] for item in cogs_items), 2)
        gross_profit = round(total_revenue - total_cogs, 2)
        total_opex = round(sum(item["amount"] for item in opex_items), 2)
        net_income = round(gross_profit - total_opex, 2)

        return {
            "organizationName": org_name,
            "periodName": period_name,
            "currency": currency,
            "revenue": revenue_items,
            "costOfSales": cogs_items,
            "operatingExpenses": opex_items,
            "totalRevenue": total_revenue,
            "totalCostOfSales": total_cogs,
            "grossProfit": gross_profit,
            "totalOperatingExpenses": total_opex,
            "netIncome": net_income,
            "organization_name": org_name,
            "period_name": period_name,
            "cost_of_sales": cogs_items,
            "operating_expenses": opex_items,
            "total_revenue": total_revenue,
            "total_cost_of_sales": total_cogs,
            "gross_profit": gross_profit,
            "total_operating_expenses": total_opex,
            "net_income": net_income,
        }

    @staticmethod
    async def generate_balance_sheet(
        db: AsyncSession,
        organization_id: uuid.UUID,
        period_name: str = "As of Active Dataset Date",
    ) -> Dict[str, Any]:
        org, df = await ReportsService._get_active_df(db, organization_id)
        org_name = org.name if org else "FinOS Enterprise Workspace"
        currency = org.currency if org else "USD"

        if df.empty:
            return {
                "organizationName": org_name,
                "currency": currency,
                "assets": [],
                "liabilities": [],
                "equity": [],
                "totalAssets": 0.0,
                "totalLiabilities": 0.0,
                "totalEquity": 0.0,
            }

        asset_items = _extract_line_items(df, ["ASSET", "CASH", "BANK", "ACCOUNTS_RECEIVABLE", "INVENTORY"], is_credit_normal=False)
        liability_items = _extract_line_items(df, ["LIABILITY", "ACCOUNTS_PAYABLE", "LOAN"], is_credit_normal=True)
        equity_items = _extract_line_items(df, ["EQUITY", "RETAINED_EARNINGS", "CAPITAL"], is_credit_normal=True)

        total_assets = round(sum(item["amount"] for item in asset_items), 2)
        total_liabilities = round(sum(item["amount"] for item in liability_items), 2)
        total_equity = round(sum(item["amount"] for item in equity_items), 2)

        return {
            "organizationName": org_name,
            "periodName": period_name,
            "currency": currency,
            "assets": asset_items,
            "liabilities": liability_items,
            "equity": equity_items,
            "totalAssets": total_assets,
            "totalLiabilities": total_liabilities,
            "totalEquity": total_equity,
            "totalLiabilitiesAndEquity": round(total_liabilities + total_equity, 2),
        }

    @staticmethod
    async def generate_cash_flow(
        db: AsyncSession,
        organization_id: uuid.UUID,
        period_name: str = "Active Dataset Period",
    ) -> Dict[str, Any]:
        """
        True GAAP Indirect Cash Flow Statement Engine:
        Starts with Net Income, adjusts for Non-Cash Depreciation,
        and factors Working Capital balance sheet account activity.
        """
        org, df = await ReportsService._get_active_df(db, organization_id)
        org_name = org.name if org else "FinOS Enterprise Workspace"
        currency = org.currency if org else "USD"

        CURRENCY_SYMBOLS = {
            "USD": "$", "INR": "₹", "EUR": "€", "GBP": "£",
            "AED": "AED ", "CAD": "CA$", "AUD": "A$", "JPY": "¥"
        }
        symbol = CURRENCY_SYMBOLS.get(str(currency).upper(), "$")

        if df.empty:
            return {
                "organizationName": org_name,
                "currency": currency,
                "items": [],
                "net_cash_flow": 0.0,
            }

        # 1. Compute P&L Base
        revenue_items = _extract_line_items(df, ["REVENUE", "SALES", "INCOME"], is_credit_normal=True)
        cogs_items = _extract_line_items(df, ["COGS", "DIRECT_COST"], is_credit_normal=False)
        opex_items = _extract_line_items(df, ["OPEX", "OPERATING_EXPENSE"], is_credit_normal=False)

        total_revenue = sum(item["amount"] for item in revenue_items)
        total_cogs = sum(item["amount"] for item in cogs_items)
        total_opex = sum(item["amount"] for item in opex_items)
        net_income = round(total_revenue - (total_cogs + total_opex), 2)

        # 2. Extract Non-Cash Depreciation & Amortization
        deprec_df = df[df["account_name"].str.contains(r"depreciation|amortization", case=False, na=False)]
        depreciation_addback = round(float(deprec_df["debit"].sum() - deprec_df["credit"].sum()), 2) if not deprec_df.empty else 0.0

        # 3. Working Capital Ledger Adjustments (Assets vs Liabilities)
        # In double-entry: Increase in AR = Debit balance increase -> Decreases Cash
        ar_df = df[df["account_name"].str.contains(r"receivable|debtor", case=False, na=False)]
        ar_change = round(float(ar_df["debit"].sum() - ar_df["credit"].sum()), 2) if not ar_df.empty else 0.0

        # Increase in AP = Credit balance increase -> Conserves / Increases Cash
        ap_df = df[df["account_name"].str.contains(r"payable|creditor|vendor", case=False, na=False)]
        ap_change = round(float(ap_df["credit"].sum() - ap_df["debit"].sum()), 2) if not ap_df.empty else 0.0

        # Net Operating Cash Flow calculation
        net_operating_cash = round(net_income + depreciation_addback - ar_change + ap_change, 2)

        # 4. Construct Authentic GAAP Line Items
        items: List[Dict[str, Any]] = [
            {
                "name": "1. Net Operating Income (Base from Audited P&L)",
                "amount": net_income,
                "formatted": f"{symbol}{net_income:,.2f}",
                "is_header": True,
            },
        ]

        if depreciation_addback != 0.0:
            items.append({
                "name": "  + Non-Cash Depreciation & Amortization Addback",
                "amount": depreciation_addback,
                "formatted": f"+{symbol}{depreciation_addback:,.2f}",
            })

        if ar_change != 0.0:
            items.append({
                "name": "  - Net Change in Accounts Receivable (Uncollected Revenue)",
                "amount": -ar_change,
                "formatted": f"-{symbol}{ar_change:,.2f}" if ar_change > 0 else f"+{symbol}{abs(ar_change):,.2f}",
            })

        if ap_change != 0.0:
            items.append({
                "name": "  + Net Change in Accounts Payable (Deferred Vendor Outflows)",
                "amount": ap_change,
                "formatted": f"+{symbol}{ap_change:,.2f}" if ap_change > 0 else f"-{symbol}{abs(ap_change):,.2f}",
            })

        items.append({
            "name": "Total Cash Flow from Operating Activities",
            "amount": net_operating_cash,
            "formatted": f"{symbol}{net_operating_cash:,.2f}",
            "is_total": True,
        })

        # Check for CapEx / Investing Activities
        capex_df = df[df["account_name"].str.contains(r"machinery|equipment|plant|asset purchase", case=False, na=False)]
        capex_outflow = round(float(capex_df["debit"].sum() - capex_df["credit"].sum()), 2) if not capex_df.empty else 0.0

        if capex_outflow != 0.0:
            items.append({
                "name": "2. Cash Flow from Investing Activities (CapEx & Equipment)",
                "amount": -capex_outflow,
                "formatted": f"-{symbol}{capex_outflow:,.2f}",
            })

        total_net_cash_flow = round(net_operating_cash - capex_outflow, 2)

        items.append({
            "name": "Net Increase / (Decrease) in Cash & Cash Equivalents",
            "amount": total_net_cash_flow,
            "formatted": f"{symbol}{total_net_cash_flow:,.2f}",
            "is_total": True,
        })

        return {
            "organizationName": org_name,
            "periodName": period_name,
            "currency": currency,
            "items": items,
            "netOperatingCashFlow": net_operating_cash,
            "netCashFlow": total_net_cash_flow,
        }


def _extract_line_items(
    df: pd.DataFrame,
    categories: List[str],
    is_credit_normal: bool,
) -> List[Dict[str, Any]]:
    cat_upper = [c.upper() for c in categories]
    filtered_df = df[df["account_category"].isin(cat_upper)]
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
                "accountCode": str(code) if code else f"ACC-{idx+1:04d}",
                "accountName": str(name),
                "amount": round(net_amount, 2),
                "isHeader": False,
                "isTotal": False,
            }
        )

    return line_items


def _get_empty_income_statement(org_name: str, period_name: str, currency: str) -> Dict[str, Any]:
    return {
        "organizationName": org_name,
        "periodName": period_name,
        "currency": currency,
        "revenue": [],
        "costOfSales": [],
        "operatingExpenses": [],
        "totalRevenue": 0.0,
        "totalCostOfSales": 0.0,
        "grossProfit": 0.0,
        "totalOperatingExpenses": 0.0,
        "netIncome": 0.0,
    }
