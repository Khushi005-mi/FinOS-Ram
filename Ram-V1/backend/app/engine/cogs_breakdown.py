from typing import Any, Dict
import pandas as pd


def compute_cogs_breakdown(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Sub-classifies COGS into Direct Materials, Direct Labor, and Factory Overhead
    using vectorized keyword token matching.
    """
    if df.empty:
        return _get_empty_cogs_breakdown()

    # 1. Filter COGS rows
    cogs_mask = df["account_category"].str.upper() == "COGS"
    cogs_df = df[cogs_mask].copy()

    if cogs_df.empty:
        return _get_empty_cogs_breakdown()

    # 2. Compute Total COGS (Debits - Credits)
    total_cogs = float((cogs_df["debit"] - cogs_df["credit"]).sum())
    total_cogs = max(0.0, total_cogs)

    if total_cogs == 0.0:
        return _get_empty_cogs_breakdown()

    # 3. Define Keyword Search Patterns
    labor_keywords = ["labor", "wage", "operator", "assembly", "factory payroll", "payroll"]
    overhead_keywords = ["utility", "electricity", "depreciation", "plant rent", "factory rent", "maintenance"]

    labor_pattern = "|".join(labor_keywords)
    overhead_pattern = "|".join(overhead_keywords)

    # 4. Vectorized Sub-Classification
    account_names_lower = cogs_df["account_name"].astype(str).str.lower()

    labor_mask = account_names_lower.str.contains(labor_pattern, regex=True, na=False)
    overhead_mask = account_names_lower.str.contains(overhead_pattern, regex=True, na=False)

    direct_labor = float((cogs_df.loc[labor_mask, "debit"] - cogs_df.loc[labor_mask, "credit"]).sum())
    factory_overhead = float((cogs_df.loc[overhead_mask, "debit"] - cogs_df.loc[overhead_mask, "credit"]).sum())

    direct_labor = max(0.0, direct_labor)
    factory_overhead = max(0.0, factory_overhead)

    # 5. Direct Materials = Remaining COGS
    direct_materials = max(0.0, total_cogs - (direct_labor + factory_overhead))

    # 6. Compute Safe Percentages
    materials_pct = round((direct_materials / total_cogs) * 100.0, 1) if total_cogs > 0 else 0.0
    labor_pct = round((direct_labor / total_cogs) * 100.0, 1) if total_cogs > 0 else 0.0
    overhead_pct = round((factory_overhead / total_cogs) * 100.0, 1) if total_cogs > 0 else 0.0

    return {
        "total_cogs": round(total_cogs, 2),
        "direct_materials": round(direct_materials, 2),
        "direct_materials_pct": materials_pct,
        "direct_labor": round(direct_labor, 2),
        "direct_labor_pct": labor_pct,
        "factory_overhead": round(factory_overhead, 2),
        "factory_overhead_pct": overhead_pct,
    }


def _get_empty_cogs_breakdown() -> Dict[str, Any]:
    return {
        "total_cogs": 0.0,
        "direct_materials": 0.0,
        "direct_materials_pct": 0.0,
        "direct_labor": 0.0,
        "direct_labor_pct": 0.0,
        "factory_overhead": 0.0,
        "factory_overhead_pct": 0.0,
    }