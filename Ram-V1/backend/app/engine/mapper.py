import re
from decimal import Decimal
from typing import Dict, List, Optional
import pandas as pd

CANONICAL_FIELDS = [
    "transaction_date",
    "account_code",
    "account_name",
    "account_category",
    "debit",
    "credit",
    "description",
    "reference_id",
]


def auto_map_columns(raw_columns: List[str]) -> Dict[str, str]:
    """
    Heuristic Auto-Mapping Algorithm.
    Analyzes actual raw column headers from the uploaded file and maps them to FinOS canonical fields.
    """
    mapping: Dict[str, str] = {}

    for col in raw_columns:
        c = str(col).lower().strip()

        # Date Matching
        if "transaction_date" not in mapping:
            if any(k in c for k in ["date", "txn_date", "post_date", "period", "day", "time"]):
                mapping["transaction_date"] = col
                continue

        # Debit / Expense / Withdrawal Matching
        if "debit" not in mapping:
            if any(k in c for k in ["debit", "withdrawal", "dr", "expense", "cost", "payout"]):
                mapping["debit"] = col
                continue

        # Credit / Deposit / Revenue Matching
        if "credit" not in mapping:
            if any(k in c for k in ["credit", "deposit", "cr", "income", "revenue", "sales", "receipt"]):
                mapping["credit"] = col
                continue

        # Account Name / Description Matching
        if "account_name" not in mapping:
            if any(k in c for k in ["account", "particulars", "description", "category", "item", "name", "vendor", "customer"]):
                mapping["account_name"] = col
                continue

        # Account Code Matching
        if "account_code" not in mapping:
            if any(k in c for k in ["code", "gl", "acct_id", "id", "num"]):
                mapping["account_code"] = col
                continue

        # Reference ID / Voucher # Matching
        if "reference_id" not in mapping:
            if any(k in c for k in ["reference", "voucher", "invoice", "ref", "chk", "inv"]):
                mapping["reference_id"] = col
                continue

    # Fallback for Single "Amount" column (e.g. Sales = Credit, Expenses = Debit)
    if "debit" not in mapping and "credit" not in mapping:
        for col in raw_columns:
            c = str(col).lower().strip()
            if any(k in c for k in ["amount", "total", "net", "price", "val", "value"]):
                mapping["credit"] = col
                mapping["debit"] = col
                break

    return mapping


def map_and_normalize_dataframe(
    df: pd.DataFrame,
    column_mapping: Dict[str, str] = None,
    default_category: str = "GENERAL_SMB",
) -> pd.DataFrame:
    """
    Applies column mappings to raw DataFrame and converts values into canonical types.
    Falls back to automatic header detection if mapping is incomplete.
    """
    if df.empty:
        return pd.DataFrame(columns=CANONICAL_FIELDS)

    # 1. Run auto-map directly on actual DataFrame columns if mapping is empty or invalid
    auto_detected = auto_map_columns(list(df.columns))

    # Merge user mapping with auto-detected mapping
    final_mapping = {}
    if column_mapping:
        for k, v in column_mapping.items():
            if v in df.columns:
                final_mapping[k] = v

    # Fill any unmapped canonical fields with auto-detected fields
    for field, raw_col in auto_detected.items():
        if field not in final_mapping and raw_col in df.columns:
            final_mapping[field] = raw_col

    normalized_df = pd.DataFrame()

    # 2. Extract mapped columns
    for canonical_field, raw_col in final_mapping.items():
        if raw_col in df.columns:
            normalized_df[canonical_field] = df[raw_col]

    # 3. Ensure all canonical fields exist
    for field in CANONICAL_FIELDS:
        if field not in normalized_df.columns:
            if field in ["debit", "credit"]:
                normalized_df[field] = 0.0
            else:
                normalized_df[field] = None

    # 4. Clean Numeric Debit/Credit columns
    for num_col in ["debit", "credit"]:
        normalized_df[num_col] = (
            normalized_df[num_col]
            .astype(str)
            .str.replace(r"[^\d.-]", "", regex=True)
            .replace("", "0")
            .astype(float)
            .fillna(0.0)
        )

    # 5. Normalize account_category
    normalized_df["account_category"] = normalized_df["account_name"].apply(
        lambda name: _infer_account_category(str(name), default_category)
    )

    # 6. Parse Transaction Date to YYYY-MM-DD
    normalized_df["transaction_date"] = pd.to_datetime(
        normalized_df["transaction_date"], errors="coerce"
    ).dt.strftime("%Y-%m-%d")

    # Fill missing dates with today's date
    from datetime import date
    normalized_df["transaction_date"] = normalized_df["transaction_date"].fillna(date.today().strftime("%Y-%m-%d"))

    return normalized_df[CANONICAL_FIELDS]


def _infer_account_category(account_name: str, fallback: str) -> str:
    """Infers standard accounting category from account name keywords."""
    name = str(account_name).lower()

    if any(k in name for k in ["sales", "revenue", "income", "billing", "contract"]):
        return "REVENUE"
    if any(k in name for k in ["material", "cogs", "inventory", "freight", "direct labor", "production", "steel", "alloy", "stock"]):
        return "COGS"
    if any(k in name for k in ["salary", "rent", "software", "utility", "marketing", "admin", "expense", "power"]):
        return "OPEX"
    if any(k in name for k in ["cash", "bank", "receivable", "equipment", "asset", "hdfc"]):
        return "ASSET"
    if any(k in name for k in ["payable", "loan", "liability", "tax", "supplier"]):
        return "LIABILITY"

    return fallback