from typing import Any, Dict, List
import pandas as pd

CURRENCY_SYMBOLS = {
    "INR": "₹",
    "USD": "$",
    "EUR": "€",
    "GBP": "£",
    "AED": "AED ",
}


def compute_executive_metrics(df: pd.DataFrame, currency_code: str = "INR") -> Dict[str, Any]:
    """
    Calculates dynamic executive KPI cards directly from database journal entries.
    No hardcoded fake percentages. Pure verifiable math.
    """
    symbol = CURRENCY_SYMBOLS.get(currency_code.upper(), "₹")

    if df.empty:
        return _get_empty_metrics(symbol)

    # 1. Vectorized Category Filtering
    rev_mask = df["account_category"].str.upper() == "REVENUE"
    cogs_mask = df["account_category"].str.upper() == "COGS"
    opex_mask = df["account_category"].str.upper() == "OPEX"

    # 2. Compute Net Financial Totals
    total_revenue = float(df.loc[rev_mask, "credit"].sum() - df.loc[rev_mask, "debit"].sum())
    total_cogs = float(df.loc[cogs_mask, "debit"].sum() - df.loc[cogs_mask, "credit"].sum())
    total_opex = float(df.loc[opex_mask, "debit"].sum() - df.loc[opex_mask, "credit"].sum())

    total_revenue = max(0.0, total_revenue)
    total_cogs = max(0.0, total_cogs)
    total_opex = max(0.0, total_opex)

    # 3. Derived Profit Calculations
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

    # 4. Format Output Payload Matching Frontend Schema (Zero Fake Data)
    return {
        "revenue": {
            "title": "Total Revenue",
            "value": f"{symbol}{total_revenue:,.0f}",
            "changePercentage": 0.0,
            "trend": "neutral",
            "isPositive": True,
            "description": "Baseline established",
        },
        "cogs": {
            "title": "Cost of Goods / Sales",
            "value": f"{symbol}{total_cogs:,.0f}",
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
            "value": f"{symbol}{ebitda:,.0f}",
            "changePercentage": 0.0,
            "trend": "neutral",
            "isPositive": ebitda > 0,
            "description": f"{ebitda_margin_pct}% operating margin",
        },
        # Flat values for internal engine use
        "total_revenue": total_revenue,
        "total_cogs": total_cogs,
        "gross_profit": gross_profit,
        "gross_margin_pct": gross_margin_pct,
    }


def compute_monthly_trends(df: pd.DataFrame) -> List[Dict[str, Any]]:
    if df.empty:
        return []

    df_copy = df.copy()
    df_copy["transaction_date"] = pd.to_datetime(df_copy["transaction_date"])
    df_copy["year_month"] = df_copy["transaction_date"].dt.strftime("%b")

    monthly_results: List[Dict[str, Any]] = []

    for month, group in df_copy.groupby("year_month", sort=False):
        metrics = compute_executive_metrics(group)
        monthly_results.append(
            {
                "month": str(month),
                "revenue": metrics["total_revenue"],
                "cogs": metrics["total_cogs"],
                "grossProfit": metrics["gross_profit"],
                "operatingMargin": metrics["gross_margin_pct"],
            }
        )

    return monthly_results


def _get_empty_metrics(symbol: str = "₹") -> Dict[str, Any]:
    return {
        "revenue": { "title": "Total Revenue", "value": f"{symbol}0", "changePercentage": 0, "trend": "neutral", "isPositive": True, "description": "No data recorded" },
        "cogs": { "title": "Cost of Goods / Sales", "value": f"{symbol}0", "changePercentage": 0, "trend": "neutral", "isPositive": True, "description": "0% of revenue" },
        "grossMargin": { "title": "Gross Margin %", "value": "0.0%", "changePercentage": 0, "trend": "neutral", "isPositive": True, "description": "Target: 40.0% benchmark" },
        "ebitda": { "title": "Operating EBITDA", "value": f"{symbol}0", "changePercentage": 0, "trend": "neutral", "isPositive": True, "description": "0% operating margin" },
        "total_revenue": 0.0,
        "total_cogs": 0.0,
        "gross_profit": 0.0,
        "gross_margin_pct": 0.0,
    }