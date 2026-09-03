"""
backend/app/engine/data_understanding.py

STATION 1: Autonomous Data Understanding Engine
Inspects raw tabular matrices prior to mutation to determine structural boundaries,
header locations, semantic column assignments, regional formatting, and dataset topology.
"""
from dataclasses import dataclass, field
import re
from typing import Any, Dict, List, Optional, Tuple
import pandas as pd


@dataclass
class ColumnSemantics:
    original_name: str
    inferred_role: str  # DATE, ACCOUNT_NAME, ACCOUNT_CODE, DEBIT, CREDIT, AMOUNT, REFERENCE, UNKNOWN
    confidence: float   # 0.0 to 1.0
    detected_data_type: str  # date, numeric, text, empty
    sample_values: List[str] = field(default_factory=list)


@dataclass
class DatasetTopologyProfile:
    topology_type: str  # DOUBLE_ENTRY_GL, SINGLE_ENTRY_STATEMENT, WIDE_PIVOTED_PNL, FLAT_INVOICE_LOG
    header_row_index: int
    data_start_row: int
    data_end_row: int
    total_raw_rows: int
    total_raw_cols: int
    detected_currency: str
    detected_number_format: str  # INDIAN_LAKHS, EUROPEAN, STANDARD
    column_semantics: Dict[str, ColumnSemantics] = field(default_factory=dict)
    metadata_banner_rows: List[int] = field(default_factory=list)


class DataUnderstandingEngine:
    ROLE_PATTERNS = {
        "DATE": re.compile(r"\b(?:date|txn date|trans date|post date|value date|booking date|voucher date|period|month|day)\b", re.IGNORECASE),
        "ACCOUNT_NAME": re.compile(r"\b(?:account|particulars|description|narration|ledger|party|vendor|customer|payee|item|details|entity|head|ledger head)\b", re.IGNORECASE),
        "ACCOUNT_CODE": re.compile(r"\b(?:code|gl code|acct code|acc no|account no|gl|hsn|sac|sku|code)\b", re.IGNORECASE),
        "DEBIT": re.compile(r"\b(?:debit|dr|withdrawal|outflow|payment|spend|charge|expense|money out|paid out)\b", re.IGNORECASE),
        "CREDIT": re.compile(r"\b(?:credit|cr|deposit|inflow|receipt|income|sales|money in|paid in)\b", re.IGNORECASE),
        "AMOUNT": re.compile(r"\b(?:amount|net amount|total amount|value|line total|taxable value|figure|balance|net)\b", re.IGNORECASE),
        "REFERENCE": re.compile(r"\b(?:ref|reference|voucher|invoice|inv no|txn id|doc no|bill no|order id|chq no)\b", re.IGNORECASE),
    }

    SUMMARY_PATTERNS = re.compile(r"\b(?:grand total|subtotal|sub total|total summary|closing balance|balance c/f)\b", re.IGNORECASE)
    DATE_DELIMITERS = re.compile(r"[-/\s.]")

    @classmethod
    def analyze_raw_matrix(cls, df_raw: pd.DataFrame) -> DatasetTopologyProfile:
        """Executes non-destructive structural analysis on the raw matrix."""
        if df_raw.empty:
            return cls._empty_profile(df_raw)

        # 1. Locate the true header row index (skipping top metadata banners)
        header_idx, banner_rows = cls._find_header_row(df_raw)

        # 2. Extract working table using detected header
        working_df = cls._align_table_headers(df_raw, header_idx)

        # 3. Locate data boundaries (where real rows start and where footers/totals begin)
        start_row, end_row = cls._find_data_boundaries(working_df)

        # 4. Profile column semantics and data types
        col_semantics = cls._profile_column_semantics(working_df.iloc[start_row:end_row])

        # 5. Detect regional number format & currency
        num_format, currency = cls._detect_regional_formats(working_df.iloc[start_row:end_row])

        # 6. Classify dataset topology
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
        """Detects header row by scoring text density and financial keyword matches."""
        banner_rows = []
        best_row_idx = 0
        best_score = -1.0

        scan_depth = min(10, len(df))
        for idx in range(scan_depth):
            raw_values = df.iloc[idx].dropna().astype(str).tolist()
            if not raw_values:
                banner_rows.append(idx)
                continue

            # Normalize underscores and hyphens to spaces for regex word boundaries
            row_normalized = [re.sub(r"[_\-\.]+", " ", v).strip() for v in raw_values]
            row_str = " ".join(row_normalized)

            # Disqualify summary rows from being headers
            if cls.SUMMARY_PATTERNS.search(row_str):
                continue

            # Calculate keyword match score
            matches = 0
            for val in row_normalized:
                for pattern in cls.ROLE_PATTERNS.values():
                    if pattern.search(val):
                        matches += 1
                        break

            # Headers contain text strings, not pure numbers
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
        """Promotes detected header row to DataFrame column names."""
        aligned = df.iloc[header_idx + 1:].copy().reset_index(drop=True)
        aligned.columns = [
            str(c).strip() if pd.notna(c) and str(c).strip() != "" else f"col_{i+1}"
            for i, c in enumerate(df.iloc[header_idx])
        ]
        return aligned

    @classmethod
    def _find_data_boundaries(cls, df: pd.DataFrame) -> Tuple[int, int]:
        """Detects where real records stop and trailing summaries/footers begin."""
        start_row = 0
        end_row = len(df)

        for idx in range(len(df) - 1, -1, -1):
            row_str = " ".join(df.iloc[idx].dropna().astype(str).values).lower()
            if any(k in row_str for k in ["grand total", "subtotal", "total summary", "audited by", "disclaimer"]):
                end_row = idx
            else:
                break

        return start_row, max(start_row + 1, end_row)

    @classmethod
    def _profile_column_semantics(cls, df: pd.DataFrame) -> Dict[str, ColumnSemantics]:
        """Classifies each column's semantic role using header matching + cell distribution."""
        semantics = {}

        for col in df.columns:
            col_str = str(col).strip()
            col_normalized = re.sub(r"[_\-\.]+", " ", col_str).strip()
            sample = df[col].dropna().head(20).astype(str).tolist()

            inferred_role = "UNKNOWN"
            confidence = 0.0
            data_type = "empty"

            # 1. Header Pattern Scoring
            for role, pattern in cls.ROLE_PATTERNS.items():
                if pattern.search(col_normalized):
                    inferred_role = role
                    confidence = 0.85
                    break

            # 2. Data-Type Distribution Inspection
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
        """Detects regional number formatting (Indian Lakhs vs. European vs. Standard) and Currency."""
        text_dump = " ".join(df.astype(str).values.flatten())

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
        """Determines if the financial matrix is a Double-Entry GL, Statement, or P&L."""
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
