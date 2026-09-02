"""
backend/app/engine/financial_math.py

Universal Financial Math Engine:
- Calculates Executive KPIs with Zero-Zero Mathematical Recovery Guarantee.
- Chronological Monthly Trend Aggregation.
- Dynamic COGS Tri-Breakdown.
- Automated CFO Diagnostic Insights.
"""
from typing import Any, Dict, List
import pandas as pd

CURRENCY_SYMBOLS = {
    "INR": "₹",
    "USD": "$",
    "EUR": "€",
    "GBP": "£",
    "AED": "AED ",
}


def _format_currency(amount: float, symbol: str) -> str:
    if amount < 0:
        return f"-{symbol}{abs(amount):,.0f}"
    return f"{symbol}{amount:,.0f}"


def compute_executive_metrics(df: pd.DataFrame, currency_code: str = "INR") -> Dict[str, Any]:
    symbol = CURRENCY_SYMBOLS.get(currency_code.upper(), "₹")

    if df.empty:
        return _get_empty_metrics(symbol)

    # 1. Standard Category Masking
    rev_mask = df["account_category"].astype(str).str.upper() == "REVENUE"
    cogs_mask = df["account_category"].astype(str).str.upper() == "COGS"
    opex_mask = df["account_category"].astype(str).str.upper() == "OPEX"

    total_revenue = float(df.loc[rev_mask, "credit"].sum() - df.loc[rev_mask, "debit"].sum())
    total_cogs = float(df.loc[cogs_mask, "debit"].sum() - df.loc[cogs_mask, "credit"].sum())
    total_opex = float(df.loc[opex_mask, "debit"].sum() - df.loc[opex_mask, "credit"].sum())

    total_revenue = max(0.0, total_revenue)
    total_cogs = max(0.0, total_cogs)
    total_opex = max(0.0, total_opex)

    # 2. ZERO-ZERO MATHEMATICAL RECOVERY GUARANTEE
    # If explicit categories returned 0, but dataset has non-zero credits or debits, resolve directionally
    all_credits = float(df["credit"].sum()) if "credit" in df.columns else 0.0
    all_debits = float(df["debit"].sum()) if "debit" in df.columns else 0.0

    if total_revenue == 0.0 and total_cogs == 0.0 and total_opex == 0.0:
        if all_credits > 0.0 or all_debits > 0.0:
            total_revenue = all_credits
            total_opex = all_debits

    gross_profit = total_revenue - total_cogs
    ebitda = gross_profit - total_opex

    gross_margin_pct = (
        round((gross_profit / total_revenue) * 100.0, 1) if total_revenue > 0 else 0.0
    )
    ebitda_margin_pct = (
        round((ebitda / total_revenue) * 100.0, 1) if total_revenue > 0 else 0.0
    )
    cogs_pct = (
        round((total_cogs / total_revenue) * 100.0, 1) if total_revenue > 0 else 0.0
    )

    return {
        "revenue": {
            "title": "Total Revenue",
            "value": _format_currency(total_revenue, symbol),
            "changePercentage": 0.0,
            "trend": "neutral",
            "isPositive": True,
            "description": "Active dataset total",
        },
        "cogs": {
            "title": "Cost of Goods / Sales",
            "value": _format_currency(total_cogs, symbol),
            "changePercentage": 0.0,
            "trend": "neutral",
            "isPositive": False,
            "description": f"{cogs_pct}% of total revenue",
        },
        "grossMargin": {
            "title": "Gross Margin %",
            "value": f"{gross_margin_pct:.1f}%",
            "changePercentage": 0.0,
            "trend": "neutral",
            "isPositive": gross_margin_pct >= 40.0,
            "description": "Target: 40.0% benchmark",
        },
        "ebitda": {
            "title": "Operating EBITDA",
            "value": _format_currency(ebitda, symbol),
            "changePercentage": 0.0,
            "trend": "positive" if ebitda > 0 else "negative",
            "isPositive": ebitda > 0,
            "description": f"{ebitda_margin_pct}% operating margin",
        },
        "total_revenue": total_revenue,
        "total_cogs": total_cogs,
        "total_opex": total_opex,
        "gross_profit": gross_profit,
        "gross_margin_pct": gross_margin_pct,
        "total_ebitda": ebitda,
        "ebitda_margin_pct": ebitda_margin_pct,
    }


def compute_monthly_trends(df: pd.DataFrame) -> List[Dict[str, Any]]:
    if df.empty:
        return []

    df_copy = df.copy()
    df_copy["transaction_date"] = pd.to_datetime(df_copy["transaction_date"], errors="coerce")
    df_copy = df_copy.dropna(subset=["transaction_date"])

    if df_copy.empty:
        return []

    df_copy["period_sort"] = df_copy["transaction_date"].dt.to_period("M")
    df_copy["month_label"] = df_copy["transaction_date"].dt.strftime("%b %Y")

    monthly_results: List[Dict[str, Any]] = []

    for period, group in df_copy.groupby("period_sort", sort=True):
        metrics = compute_executive_metrics(group)
        first_label = group["month_label"].iloc[0]
        monthly_results.append(
            {
                "month": str(first_label),
                "revenue": metrics["total_revenue"],
                "cogs": metrics["total_cogs"],
                "grossProfit": metrics["gross_profit"],
                "operatingMargin": metrics["gross_margin_pct"],
            }
        )

    return monthly_results


def compute_cogs_breakdown(df: pd.DataFrame, currency_code: str = "INR") -> Dict[str, Any]:
    symbol = CURRENCY_SYMBOLS.get(currency_code.upper(), "₹")

    empty_res = {
        "total_cogs": 0.0,
        "total_cogs_formatted": f"{symbol}0",
        "materials_costs": 0.0,
        "labor_costs": 0.0,
        "overhead_costs": 0.0,
        "breakdown": [
            {"category": "Direct Raw Materials", "amount": 0.0, "formatted": f"{symbol}0", "percentage": 0.0},
            {"category": "Direct Labor / Payroll", "amount": 0.0, "formatted": f"{symbol}0", "percentage": 0.0},
            {"category": "Overhead & Facilities", "amount": 0.0, "formatted": f"{symbol}0", "percentage": 0.0},
        ],
    }

    if df.empty:
        return empty_res

    cogs_mask = df["account_category"].astype(str).str.upper() == "COGS"
    cogs_df = df[cogs_mask].copy()

    if cogs_df.empty:
        return empty_res

    cogs_df["net_cost"] = (cogs_df["debit"].fillna(0.0) - cogs_df["credit"].fillna(0.0)).clip(lower=0.0)
    total_cogs = float(cogs_df["net_cost"].sum())

    materials_total = 0.0
    labor_total = 0.0
    overhead_total = 0.0

    for _, row in cogs_df.iterrows():
        name = str(row.get("account_name", "")).lower()
        desc = str(row.get("description", "")).lower()
        text = f"{name} {desc}"
        cost = float(row["net_cost"])

        if any(k in text for k in ["labor", "labour", "wages", "worker", "contractor", "assembly", "support"]):
            labor_total += cost
        elif any(k in text for k in ["cloud", "hosting", "aws", "server", "overhead", "facility", "power", "utility", "devops"]):
            overhead_total += cost
        else:
            materials_total += cost

    mat_pct = round((materials_total / total_cogs) * 100.0, 1) if total_cogs > 0 else 0.0
    lab_pct = round((labor_total / total_cogs) * 100.0, 1) if total_cogs > 0 else 0.0
    ovh_pct = round((overhead_total / total_cogs) * 100.0, 1) if total_cogs > 0 else 0.0

    return {
        "total_cogs": total_cogs,
        "total_cogs_formatted": _format_currency(total_cogs, symbol),
        "materials_costs": materials_total,
        "labor_costs": labor_total,
        "overhead_costs": overhead_total,
        "breakdown": [
            {
                "category": "Direct Raw Materials",
                "amount": materials_total,
                "formatted": _format_currency(materials_total, symbol),
                "percentage": mat_pct,
            },
            {
                "category": "Direct Labor / Payroll",
                "amount": labor_total,
                "formatted": _format_currency(labor_total, symbol),
                "percentage": lab_pct,
            },
            {
                "category": "Overhead & Facilities",
                "amount": overhead_total,
                "formatted": _format_currency(overhead_total, symbol),
                "percentage": ovh_pct,
            },
        ],
    }


def generate_cfo_insights(df: pd.DataFrame) -> List[Dict[str, Any]]:
    if df.empty:
        return []

    metrics = compute_executive_metrics(df)
    rev = metrics["total_revenue"]
    margin = metrics["gross_margin_pct"]
    ebitda = metrics["total_ebitda"]
    cogs_info = compute_cogs_breakdown(df)

    insights: List[Dict[str, Any]] = []

    if margin >= 70.0:
        insights.append({
            "type": "positive",
            "title": "Exceptional Gross Margin",
            "message": f"Gross margin stands at {margin:.1f}%, indicating strong unit economics.",
        })
    elif margin < 30.0 and rev > 0:
        insights.append({
            "type": "warning",
            "title": "Compressed Gross Margin",
            "message": f"Gross margin of {margin:.1f}% is below healthy thresholds. Review supplier costs.",
        })

    if ebitda < 0:
        insights.append({
            "type": "negative",
            "title": "Operating Loss (Burn)",
            "message": f"Operating EBITDA is {metrics['ebitda']['value']}, indicating operational cash burn.",
        })
    elif ebitda > 0:
        insights.append({
            "type": "positive",
            "title": "Profitable Operations",
            "message": f"Positive EBITDA of {metrics['ebitda']['value']} with {metrics['ebitda_margin_pct']}% operating margin.",
        })

    active_drivers = [d for d in cogs_info["breakdown"] if d["amount"] > 0]
    if active_drivers:
        top_driver = max(active_drivers, key=lambda x: x["amount"])
        insights.append({
            "type": "info",
            "title": f"Primary Cost Driver: {top_driver['category']}",
            "message": f"{top_driver['category']} accounts for {top_driver['percentage']}% of total COGS ({top_driver['formatted']}).",
        })

    return insights


def _get_empty_metrics(symbol: str = "₹") -> Dict[str, Any]:
    return {
        "revenue": { "title": "Total Revenue", "value": f"{symbol}0", "changePercentage": 0.0, "trend": "neutral", "isPositive": True, "description": "No data recorded" },
        "cogs": { "title": "Cost of Goods / Sales", "value": f"{symbol}0", "changePercentage": 0.0, "trend": "neutral", "isPositive": False, "description": "0% of revenue" },
        "grossMargin": { "title": "Gross Margin %", "value": "0.0%", "changePercentage": 0.0, "trend": "neutral", "isPositive": False, "description": "Target: 40.0% benchmark" },
        "ebitda": { "title": "Operating EBITDA", "value": f"{symbol}0", "changePercentage": 0.0, "trend": "neutral", "isPositive": False, "description": "0% operating margin" },
        "total_revenue": 0.0,
        "total_cogs": 0.0,
        "total_opex": 0.0,
        "gross_profit": 0.0,
        "gross_margin_pct": 0.0,
        "total_ebitda": 0.0,
        "ebitda_margin_pct": 0.0,
    }
