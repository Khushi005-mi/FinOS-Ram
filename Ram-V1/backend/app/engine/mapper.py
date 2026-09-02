"""
backend/app/engine/mapper.py

Universal Financial Cognitive Normalizer:
- Exports public auto_map_columns and map_and_normalize_dataframe.
- Context-Aware Single Amount Resolution: Positive COGS/OpEx lines mapped to Debits; Revenue to Credits.
- Explicit Debit/Credit columns preserved without alteration.
- Strips summary/subtotal rows to prevent double-counting.
- Comprehensive 360° Chart of Accounts Taxonomy & GL Code Ranges (4xxx, 5xxx, 6xxx).
"""
import re
from datetime import date, datetime
from typing import Dict, List, Optional, Any
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

# Universal Synonym Dictionary for Headers
COLUMN_SYNONYMS: Dict[str, List[str]] = {
    "transaction_date": [
        "date", "transaction_date", "txn_date", "trans_date", "post_date",
        "value_date", "booking_date", "invoice_date", "bill_date", "period",
        "day", "time", "voucher_date", "chq_date", "posting_date"
    ],
    "account_name": [
        "account", "account_name", "particulars", "description", "narration",
        "account_description", "ledger", "ledger_name", "item", "line_item",
        "details", "payee", "vendor", "customer", "party_name", "party",
        "entity", "category", "head", "account_head", "product", "item_name",
        "line_item_description"
    ],
    "account_code": [
        "code", "account_code", "gl_code", "acct_code", "acc_no", "account_number",
        "ledger_code", "gl", "acct_id", "hsn", "sac", "sku"
    ],
    "debit": [
        "debit", "dr", "dr_amount", "debit_amount", "withdrawal", "outflow",
        "payment", "spend", "charge", "expense", "dr_inr", "debit_inr"
    ],
    "credit": [
        "credit", "cr", "cr_amount", "credit_amount", "deposit", "inflow",
        "receipt", "income_amount", "sales", "cr_inr", "credit_inr"
    ],
    "amount": [
        "amount", "net_amount", "total", "txn_amount", "value", "line_total",
        "figure", "taxable_value", "invoice_value", "grand_total", "net",
        "transaction_amount", "payout", "settlement", "total_amount"
    ],
    "reference_id": [
        "ref", "reference", "reference_id", "txn_id", "transaction_id",
        "invoice_no", "inv_no", "voucher_no", "cheque_no", "check_no", "id",
        "doc_no", "bill_no", "order_id"
    ],
}

CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "COGS": [
        "cogs", "cost of goods", "cost of sales", "direct cost", "raw material",
        "inventory", "freight", "shipping", "direct labor", "manufacturing",
        "production", "steel", "alloy", "stock", "packaging", "packing",
        "consumables", "jobwork", "customs duty", "import duty", "carriage inward",
        "freight inward", "clearing charges", "purchase account", "purchases",
        "hosting", "server cost", "cloud cost", "aws", "azure", "gcp",
        "devops", "api cost", "support labor", "delivery fee", "merchant fee",
        "payment gateway fee", "stripe fee", "razorpay fee", "infrastructure"
    ],
    "REVENUE": [
        "sales", "revenue", "income", "turnover", "billing", "subscription",
        "arr", "mrr", "service fee", "consulting fee", "interest income",
        "settlement", "payout", "inflow", "contract", "funding", "receipt",
        "professional services", "services", "direct income", "sales account",
        "export sales", "domestic sales", "commission received", "discount received",
        "invoice", "customer payment", "license"
    ],
    "OPEX": [
        "salary", "salaries", "payroll", "wages", "rent", "office", "utility",
        "utilities", "electricity", "internet", "software", "saas", "subscription",
        "marketing", "advertising", "google ads", "facebook ads", "meta ads",
        "travel", "legal", "accounting", "audit", "insurance", "depreciation",
        "amortization", "repairs", "maintenance", "telephone", "stationery",
        "tax", "gst", "admin", "expense", "operating expense", "opex", "wework",
        "director remuneration", "printing", "courier", "security service",
        "consultancy", "staff welfare", "bank charges", "indirect expense", "spend"
    ],
    "ASSET": [
        "cash", "bank", "checking", "savings", "accounts receivable", "debtor",
        "sundry debtor", "prepaid", "equipment", "machinery", "furniture",
        "building", "land", "security deposit", "hdfc", "icici", "sbi",
        "fixed asset", "current asset", "tds receivable", "gst input"
    ],
    "LIABILITY": [
        "accounts payable", "creditor", "sundry creditor", "loan", "borrowing",
        "credit card", "mortgage", "tax payable", "accrued", "overdraft",
        "supplier", "gst payable", "tds payable", "duties and taxes", "current liability"
    ],
    "EQUITY": [
        "capital", "equity", "retained earnings", "shareholder", "common stock",
        "drawing", "dividend", "partner capital", "share capital"
    ],
}

SUMMARY_ROW_PATTERNS = re.compile(
    r"^(?:total|grand total|sub total|subtotal|summary|balance b/f|balance c/f|closing balance|opening balance)\b",
    re.IGNORECASE
)


def _strip_summary_rows(df: pd.DataFrame) -> pd.DataFrame:
    """Drops summary and subtotal rows to prevent double-counting."""
    if df.empty:
        return df
    mask_to_drop = pd.Series(False, index=df.index)
    for col in df.columns[:min(3, len(df.columns))]:
        str_col = df[col].astype(str).str.strip()
        matched = str_col.str.contains(SUMMARY_ROW_PATTERNS, na=False)
        mask_to_drop = mask_to_drop | matched
    return df[~mask_to_drop].reset_index(drop=True)


def auto_map_columns(raw_columns: List[str]) -> Dict[str, str]:
    """
    Public heuristic column matcher:
    Fuzzy-matches raw header strings to FinOS canonical fields.
    """
    mapping: Dict[str, str] = {}
    used_canonical = set()

    for col in raw_columns:
        c_clean = re.sub(r"[^a-zA-Z0-9]", "", str(col).lower())
        matched = False
        for canonical_field, synonyms in COLUMN_SYNONYMS.items():
            if canonical_field in used_canonical:
                continue
            for syn in synonyms:
                clean_syn = re.sub(r"[^a-zA-Z0-9]", "", syn.lower())
                if c_clean == clean_syn or (len(clean_syn) > 3 and clean_syn in c_clean):
                    if canonical_field == "account_name" and ("id" in c_clean and "name" not in c_clean):
                        continue
                    mapping[canonical_field] = col
                    used_canonical.add(canonical_field)
                    matched = True
                    break
            if matched:
                break

    # Fallback for single amount headers if debit/credit are missing
    if "debit" not in mapping and "credit" not in mapping and "amount" not in mapping:
        for col in raw_columns:
            c_clean = re.sub(r"[^a-zA-Z0-9]", "", str(col).lower())
            if any(k in c_clean for k in ["amount", "total", "net", "price", "val", "value", "figure", "taxable"]):
                mapping["amount"] = col
                break

    return mapping


def _fingerprint_columns(df: pd.DataFrame) -> Dict[str, str]:
    """Inspects cell values to classify columns when headers are non-standard."""
    mapping: Dict[str, str] = auto_map_columns(list(df.columns))
    if df.empty:
        return mapping

    # Semantic Cell Inspection Fallback for unmapped critical fields
    for col in df.columns:
        if col in mapping.values():
            continue
        sample = df[col].dropna().head(10)
        if sample.empty:
            continue
        if "transaction_date" not in mapping:
            try:
                date_parsed = pd.to_datetime(sample, errors="coerce", dayfirst=True)
                if date_parsed.notna().sum() >= len(sample) * 0.7:
                    mapping["transaction_date"] = col
                    continue
            except Exception:
                pass
        if "debit" not in mapping and "amount" not in mapping:
            clean_num = sample.astype(str).str.replace(r"[^\d.-]", "", regex=True)
            num_parsed = pd.to_numeric(clean_num, errors="coerce")
            if num_parsed.notna().sum() >= len(sample) * 0.7:
                if (num_parsed.abs() > 10).any():
                    mapping["amount"] = col
                    continue
        if "account_name" not in mapping:
            if df[col].dtype == "object":
                text_len = sample.astype(str).str.len().mean()
                if text_len > 3:
                    mapping["account_name"] = col
                    continue

    return mapping


def map_and_normalize_dataframe(
    df: pd.DataFrame,
    column_mapping: Optional[Dict[str, str]] = None,
    default_category: str = "GENERAL_SMB",
) -> pd.DataFrame:
    """Universal normalization entrypoint."""
    if df.empty:
        return pd.DataFrame(columns=CANONICAL_FIELDS)

    clean_df = _strip_summary_rows(df.copy())
    if clean_df.empty:
        return pd.DataFrame(columns=CANONICAL_FIELDS)

    detected_mapping = _fingerprint_columns(clean_df)
    final_mapping: Dict[str, str] = {}

    if column_mapping:
        for k, v in column_mapping.items():
            if v in clean_df.columns:
                final_mapping[k] = v

    for field, raw_col in detected_mapping.items():
        if field not in final_mapping and raw_col in clean_df.columns:
            final_mapping[field] = raw_col

    norm_df = pd.DataFrame(index=clean_df.index)

    # 1. Resolve Account Name
    if "account_name" in final_mapping and final_mapping["account_name"] in clean_df.columns:
        norm_df["account_name"] = clean_df[final_mapping["account_name"]]
    elif "description" in final_mapping and final_mapping["description"] in clean_df.columns:
        norm_df["account_name"] = clean_df[final_mapping["description"]]
    else:
        text_cols = clean_df.select_dtypes(include=["object"]).columns
        norm_df["account_name"] = clean_df[text_cols[0]] if len(text_cols) > 0 else "General Account"

    norm_df["account_name"] = norm_df["account_name"].fillna("Unclassified Line Item").astype(str).str.strip()

    # 2. Resolve Description
    if "description" in final_mapping and final_mapping["description"] in clean_df.columns:
        norm_df["description"] = clean_df[final_mapping["description"]].fillna(norm_df["account_name"]).astype(str)
    else:
        norm_df["description"] = norm_df["account_name"]

    # 3. Resolve Account Code
    if "account_code" in final_mapping and final_mapping["account_code"] in clean_df.columns:
        norm_df["account_code"] = clean_df[final_mapping["account_code"]].fillna("").astype(str)
        for idx, val in enumerate(norm_df["account_code"]):
            if not val or val.strip() == "" or val.lower() in ["nan", "none"]:
                norm_df.at[idx, "account_code"] = f"ACC-{idx+1:04d}"
    else:
        norm_df["account_code"] = [f"ACC-{i+1:04d}" for i in range(len(norm_df))]

    # 4. Resolve Reference ID
    if "reference_id" in final_mapping and final_mapping["reference_id"] in clean_df.columns:
        norm_df["reference_id"] = clean_df[final_mapping["reference_id"]].astype(str)
    else:
        norm_df["reference_id"] = None

    # 5. Extract & Normalize Amounts with Financial Context Awareness
    norm_df = _process_amounts_contextual(clean_df, norm_df, final_mapping)

    # 6. Normalize Dates
    norm_df = _process_dates(clean_df, norm_df, final_mapping)

    return norm_df[CANONICAL_FIELDS]


def _process_amounts_contextual(df: pd.DataFrame, norm_df: pd.DataFrame, mapping: Dict[str, str]) -> pd.DataFrame:
    """Extracts numerical flow and accurately classifies accounting categories."""
    debit_src = mapping.get("debit")
    credit_src = mapping.get("credit")
    amount_src = mapping.get("amount")

    if not amount_src and "amount" in df.columns:
        amount_src = "amount"

    def _clean_num_series(series: pd.Series) -> pd.Series:
        s = series.astype(str).str.strip().str.replace(r"^\((.*)\)$", r"-\1", regex=True)
        s = s.str.replace(r"[^\d.-]", "", regex=True).replace("", "0")
        return pd.to_numeric(s, errors="coerce").fillna(0.0)

    # --- Mode 1: Explicit Debit & Credit Columns (General Ledger) ---
    if debit_src and credit_src and debit_src != credit_src and debit_src in df.columns and credit_src in df.columns:
        norm_df["debit"] = _clean_num_series(df[debit_src]).abs()
        norm_df["credit"] = _clean_num_series(df[credit_src]).abs()
        
        norm_df["account_category"] = [
            _classify_account(
                str(norm_df.iloc[i]["account_name"]),
                str(norm_df.iloc[i]["description"]),
                str(norm_df.iloc[i]["account_code"]),
                float(norm_df.iloc[i]["debit"]),
                float(norm_df.iloc[i]["credit"])
            )
            for i in range(len(norm_df))
        ]
        return norm_df

    # --- Mode 2: Single Amount Column (Invoices, P&Ls, Bank Statements) ---
    target_col = amount_src if (amount_src and amount_src in df.columns) else debit_src or credit_src
    if target_col and target_col in df.columns:
        raw_amounts = _clean_num_series(df[target_col])

        # Identify base taxonomy from keywords / GL code
        base_categories = [
            _identify_base_taxonomy(
                str(norm_df.iloc[i]["account_name"]),
                str(norm_df.iloc[i]["description"]),
                str(norm_df.iloc[i]["account_code"])
            )
            for i in range(len(norm_df))
        ]

        # Check for explicit direction column
        type_col = next(
            (col for col in df.columns if any(k in str(col).lower() for k in ["type", "dr_cr", "sign", "direction", "d_c"])),
            None
        )

        debits = []
        credits = []
        final_categories = []

        if type_col is not None:
            type_vals = df[type_col].astype(str).str.upper()
            is_debit = type_vals.str.contains(r"DEBIT|DR|WITHDRAWAL|EXPENSE|OUTFLOW|PAYMENT", regex=True, na=False)
            is_credit = type_vals.str.contains(r"CREDIT|CR|DEPOSIT|INCOME|INFLOW|RECEIPT", regex=True, na=False)
            
            for i, amt in enumerate(raw_amounts):
                cat = base_categories[i]
                if is_debit.iloc[i]:
                    debits.append(abs(amt))
                    credits.append(0.0)
                    final_categories.append(cat if cat != "UNKNOWN" else "OPEX")
                else:
                    credits.append(abs(amt))
                    debits.append(0.0)
                    final_categories.append(cat if cat != "UNKNOWN" else "REVENUE")
        else:
            for i, amt in enumerate(raw_amounts):
                cat = base_categories[i]

                if cat == "COGS":
                    debits.append(abs(amt))
                    credits.append(0.0)
                    final_categories.append("COGS")
                elif cat == "OPEX":
                    debits.append(abs(amt))
                    credits.append(0.0)
                    final_categories.append("OPEX")
                elif cat == "REVENUE":
                    credits.append(abs(amt))
                    debits.append(0.0)
                    final_categories.append("REVENUE")
                elif cat in ["ASSET", "LIABILITY", "EQUITY"]:
                    if amt < 0:
                        debits.append(abs(amt))
                        credits.append(0.0)
                    else:
                        credits.append(abs(amt))
                        debits.append(0.0)
                    final_categories.append(cat)
                else:
                    if amt < 0:
                        debits.append(abs(amt))
                        credits.append(0.0)
                        final_categories.append("OPEX")
                    else:
                        credits.append(abs(amt))
                        debits.append(0.0)
                        final_categories.append("REVENUE")

        norm_df["debit"] = debits
        norm_df["credit"] = credits
        norm_df["account_category"] = final_categories
    else:
        norm_df["debit"] = 0.0
        norm_df["credit"] = 0.0
        norm_df["account_category"] = "OPEX"

    return norm_df


def _process_dates(df: pd.DataFrame, norm_df: pd.DataFrame, mapping: Dict[str, str]) -> pd.DataFrame:
    today = date.today()
    date_src = mapping.get("transaction_date")

    if date_src and date_src in df.columns:
        parsed_dates = pd.to_datetime(df[date_src], errors="coerce", dayfirst=True).dt.date
        norm_df["transaction_date"] = parsed_dates.fillna(today)
    else:
        norm_df["transaction_date"] = today

    return norm_df


def _identify_base_taxonomy(account_name: str, description: str, account_code: str = "") -> str:
    combined_text = f"{str(account_name).lower()} {str(description).lower()} {str(account_code).lower()}".strip()

    for kw in CATEGORY_KEYWORDS["COGS"]:
        if re.search(r"\b" + re.escape(kw) + r"\b", combined_text):
            return "COGS"

    for kw in CATEGORY_KEYWORDS["REVENUE"]:
        if re.search(r"\b" + re.escape(kw) + r"\b", combined_text):
            return "REVENUE"

    for kw in CATEGORY_KEYWORDS["OPEX"]:
        if re.search(r"\b" + re.escape(kw) + r"\b", combined_text):
            return "OPEX"

    for kw in CATEGORY_KEYWORDS["ASSET"]:
        if re.search(r"\b" + re.escape(kw) + r"\b", combined_text):
            return "ASSET"

    for kw in CATEGORY_KEYWORDS["LIABILITY"]:
        if re.search(r"\b" + re.escape(kw) + r"\b", combined_text):
            return "LIABILITY"

    for kw in CATEGORY_KEYWORDS["EQUITY"]:
        if re.search(r"\b" + re.escape(kw) + r"\b", combined_text):
            return "EQUITY"

    code_match = re.search(r"\b(\d{4,5})\b", combined_text)
    if code_match:
        num = code_match.group(1)
        if num.startswith("4"):
            return "REVENUE"
        elif num.startswith("5"):
            return "COGS"
        elif num[0] in ["6", "7", "8"]:
            return "OPEX"
        elif num.startswith("1"):
            return "ASSET"
        elif num.startswith("2"):
            return "LIABILITY"
        elif num.startswith("3"):
            return "EQUITY"

    return "UNKNOWN"


def _classify_account(account_name: str, description: str, account_code: str, debit: float, credit: float) -> str:
    base = _identify_base_taxonomy(account_name, description, account_code)
    if base != "UNKNOWN":
        return base

    if credit > debit:
        return "REVENUE"
    elif debit > credit:
        return "OPEX"

    return "OPEX"
