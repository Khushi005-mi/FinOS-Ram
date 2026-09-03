"""
backend/app/engine/data_understanding.py

STAGE 1: Autonomous Data Understanding Engine
Guarantees 100% type-safety against NaN floats in empty cells.
"""
from dataclasses import dataclass, field
import re
from typing import Any, Dict, List, Optional, Tuple
import pandas as pd


@dataclass
class ColumnSemantics:
    original_name: str
    inferred_role: str
    confidence: float
    detected_data_type: str
    sample_values: List[str] = field(default_factory=list)


@dataclass
class DatasetTopologyProfile:
    topology_type: str
    header_row_index: int
    data_start_row: int
    data_end_row: int
    total_raw_rows: int
    total_raw_cols: int
    detected_currency: str
    detected_number_format: str
    column_semantics: Dict[str, ColumnSemantics] = field(default_factory=dict)
    metadata_banner_rows: List[int] = field(default_factory=list)


class DataUnderstandingEngine:
    ROLE_PATTERNS = {
        "DATE": re.compile(r"\b(?:date|txn date|trans date|post date|value date|booking date|voucher date|period|month|day|due date|paid date)\b", re.IGNORECASE),
        "ACCOUNT_NAME": re.compile(r"\b(?:account|particulars|description|narration|ledger|party|vendor|customer|payee|item|details|entity|head|ledger head|customer id|status)\b", re.IGNORECASE),
        "ACCOUNT_CODE": re.compile(r"\b(?:code|gl code|acct code|acc no|account no|gl|hsn|sac|sku|invoice id|inv id)\b", re.IGNORECASE),
        "DEBIT": re.compile(r"\b(?:debit|dr|withdrawal|outflow|payment|spend|charge|expense|money out|paid out)\b", re.IGNORECASE),
        "CREDIT": re.compile(r"\b(?:credit|cr|deposit|inflow|receipt|income|sales|money in|paid in)\b", re.IGNORECASE),
        "AMOUNT": re.compile(r"\b(?:amount|net amount|total amount|value|line total|taxable value|figure|balance|net|invoice amount)\b", re.IGNORECASE),
        "REFERENCE": re.compile(r"\b(?:ref|reference|voucher|invoice|inv no|txn id|doc no|bill no|order id|chq no|invoice id)\b", re.IGNORECASE),
    }

    SUMMARY_PATTERNS = re.compile(r"\b(?:grand total|subtotal|sub total|total summary|closing balance|balance c/f)\b", re.IGNORECASE)
    DATE_DELIMITERS = re.compile(r"[-/\s.]")

    @classmethod
    def analyze_raw_matrix(cls, df_raw: pd.DataFrame) -> DatasetTopologyProfile:
        if df_raw.empty:
            return cls._empty_profile(df_raw)

        header_idx, banner_rows = cls._find_header_row(df_raw)
        working_df = cls._align_table_headers(df_raw, header_idx)
        start_row, end_row = cls._find_data_boundaries(working_df)
        col_semantics = cls._profile_column_semantics(working_df.iloc[start_row:end_row])
        num_format, currency = cls._detect_regional_formats(working_df.iloc[start_row:end_row])
        topology = cls._classify_topology(col_semantics, working_df.iloc[start_row:end_row])

        return DatasetTopologyProfile(
            topology_type=topology,
            header_row_index=header_idx,
            data_start_row=start_row,
            data_end_row=end_row,
            total_raw_rows=len(df_raw),
            total_raw_cols=len(df_raw.columns),
            detected_currency=currency,
            detected_number_format=num_format,
            column_semantics=col_semantics,
            metadata_banner_rows=banner_rows,
        )

    @classmethod
    def _find_header_row(cls, df: pd.DataFrame) -> Tuple[int, List[int]]:
        banner_rows = []
        best_row_idx = 0
        best_score = -1.0

        scan_depth = min(10, len(df))
        for idx in range(scan_depth):
            raw_values = [str(v).strip() for v in df.iloc[idx].values if pd.notna(v) and str(v).strip() != ""]
            if not raw_values:
                banner_rows.append(idx)
                continue

            row_normalized = [re.sub(r"[_\-\.]+", " ", v).strip() for v in raw_values]
            row_str = " ".join(row_normalized)

            if cls.SUMMARY_PATTERNS.search(row_str):
                continue

            matches = 0
            for val in row_normalized:
                for pattern in cls.ROLE_PATTERNS.values():
                    if pattern.search(val):
                        matches += 1
                        break

            text_cells = sum(1 for v in raw_values if not re.match(r"^[\d\.,\s\(\)-]+$", v))
            score = (matches * 3.0) + (text_cells / len(raw_values) if raw_values else 0)

            if score > best_score and matches > 0:
                best_score = score
                best_row_idx = idx

        for i in range(best_row_idx):
            banner_rows.append(i)

        return best_row_idx, banner_rows

    @classmethod
    def _align_table_headers(cls, df: pd.DataFrame, header_idx: int) -> pd.DataFrame:
        if header_idx == 0:
            aligned = df.copy()
            aligned.columns = [str(c).strip() if pd.notna(c) and str(c).strip() != "" else f"col_{i+1}" for i, c in enumerate(df.columns)]
            return aligned

        aligned = df.iloc[header_idx + 1:].copy().reset_index(drop=True)
        aligned.columns = [
            str(c).strip() if pd.notna(c) and str(c).strip() != "" else f"col_{i+1}"
            for i, c in enumerate(df.iloc[header_idx])
        ]
        return aligned

    @classmethod
    def _find_data_boundaries(cls, df: pd.DataFrame) -> Tuple[int, int]:
        start_row = 0
        end_row = len(df)

        for idx in range(len(df) - 1, -1, -1):
            row_vals = [str(v).lower() for v in df.iloc[idx].values if pd.notna(v)]
            row_str = " ".join(row_vals)
            if any(k in row_str for k in ["grand total", "subtotal", "total summary", "audited by", "disclaimer"]):
                end_row = idx
            else:
                break

        return start_row, max(start_row + 1, end_row)

    @classmethod
    def _profile_column_semantics(cls, df: pd.DataFrame) -> Dict[str, ColumnSemantics]:
        semantics = {}

        for col in df.columns:
            col_str = str(col).strip()
            col_normalized = re.sub(r"[_\-\.]+", " ", col_str).strip()
            sample = [str(v).strip() for v in df[col].dropna().head(20).values if pd.notna(v) and str(v).strip() != ""]

            inferred_role = "UNKNOWN"
            confidence = 0.0
            data_type = "empty"

            for role, pattern in cls.ROLE_PATTERNS.items():
                if pattern.search(col_normalized):
                    inferred_role = role
                    confidence = 0.85
                    break

            if sample:
                if inferred_role in ["UNKNOWN", "DATE"]:
                    date_matches = sum(1 for v in sample if cls.DATE_DELIMITERS.search(v) and len(v) >= 6)
                    if date_matches >= len(sample) * 0.6:
                        inferred_role = "DATE"
                        confidence = 0.95
                        data_type = "date"

                if inferred_role in ["UNKNOWN", "AMOUNT", "DEBIT", "CREDIT"]:
                    num_matches = 0
                    for v in sample:
                        cleaned = re.sub(r"[$₹€£,\s().-]", "", v)
                        if re.match(r"^\d+$", cleaned):
                            num_matches += 1
                    
                    if num_matches >= len(sample) * 0.6:
                        data_type = "numeric"
                        if inferred_role == "UNKNOWN":
                            inferred_role = "AMOUNT"
                            confidence = 0.80

                if inferred_role == "UNKNOWN" and data_type == "empty":
                    if all(not re.match(r"^\d+$", v) for v in sample):
                        data_type = "text"
                        inferred_role = "ACCOUNT_NAME"
                        confidence = 0.70

            semantics[col_str] = ColumnSemantics(
                original_name=col_str,
                inferred_role=inferred_role,
                confidence=confidence,
                detected_data_type=data_type,
                sample_values=sample[:3],
            )

        return semantics

    @classmethod
    def _detect_regional_formats(cls, df: pd.DataFrame) -> Tuple[str, str]:
        safe_strings = [str(v) for v in df.values.flatten() if pd.notna(v) and str(v).strip() != ""]
        text_dump = " ".join(safe_strings)

        currency = "INR"
        if "$" in text_dump or "USD" in text_dump:
            currency = "USD"
        elif "€" in text_dump or "EUR" in text_dump:
            currency = "EUR"
        elif "£" in text_dump or "GBP" in text_dump:
            currency = "GBP"
        elif "AED" in text_dump:
            currency = "AED"

        number_format = "STANDARD"
        if re.search(r"\d+\.\d{3},\d{2}", text_dump) or re.search(r"\d+,\d{2}", text_dump):
            number_format = "EUROPEAN"
        elif re.search(r"\d+,\d{2},\d{3}", text_dump):
            number_format = "INDIAN_LAKHS"

        return number_format, currency

    @classmethod
    def _classify_topology(cls, semantics: Dict[str, ColumnSemantics], df: pd.DataFrame) -> str:
        roles = [s.inferred_role for s in semantics.values()]

        has_debit = "DEBIT" in roles
        has_credit = "CREDIT" in roles
        has_amount = "AMOUNT" in roles

        month_cols = sum(1 for c in df.columns if re.search(r"^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)", str(c).lower()))
        if month_cols >= 2:
            return "WIDE_PIVOTED_PNL"

        if has_debit and has_credit:
            return "DOUBLE_ENTRY_GL"
        elif has_amount:
            return "SINGLE_ENTRY_STATEMENT"

        return "FLAT_INVOICE_LOG"

    @classmethod
    def _empty_profile(cls, df: pd.DataFrame) -> DatasetTopologyProfile:
        return DatasetTopologyProfile(
            topology_type="EMPTY",
            header_row_index=0,
            data_start_row=0,
            data_end_row=0,
            total_raw_rows=len(df),
            total_raw_cols=len(df.columns),
            detected_currency="INR",
            detected_number_format="STANDARD",
            column_semantics={},
            metadata_banner_rows=[],
        )
