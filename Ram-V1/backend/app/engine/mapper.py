"""
backend/app/engine/mapper.py

Universal Schema Normalization & Taxonomy Engine:
Guarantees melted wide tables (amount column) map directly into real Debits and Credits.
"""
import re
from datetime import date
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

COLUMN_SYNONYMS: Dict[str, List[str]] = {
    "transaction_date": [
        "date", "transaction_date", "txn_date", "trans_date", "post_date",
        "value_date", "booking_date", "invoice_date", "bill_date", "period", "day", "time"
    ],
    "account_name": [
        "account", "account_name", "particulars", "description", "narration",
        "account_description", "ledger", "ledger_name", "item", "line_item",
        "details", "payee", "vendor", "customer", "entity", "category"
    ],
    "account_code": [
        "code", "account_code", "gl_code", "acct_code", "acc_no", "account_number",
        "ledger_code", "gl", "acct_id"
    ],
    "debit": [
        "debit", "dr", "dr_amount", "debit_amount", "withdrawal", "outflow",
        "payment", "spend", "charge", "expense"
    ],
    "credit": [
        "credit", "cr", "cr_amount", "credit_amount", "deposit", "inflow",
        "receipt", "income_amount", "sales"
    ],
    "amount": [
        "amount", "net_amount", "total", "balance", "txn_amount", "value", "line_total", "figure"
    ],
    "reference_id": [
        "ref", "reference", "reference_id", "txn_id", "transaction_id",
        "invoice_no", "inv_no", "voucher_no", "cheque_no", "check_no", "id"
    ],
}

CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "COGS": [
        "cogs", "cost of goods", "cost of sales", "direct cost", "raw material",
        "inventory", "freight", "shipping", "direct labor", "manufacturing",
        "hosting", "server cost", "cloud cost", "aws", "azure", "gcp",
        "production", "steel", "alloy", "stock", "packaging", "devops", "support"
    ],
    "REVENUE": [
        "sales", "revenue", "income", "turnover", "billing", "subscription",
        "arr", "mrr", "service fee", "consulting fee", "interest income",
        "settlement", "payout", "inflow", "contract", "funding", "receipt",
        "professional services", "services"
    ],
    "OPEX": [
        "salary", "salaries", "payroll", "wages", "rent", "office", "utility",
        "utilities", "electricity", "internet", "software", "saas", "subscription",
        "marketing", "advertising", "google ads", "facebook ads", "travel",
        "legal", "accounting", "audit", "insurance", "depreciation",
        "amortization", "repairs", "maintenance", "telephone", "stationery",
        "tax", "gst", "admin", "expense", "operating expense", "opex", "wework"
    ],
    "ASSET": [
        "cash", "bank", "checking", "savings", "accounts receivable", "debtor",
        "prepaid", "equipment", "machinery", "furniture", "building", "land",
        "security deposit", "hdfc", "icici", "sbi"
    ],
    "LIABILITY": [
        "accounts payable", "creditor", "loan", "borrowing", "credit card",
        "mortgage", "tax payable", "accrued", "overdraft", "supplier"
    ],
    "EQUITY": [
        "capital", "equity", "retained earnings", "shareholder", "common stock",
        "drawing", "dividend"
    ],
}


def auto_map_columns(raw_columns: List[str]) -> Dict[str, str]:
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
                if c_clean == clean_syn or (len(clean_syn) > 2 and clean_syn in c_clean):
                    if canonical_field == "account_name" and ("id" in c_clean and "name" not in c_clean):
                        continue
                    mapping[canonical_field] = col
                    used_canonical.add(canonical_field)
                    matched = True
                    break

            if matched:
                break

    # If neither debit nor credit were mapped, look for single amount column
    if "debit" not in mapping and "credit" not in mapping and "amount" not in mapping:
        for col in raw_columns:
            c_clean = re.sub(r"[^a-zA-Z0-9]", "", str(col).lower())
            if any(k in c_clean for k in ["amount", "total", "net", "price", "val", "value", "figure"]):
                mapping["amount"] = col
                break

    return mapping


def map_and_normalize_dataframe(
    df: pd.DataFrame,
    column_mapping: Optional[Dict[str, str]] = None,
    default_category: str = "GENERAL_SMB",
) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame(columns=CANONICAL_FIELDS)

    auto_detected = auto_map_columns(list(df.columns))

    final_mapping: Dict[str, str] = {}
    if column_mapping:
        for k, v in column_mapping.items():
            if v in df.columns:
                final_mapping[k] = v

    for field, raw_col in auto_detected.items():
        if field not in final_mapping and raw_col in df.columns:
            final_mapping[field] = raw_col

    norm_df = pd.DataFrame()

    # 1. Account Name
    if "account_name" in final_mapping and final_mapping["account_name"] in df.columns:
        norm_df["account_name"] = df[final_mapping["account_name"]]
    elif "description" in final_mapping and final_mapping["description"] in df.columns:
        norm_df["account_name"] = df[final_mapping["description"]]
    else:
        text_cols = df.select_dtypes(include=["object"]).columns
        norm_df["account_name"] = df[text_cols[0]] if len(text_cols) > 0 else "General Account"

    norm_df["account_name"] = norm_df["account_name"].fillna("Unclassified Line Item").astype(str)

    # 2. Description
    if "description" in final_mapping and final_mapping["description"] in df.columns:
        norm_df["description"] = df[final_mapping["description"]].fillna(norm_df["account_name"]).astype(str)
    else:
        norm_df["description"] = norm_df["account_name"]

    # 3. Account Code
    if "account_code" in final_mapping and final_mapping["account_code"] in df.columns:
        norm_df["account_code"] = df[final_mapping["account_code"]].fillna("").astype(str)
        for idx, val in enumerate(norm_df["account_code"]):
            if not val or val.strip() == "" or val.lower() == "nan":
                norm_df.at[idx, "account_code"] = f"ACC-{idx+1:04d}"
    else:
        norm_df["account_code"] = [f"ACC-{i+1:04d}" for i in range(len(norm_df))]

    # 4. Reference ID
    if "reference_id" in final_mapping and final_mapping["reference_id"] in df.columns:
        norm_df["reference_id"] = df[final_mapping["reference_id"]].astype(str)
    else:
        norm_df["reference_id"] = None

    # 5. Pre-classify Account Category
    norm_df["account_category"] = norm_df.apply(
        lambda r: _infer_account_category(
            account_name=str(r["account_name"]),
            description=str(r["description"]),
            account_code=str(r["account_code"])
        ),
        axis=1
    )

    # 6. Extract and Normalize Amounts with Category Awareness
    norm_df = _process_amounts(df, norm_df, final_mapping)

    # 7. Normalize Transaction Dates
    norm_df = _process_dates(df, norm_df, final_mapping)

    return norm_df[CANONICAL_FIELDS]


def _process_amounts(df: pd.DataFrame, norm_df: pd.DataFrame, mapping: Dict[str, str]) -> pd.DataFrame:
    debit_src = mapping.get("debit")
    credit_src = mapping.get("credit")
    amount_src = mapping.get("amount")

    # If 'amount' exists in the source DataFrame columns directly (from melted wide tables)
    if not amount_src and "amount" in df.columns:
        amount_src = "amount"

    def _clean_num_series(series: pd.Series) -> pd.Series:
        s = series.astype(str).str.strip().str.replace(r"^\((.*)\)$", r"-\1", regex=True)
        s = s.str.replace(r"[^\d.-]", "", regex=True).replace("", "0")
        return pd.to_numeric(s, errors="coerce").fillna(0.0)

    # Single Amount Column Handling (Bank statements, P&L melted tables)
    if (amount_src and amount_src in df.columns) or (debit_src and credit_src and debit_src == credit_src):
        target_col = amount_src if (amount_src and amount_src in df.columns) else debit_src
        raw_amounts = _clean_num_series(df[target_col])

        type_col = next(
            (col for col in df.columns if any(k in str(col).lower() for k in ["type", "dr_cr", "sign", "direction"])),
            None
        )

        if type_col is not None:
            type_vals = df[type_col].astype(str).str.upper()
            is_debit = type_vals.str.contains(r"DEBIT|DR|WITHDRAWAL|EXPENSE|OUTFLOW|PAYMENT", regex=True, na=False)
            is_credit = type_vals.str.contains(r"CREDIT|CR|DEPOSIT|INCOME|INFLOW|RECEIPT", regex=True, na=False)
            norm_df["debit"] = raw_amounts.abs().where(is_debit, 0.0)
            norm_df["credit"] = raw_amounts.abs().where(is_credit, 0.0)
        else:
            debits = []
            credits = []
            for idx, amt in enumerate(raw_amounts):
                cat = norm_df.iloc[idx]["account_category"]
                if amt < 0:
                    debits.append(abs(amt))
                    credits.append(0.0)
                else:
                    if cat in ["COGS", "OPEX"]:
                        debits.append(amt)        # Expenses in P&L -> Debit
                        credits.append(0.0)
                    else:
                        credits.append(amt)       # Revenue/Inflow in P&L -> Credit
                        debits.append(0.0)

            norm_df["debit"] = debits
            norm_df["credit"] = credits

    else:
        # Separate Debit / Credit columns
        if debit_src and debit_src in df.columns:
            norm_df["debit"] = _clean_num_series(df[debit_src]).abs()
        else:
            norm_df["debit"] = 0.0

        if credit_src and credit_src in df.columns:
            norm_df["credit"] = _clean_num_series(df[credit_src]).abs()
        else:
            norm_df["credit"] = 0.0

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


def _infer_account_category(account_name: str, description: str, account_code: str = "") -> str:
    combined_text = f"{str(account_name).lower()} {str(description).lower()} {str(account_code).lower()}".strip()

    # 1. Standard Keyword Matching
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

    # 2. Standard Global Accounting GL Code Numeric Prefix Rules
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

    return "OPEX"
