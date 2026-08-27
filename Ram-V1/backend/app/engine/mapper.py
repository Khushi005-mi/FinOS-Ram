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
            has_word_dr = bool(re.search(r"(?<![a-z])dr(?![a-z])", c))
            if has_word_dr or any(k in c for k in ["debit", "withdrawal", "expense", "cost", "payout"]):
                mapping["debit"] = col
                continue
        # Credit / Deposit / Revenue Matching
        if "credit" not in mapping:
            has_word_cr = bool(re.search(r"(?<![a-z])cr(?![a-z])", c))
            if has_word_cr or any(k in c for k in ["credit", "deposit", "income", "revenue", "sales", "receipt"]):
                mapping["credit"] = col
                continue


        # Account Code Matching
        if "account_code" not in mapping:
            if any(k in c for k in ["code", "gl", "acct_id", "acct_no", "num"]):
                mapping["account_code"] = col
                continue

        # Account Name / Description Matching
        if "account_name" not in mapping:
            looks_like_id_column = "_id" in c or c.endswith("id")
            if not looks_like_id_column and any(
                k in c for k in ["account", "particulars", "description", "category", "item", "name", "vendor", "customer"]
            ):
                mapping["account_name"] = col
                continue

        # Reference ID / Voucher # Matching
        if "reference_id" not in mapping:
            if any(k in c for k in ["reference", "voucher", "invoice", "ref", "chk", "inv"]):
                mapping["reference_id"] = col
                continue

    # Fallback for Single "Amount" column
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

    # 3b. Detect the "single amount column" case
    debit_src = final_mapping.get("debit")
    credit_src = final_mapping.get("credit")
    if debit_src is not None and debit_src == credit_src:
        amounts = pd.to_numeric(
            df[debit_src].astype(str).str.replace(r"[^\d.-]", "", regex=True),
            errors="coerce",
        ).fillna(0.0)

        type_col = next(
            (col for col in df.columns if any(
                k in str(col).lower() for k in ["type", "dr_cr", "sign", "direction"]
            )),
            None,
        )

        if type_col is not None:
            type_vals = df[type_col].astype(str).str.upper()
            is_debit = type_vals.str.contains(r"DEBIT|DR|WITHDRAWAL|EXPENSE", regex=True, na=False)
            is_credit = type_vals.str.contains(r"CREDIT|CR|DEPOSIT|INCOME", regex=True, na=False)
            normalized_df["debit"] = amounts.where(is_debit, 0.0)
            normalized_df["credit"] = amounts.where(is_credit, 0.0)
        else:
            normalized_df["debit"] = amounts.where(amounts < 0, 0.0).abs()
            normalized_df["credit"] = amounts.where(amounts >= 0, 0.0)

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
    ).dt.date
    # Fill missing dates with today's date
    from datetime import date
    normalized_df["transaction_date"] = normalized_df["transaction_date"].fillna(date.today())
    return normalized_df[CANONICAL_FIELDS]


def _infer_account_category(account_name: str, fallback: str) -> str:
    """Infers standard accounting category from account name keywords."""
    name = str(account_name).lower()

    # CHECK COGS FIRST (So "Cost of Sales" doesn't accidentally hit REVENUE)
    if any(k in name for k in [
        "cost of goods", "cost of sales", "cogs", "material", "inventory", 
        "freight", "direct labor", "production", "steel", "alloy", "stock"
    ]):
        return "COGS"
        
    # CHECK REVENUE
    if any(k in name for k in [
        "sales", "revenue", "income", "billing", "contract",
        "funding", "settlement", "receipt", "payout received",
        "customer payment",
    ]):
        return "REVENUE"
        
    # CHECK OPEX
    if any(k in name for k in [
        "salary", "rent", "software", "utility", "marketing", "admin", "expense", "power",
        "cloud", "hosting", "subscription", "vendor payment", "aws", "saas",
        "payroll", "operating expense", "opex"
    ]):
        return "OPEX"
        
    # CHECK ASSET
    if any(k in name for k in ["cash", "bank", "receivable", "equipment", "asset", "hdfc"]):
        return "ASSET"
        
    # CHECK LIABILITY
    if any(k in name for k in ["payable", "loan", "liability", "tax", "supplier"]):
        return "LIABILITY"

    return "UNCATEGORIZED"