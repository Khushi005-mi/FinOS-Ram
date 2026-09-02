"""
backend/app/engine/mapper.py

Universal Financial Cognitive Normalizer:
- Stemmed Financial Taxonomy: Matches all word variations (server/servers, cost/costs, salary/salaries).
- Context-Aware Single Amount Resolution: Direct expenses/COGS mapped to Debits; Revenue to Credits.
- Alphanumeric Purity Guard: Rejects codes like 'Code_991' or 'INV-88' from being parsed as numbers.
- Decodes all international number formats (Indian 12,34,567.89, European 1.234,56, Tally Cr/Dr suffixes).
- 360° Chart of Accounts Taxonomy & GL Code Ranges (4xxx, 5xxx, 6xxx).
"""
import re
from datetime import date, datetime
from typing import Dict, List, Optional, Any, Tuple
import pandas as pd
import numpy as np

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

# Universal Header Synonyms
COLUMN_SYNONYMS: Dict[str, List[str]] = {
    "transaction_date": [
        "date", "transaction_date", "txn_date", "trans_date", "post_date",
        "value_date", "booking_date", "invoice_date", "bill_date", "period",
        "day", "time", "voucher_date", "chq_date", "posting_date", "tax_period", "month"
    ],
    "account_name": [
        "account", "account_name", "particulars", "description", "narration",
        "account_description", "ledger", "ledger_name", "item", "line_item",
        "details", "payee", "vendor", "customer", "party_name", "party",
        "entity", "category", "head", "account_head", "product", "item_name",
        "line_item_description", "source", "client", "merchant", "recipient"
    ],
    "account_code": [
        "code", "account_code", "gl_code", "acct_code", "acc_no", "account_number",
        "ledger_code", "gl", "acct_id", "hsn", "sac", "sku", "tax_record_id"
    ],
    "debit": [
        "debit", "dr", "dr_amount", "debit_amount", "withdrawal", "outflow",
        "payment", "spend", "charge", "expense", "dr_inr", "debit_inr", "debit_usd",
        "paid_out", "money_out", "dr_val"
    ],
    "credit": [
        "credit", "cr", "cr_amount", "credit_amount", "deposit", "inflow",
        "receipt", "income_amount", "sales", "cr_inr", "credit_inr", "credit_usd",
        "paid_in", "money_in", "cr_val"
    ],
    "amount": [
        "amount", "taxable_revenue", "revenue", "sales", "net_amount", "total",
        "txn_amount", "value", "line_total", "figure", "taxable_value",
        "invoice_value", "grand_total", "net", "transaction_amount", "payout",
        "settlement", "total_amount", "gross_amount", "balance", "net_val"
    ],
    "reference_id": [
        "ref", "reference", "reference_id", "txn_id", "transaction_id",
        "invoice_no", "inv_no", "voucher_no", "cheque_no", "check_no", "id",
        "doc_no", "bill_no", "order_id", "tax_record_id", "chq_no"
    ],
}

# 360-Degree Stemmed Taxonomy: Matches root stems across all singular/plural/compound variations
CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "COGS": [
        # Materials, Production & Physical COGS
        r"\bcogs", r"\bcost of (?:goods|sales)", r"\bdirect cost", r"\braw material",
        r"\binventory", r"\bfreight", r"\bshipping", r"\bdirect labo[u]?r", r"\bmanufactur",
        r"\bproduction", r"\bsteel", r"\balloy", r"\bstock", r"\bpackag", r"\bpacking",
        r"\bconsumable", r"\bjobwork", r"\bcustoms? duty", r"\bimport duty", r"\bcarriage inward",
        r"\bclearing charge", r"\bpurchase", r"\bdirect material",
        # Tech, Cloud & Infrastructure COGS
        r"\bhosting", r"\bserver", r"\bcloud", r"\baws", r"\bazure", r"\bgcp",
        r"\bdevops", r"\bapi cost", r"\bsupport labo[u]?r", r"\bdelivery fee", r"\bmerchant fee",
        r"\bpayment gateway", r"\bstripe", r"\brazorpay", r"\binfrastructure",
        r"\bsubcontractor", r"\boutsourced labo[u]?r"
    ],
    "REVENUE": [
        # Inflow & Sales Stems
        r"\bsale", r"\brevenue", r"\bincome", r"\bturnover", r"\bbilling", r"\bsubscription",
        r"\barr", r"\bmrr", r"\bservice fee", r"\bconsulting", r"\binterest income",
        r"\bsettlement", r"\bpayout", r"\binflow", r"\bcontract", r"\bfunding", r"\breceipt",
        r"\bprofessional service", r"\bdirect income", r"\bexport sale", r"\bdomestic sale",
        r"\bcommission received", r"\bdiscount received", r"\binvoice", r"\bcustomer payment",
        r"\blicens", r"\btaxable[_\s]revenue", r"\bclient fee", r"\bplatform fee", r"\bmembership",
        r"\bpayouts? received"
    ],
    "OPEX": [
        # Operating & Administrative Stems
        r"\bsalar", r"\bpayroll", r"\bwage", r"\brent", r"\boffice", r"\butilit",
        r"\belectricity", r"\binternet", r"\bsoftware", r"\bsaas",
        r"\bmarketing", r"\badvertis", r"\bgoogle ad", r"\bfacebook ad", r"\bmeta ad",
        r"\btravel", r"\blegal", r"\baccounting", r"\baudit", r"\binsurance", r"\bdepreciation",
        r"\bamortization", r"\brepair", r"\bmaintenance", r"\btelephone", r"\bstationer",
        r"\badmin", r"\bexpense", r"\boperating expense", r"\bopex", r"\bwework",
        r"\bdirector remuneration", r"\bprinting", r"\bcourier", r"\bsecurity service",
        r"\bconsultanc", r"\bstaff welfare", r"\bbank charge", r"\bindirect expense",
        r"\bproperty tax", r"\bmeal", r"\bentertainment", r"\boffice supplies", r"\bfuel", r"\bconveyance"
    ],
    "ASSET": [
        r"\bcash", r"\bbank", r"\bchecking", r"\bsaving", r"\baccounts? receivable", r"\bdebtor",
        r"\bsundry debtor", r"\bprepaid", r"\bequipment", r"\bmachiner", r"\bfurniture",
        r"\bbuilding", r"\bland", r"\bsecurity deposit", r"\bhdfc", r"\bicici", r"\bsbi",
        r"\bfixed asset", r"\bcurrent asset", r"\btds receivable", r"\bgst input", r"\bpetty cash"
    ],
    "LIABILITY": [
        r"\baccounts? payable", r"\bcreditor", r"\bsundry creditor", r"\bloan", r"\bborrowing",
        r"\bcredit card", r"\bmortgage", r"\btax payable", r"\baccrued", r"\boverdraft",
        r"\bsupplier", r"\bgst payable", r"\bgst[_\s]liability", r"\btds payable", r"\bduties and taxes", r"\bcurrent liabilit"
    ],
    "EQUITY": [
        r"\bcapital", r"\bequity", r"\bretained earning", r"\bshareholder", r"\bcommon stock",
        r"\bdrawing", r"\bdividend", r"\bpartner capital", r"\bshare capital"
    ],
}

SUMMARY_ROW_PATTERNS = re.compile(
    r"^(?:total|grand total|sub total|subtotal|summary|balance b/f|balance c/f|closing balance|opening balance)\b",
    re.IGNORECASE
)

DATE_DELIMITER_PATTERN = re.compile(r"[-/\s.]")
NON_CURRENCY_TEXT_PATTERN = re.compile(r"[a-zA-Z_#@!]")


def _parse_international_number(val: Any) -> Tuple[float, Optional[str]]:
    """Decodes arbitrary international numbers with currency and alphanumeric purity safety."""
    if pd.isna(val) or val is None:
        return 0.0, None

    if isinstance(val, (int, float, np.integer, np.floating)):
        return float(val), None

    s = str(val).strip()
    if s == "" or s.lower() in ["nan", "none", "null", "—", "-"]:
        return 0.0, None

    direction = None
    if re.search(r"\b(?:cr|credit|deposit|inflow)\b", s, re.IGNORECASE):
        direction = "CR"
    elif re.search(r"\b(?:dr|debit|withdrawal|outflow|payment)\b", s, re.IGNORECASE):
        direction = "DR"

    # Remove currency words before checking text purity
    clean_text = re.sub(r"\b(?:cr|dr|inr|usd|eur|gbp|aed|rs|rupees?|dollars?)\b", "", s, flags=re.IGNORECASE)
    clean_text = re.sub(r"[$₹€£¥,\s.()-]", "", clean_text)

    # Reject non-currency alphanumeric strings like 'Code_991' or 'INV-01'
    if NON_CURRENCY_TEXT_PATTERN.search(clean_text):
        return 0.0, None

    is_negative = bool(re.match(r"^\(.*\)$", s)) or s.endswith("-")
    cleaned = re.sub(r"[^\d.,-]", "", s)
    if not cleaned or cleaned == "-":
        return 0.0, direction

    if "," in cleaned and "." in cleaned:
        if cleaned.rfind(",") > cleaned.rfind("."):
            cleaned = cleaned.replace(".", "").replace(",", ".")
        else:
            cleaned = cleaned.replace(",", "")
    elif "," in cleaned and "." not in cleaned:
        parts = cleaned.split(",")
        if len(parts) == 2 and len(parts[1]) in [1, 2]:
            cleaned = cleaned.replace(",", ".")
        else:
            cleaned = cleaned.replace(",", "")

    try:
        num = float(cleaned)
        if is_negative and num > 0:
            num = -num
        return num, direction
    except Exception:
        return 0.0, direction


def _strip_summary_rows(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df
    mask_to_drop = pd.Series(False, index=df.index)
    for col in df.columns[:min(3, len(df.columns))]:
        str_col = df[col].astype(str).str.strip()
        matched = str_col.str.contains(SUMMARY_ROW_PATTERNS, na=False)
        mask_to_drop = mask_to_drop | matched
    return df[~mask_to_drop].reset_index(drop=True)


def auto_map_columns(raw_columns: List[str]) -> Dict[str, str]:
    mapping: Dict[str, str] = {}
    used_canonical = set()

    for col in raw_columns:
        c_clean = re.sub(r"[^a-zA-Z0-9]", "", str(col).lower())
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
                    break
            if col in mapping.values():
                break

    if "debit" not in mapping and "credit" not in mapping and "amount" not in mapping:
        for col in raw_columns:
            c_clean = re.sub(r"[^a-zA-Z0-9]", "", str(col).lower())
            if any(k in c_clean for k in ["taxablerevenue", "revenue", "sales", "taxablevalue", "amount", "total", "net", "val"]):
                mapping["amount"] = col
                break

    return mapping


def _fingerprint_columns(df: pd.DataFrame) -> Dict[str, str]:
    mapping: Dict[str, str] = auto_map_columns(list(df.columns))
    if df.empty:
        return mapping

    for col in df.columns:
        if col in mapping.values():
            continue
        sample = df[col].dropna().head(15)
        if sample.empty:
            continue

        if "debit" not in mapping and "amount" not in mapping:
            if pd.api.types.is_numeric_dtype(df[col]):
                mapping["amount"] = col
                continue
            else:
                parsed_nums = [_parse_international_number(v)[0] for v in sample]
                valid_count = sum(1 for n in parsed_nums if abs(n) > 0)
                if valid_count >= len(sample) * 0.6 and max([abs(n) for n in parsed_nums], default=0) > 10:
                    mapping["amount"] = col
                    continue

        if "transaction_date" not in mapping:
            if sample.dtype == "object":
                has_delimiters = sample.astype(str).apply(lambda x: bool(DATE_DELIMITER_PATTERN.search(x))).mean()
                if has_delimiters >= 0.6:
                    try:
                        date_parsed = pd.to_datetime(sample, errors="coerce", dayfirst=True)
                        if date_parsed.notna().sum() >= len(sample) * 0.6:
                            mapping["transaction_date"] = col
                            continue
                    except Exception:
                        pass

        if "account_name" not in mapping:
            if df[col].dtype == "object":
                mapping["account_name"] = col
                continue

    return mapping


def map_and_normalize_dataframe(
    df: pd.DataFrame,
    column_mapping: Optional[Dict[str, str]] = None,
    default_category: str = "GENERAL_SMB",
) -> pd.DataFrame:
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
        if len(text_cols) > 0:
            norm_df["account_name"] = clean_df[text_cols[0]]
        else:
            amount_col_name = str(final_mapping.get("amount", "Financial Line Item")).replace("_", " ").title()
            norm_df["account_name"] = amount_col_name

    norm_df["account_name"] = norm_df["account_name"].fillna("General Ingested Line").astype(str).str.strip()

    # 2. Resolve Description
    if "description" in final_mapping and final_mapping["description"] in clean_df.columns:
        norm_df["description"] = clean_df[final_mapping["description"]].fillna(norm_df["account_name"]).astype(str)
    else:
        norm_df["description"] = norm_df["account_name"]

    # 3. Resolve Account Code
    if "account_code" in final_mapping and final_mapping["account_code"] in clean_df.columns:
        norm_df["account_code"] = clean_df[final_mapping["account_code"]].fillna("").astype(str)
    else:
        norm_df["account_code"] = [f"ACC-{i+1:04d}" for i in range(len(norm_df))]

    # 4. Resolve Reference ID
    if "reference_id" in final_mapping and final_mapping["reference_id"] in clean_df.columns:
        norm_df["reference_id"] = clean_df[final_mapping["reference_id"]].astype(str)
    elif "account_code" in final_mapping and "id" in str(final_mapping["account_code"]).lower():
        norm_df["reference_id"] = clean_df[final_mapping["account_code"]].astype(str)
    else:
        norm_df["reference_id"] = None

    # 5. Extract & Normalize Amounts with Universal Number Decoding
    norm_df = _process_amounts_universal(clean_df, norm_df, final_mapping)

    # 6. Normalize Dates
    norm_df = _process_dates(clean_df, norm_df, final_mapping)

    return norm_df[CANONICAL_FIELDS]


def _process_amounts_universal(df: pd.DataFrame, norm_df: pd.DataFrame, mapping: Dict[str, str]) -> pd.DataFrame:
    """Universal amount extraction with context-aware debits and credits."""
    debit_src = mapping.get("debit")
    credit_src = mapping.get("credit")
    amount_src = mapping.get("amount")

    if not amount_src and "amount" in df.columns:
        amount_src = "amount"

    # Mode 1: Explicit Debit & Credit Columns (General Ledger)
    if debit_src and credit_src and debit_src != credit_src and debit_src in df.columns and credit_src in df.columns:
        norm_df["debit"] = [abs(_parse_international_number(v)[0]) for v in df[debit_src]]
        norm_df["credit"] = [abs(_parse_international_number(v)[0]) for v in df[credit_src]]
        
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

    # Mode 2: Single Amount Column (Invoices, Tax Reports, P&Ls, Bank Statements)
    target_col = amount_src if (amount_src and amount_src in df.columns) else debit_src or credit_src
    if target_col and target_col in df.columns:
        parsed_results = [_parse_international_number(v) for v in df[target_col]]
        raw_amounts = [r[0] for r in parsed_results]
        inferred_directions = [r[1] for r in parsed_results]
        col_header_clean = str(target_col).lower().replace("_", " ")

        is_header_explicit_revenue = any(k in col_header_clean for k in ["taxable revenue", "revenue", "sales", "turnover", "inflow", "receipt"])

        base_categories = [
            _identify_base_taxonomy(
                str(norm_df.iloc[i]["account_name"]),
                str(norm_df.iloc[i]["description"]),
                str(norm_df.iloc[i]["account_code"]),
                source_header=col_header_clean
            )
            for i in range(len(norm_df))
        ]

        debits = []
        credits = []
        final_categories = []

        for i, amt in enumerate(raw_amounts):
            cat = base_categories[i]
            direction = inferred_directions[i]

            if direction == "CR":
                credits.append(abs(amt))
                debits.append(0.0)
                final_categories.append(cat if cat != "UNKNOWN" else "REVENUE")
            elif direction == "DR":
                debits.append(abs(amt))
                credits.append(0.0)
                final_categories.append(cat if cat != "UNKNOWN" else "OPEX")
            elif is_header_explicit_revenue:
                credits.append(abs(amt))
                debits.append(0.0)
                final_categories.append("REVENUE")
            elif cat == "COGS":
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


def _identify_base_taxonomy(account_name: str, description: str, account_code: str = "", source_header: str = "") -> str:
    combined_text = f"{str(account_name).lower()} {str(description).lower()} {str(account_code).lower()} {str(source_header).lower()}".strip()

    # 1. Check direct category keyword stems
    for pattern in CATEGORY_KEYWORDS["COGS"]:
        if re.search(pattern, combined_text):
            return "COGS"

    for pattern in CATEGORY_KEYWORDS["REVENUE"]:
        if re.search(pattern, combined_text):
            return "REVENUE"

    for pattern in CATEGORY_KEYWORDS["OPEX"]:
        if pattern == r"\bproperty tax" and "tax-" in combined_text:
            continue
        if re.search(pattern, combined_text):
            return "OPEX"

    for pattern in CATEGORY_KEYWORDS["ASSET"]:
        if re.search(pattern, combined_text):
            return "ASSET"

    for pattern in CATEGORY_KEYWORDS["LIABILITY"]:
        if re.search(pattern, combined_text):
            return "LIABILITY"

    for pattern in CATEGORY_KEYWORDS["EQUITY"]:
        if re.search(pattern, combined_text):
            return "EQUITY"

    # 2. Standard GL Numeric Code Rules (4xxx, 5xxx, 6xxx)
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
