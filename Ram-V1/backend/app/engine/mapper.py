import re
from decimal import Decimal
from typing import Dict, List, Optional
import pandas as pd

# FinOS Standard Canonical Target Fields
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
    Analyzes raw column headers and guesses the best matching FinOS canonical field.
    Returns dictionary mapping: { canonical_field_name: raw_header_name }
    """
    mapping: Dict[str, str] = {}

    for col in raw_columns:
        c = col.lower().strip()
        c_clean = re.sub(r"[^a-z0-9]", "", c)

        # Date Matching
        if "transaction_date" not in mapping:
            if any(k in c for k in ["date", "txn_date", "post_date", "period"]):
                mapping["transaction_date"] = col
                continue

        # Debit / Withdrawal Matching
        if "debit" not in mapping:
            if any(k in c for k in ["debit", "withdrawal", "dr", "dr_amount", "expense_amount"]):
                mapping["debit"] = col
                continue

        # Credit / Deposit Matching
        if "credit" not in mapping:
            if any(k in c for k in ["credit", "deposit", "cr", "cr_amount", "income_amount"]):
                mapping["credit"] = col
                continue

        # Account Name / Description Matching
        if "account_name" not in mapping:
            if any(k in c for k in ["account_name", "account", "particulars", "description", "category"]):
                mapping["account_name"] = col
                continue

        # Account Code Matching
        if "account_code" not in mapping:
            if any(k in c for k in ["account_code", "gl_code", "code", "acct_id"]):
                mapping["account_code"] = col
                continue

        # Reference ID / Voucher # Matching
        if "reference_id" not in mapping:
            if any(k in c for k in ["reference", "voucher", "invoice", "ref_no", "chk_no"]):
                mapping["reference_id"] = col
                continue

    return mapping


def map_and_normalize_dataframe(
    df: pd.DataFrame,
    column_mapping: Dict[str, str],
    default_category: str = "GENERAL_SMB",
) -> pd.DataFrame:
    """
    Applies column mappings to raw DataFrame and converts values into canonical types.
    """
    normalized_df = pd.DataFrame()

    # 1. Invert mapping dictionary: { raw_header: canonical_field }
    inverted_map = {v: k for k, v in column_mapping.items() if v in df.columns}

    # 2. Select and rename mapped columns
    for raw_col, canonical_field in inverted_map.items():
        normalized_df[canonical_field] = df[raw_col]

    # 3. Ensure all canonical fields exist in DataFrame (fill missing with None/0)
    for field in CANONICAL_FIELDS:
        if field not in normalized_df.columns:
            if field in ["debit", "credit"]:
                normalized_df[field] = 0.0
            else:
                normalized_df[field] = None

    # 4. Clean and parse Numeric Debit/Credit columns
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

    # Drop rows missing critical dates
    normalized_df = normalized_df.dropna(subset=["transaction_date"])

    return normalized_df[CANONICAL_FIELDS]


def _infer_account_category(account_name: str, fallback: str) -> str:
    """Infers standard accounting category from account name keywords."""
    name = account_name.lower()

    if any(k in name for k in ["sales", "revenue", "income", "billing"]):
        return "REVENUE"
    if any(k in name for k in ["material", "cogs", "inventory", "freight", "direct labor", "production"]):
        return "COGS"
    if any(k in name for k in ["salary", "rent", "software", "utility", "marketing", "admin", "expense"]):
        return "OPEX"
    if any(k in name for k in ["cash", "bank", "receivable", "equipment", "asset"]):
        return "ASSET"
    if any(k in name for k in ["payable", "loan", "liability", "tax"]):
        return "LIABILITY"

    return fallback