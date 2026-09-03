"""
backend/app/engine/standardizer.py

STATION 3: Financial Standardization Engine
Transforms structurally sanitized DataFrames into the canonical 8-field financial schema.
Applies 360-degree Chart of Accounts taxonomy, decodes regional numbers, and emits an audit receipt.
"""
from dataclasses import dataclass, field
from datetime import date
from typing import Any, Dict, List, Optional, Tuple
import pandas as pd

from app.engine.data_understanding import DatasetTopologyProfile
from app.engine.mapper import (
    CANONICAL_FIELDS,
    _parse_international_number,
    _identify_base_taxonomy,
    _classify_account,
    auto_map_columns,
)


@dataclass
class StandardizationReceipt:
    total_records: int
    revenue_rows: int
    cogs_rows: int
    opex_rows: int
    asset_rows: int
    liability_rows: int
    equity_rows: int
    total_debit: float
    total_credit: float
    detected_currency: str
    inferred_mappings: Dict[str, str] = field(default_factory=dict)


class FinancialStandardizerEngine:
    @classmethod
    def standardize_to_canonical(
        cls,
        df_sanitized: pd.DataFrame,
        profile: Optional[DatasetTopologyProfile] = None,
        custom_mapping: Optional[Dict[str, str]] = None,
    ) -> Tuple[pd.DataFrame, StandardizationReceipt]:
        """
        Converts sanitized table into canonical ledger DataFrame and generates an audit receipt.
        """
        if df_sanitized.empty:
            return pd.DataFrame(columns=CANONICAL_FIELDS), cls._empty_receipt()

        # 1. Resolve column mappings using understanding profile or heuristic matcher
        column_mapping = custom_mapping or {}
        if not column_mapping:
            if profile and profile.column_semantics:
                column_mapping = {
                    col: sem.inferred_role.lower()
                    for col, sem in profile.column_semantics.items()
                    if sem.inferred_role != "UNKNOWN"
                }
            if not column_mapping:
                column_mapping = auto_map_columns(list(df_sanitized.columns))

        # Build reverse lookup
        field_to_col: Dict[str, str] = {}
        for col, role in column_mapping.items():
            if role in ["date", "transaction_date"]:
                field_to_col["transaction_date"] = col
            elif role in ["account_name", "particulars", "description", "name"]:
                field_to_col["account_name"] = col
            elif role in ["account_code", "code"]:
                field_to_col["account_code"] = col
            elif role in ["debit", "dr"]:
                field_to_col["debit"] = col
            elif role in ["credit", "cr"]:
                field_to_col["credit"] = col
            elif role in ["amount", "total", "net"]:
                field_to_col["amount"] = col
            elif role in ["reference_id", "reference", "ref"]:
                field_to_col["reference_id"] = col

        norm_df = pd.DataFrame(index=df_sanitized.index)

        # 2. Resolve Account Name
        if "account_name" in field_to_col and field_to_col["account_name"] in df_sanitized.columns:
            norm_df["account_name"] = df_sanitized[field_to_col["account_name"]]
        else:
            text_cols = df_sanitized.select_dtypes(include=["object"]).columns
            norm_df["account_name"] = df_sanitized[text_cols[0]] if len(text_cols) > 0 else "Financial Line Item"

        norm_df["account_name"] = norm_df["account_name"].fillna("General Ingested Line").astype(str).str.strip()

        # 3. Resolve Description
        norm_df["description"] = norm_df["account_name"]

        # 4. Resolve Account Code
        if "account_code" in field_to_col and field_to_col["account_code"] in df_sanitized.columns:
            norm_df["account_code"] = df_sanitized[field_to_col["account_code"]].fillna("").astype(str)
        else:
            norm_df["account_code"] = [f"ACC-{i+1:04d}" for i in range(len(norm_df))]

        # 5. Resolve Reference ID
        if "reference_id" in field_to_col and field_to_col["reference_id"] in df_sanitized.columns:
            norm_df["reference_id"] = df_sanitized[field_to_col["reference_id"]].astype(str)
        else:
            norm_df["reference_id"] = None

        # 6. Extract Debits & Credits based on columns available
        norm_df = cls._extract_flows(df_sanitized, norm_df, field_to_col)

        # 7. Normalize Dates
        date_col = field_to_col.get("transaction_date")
        if date_col and date_col in df_sanitized.columns:
            norm_df["transaction_date"] = pd.to_datetime(df_sanitized[date_col], errors="coerce", dayfirst=True).dt.date.fillna(date.today())
        else:
            norm_df["transaction_date"] = date.today()

        canonical_df = norm_df[CANONICAL_FIELDS].copy()

        # 8. Generate Standardization Audit Receipt
        receipt = cls._generate_receipt(canonical_df, field_to_col, profile)

        return canonical_df, receipt

    @classmethod
    def _extract_flows(cls, df: pd.DataFrame, norm_df: pd.DataFrame, mapping: Dict[str, str]) -> pd.DataFrame:
        debit_col = mapping.get("debit")
        credit_col = mapping.get("credit")
        amount_col = mapping.get("amount")

        # Mode A: Explicit Debit and Credit Columns
        if debit_col and credit_col and debit_col in df.columns and credit_col in df.columns:
            norm_df["debit"] = [abs(_parse_international_number(v)[0]) for v in df[debit_col]]
            norm_df["credit"] = [abs(_parse_international_number(v)[0]) for v in df[credit_col]]
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

        # Mode B: Single Amount Column
        target_col = amount_col if (amount_col and amount_col in df.columns) else debit_col or credit_col
        if target_col and target_col in df.columns:
            parsed = [_parse_international_number(v) for v in df[target_col]]
            raw_amounts = [p[0] for p in parsed]
            directions = [p[1] for p in parsed]

            debits, credits, categories = [], [], []
            for i, amt in enumerate(raw_amounts):
                cat = _identify_base_taxonomy(
                    str(norm_df.iloc[i]["account_name"]),
                    str(norm_df.iloc[i]["description"]),
                    str(norm_df.iloc[i]["account_code"]),
                    source_header=str(target_col).lower()
                )
                dir_marker = directions[i]

                if dir_marker == "CR":
                    credits.append(abs(amt)); debits.append(0.0)
                    categories.append(cat if cat != "UNKNOWN" else "REVENUE")
                elif dir_marker == "DR":
                    debits.append(abs(amt)); credits.append(0.0)
                    categories.append(cat if cat != "UNKNOWN" else "OPEX")
                elif cat == "COGS":
                    debits.append(abs(amt)); credits.append(0.0); categories.append("COGS")
                elif cat == "OPEX":
                    debits.append(abs(amt)); credits.append(0.0); categories.append("OPEX")
                elif cat == "REVENUE":
                    credits.append(abs(amt)); debits.append(0.0); categories.append("REVENUE")
                elif cat in ["ASSET", "LIABILITY", "EQUITY"]:
                    if amt < 0: debits.append(abs(amt)); credits.append(0.0)
                    else: credits.append(abs(amt)); debits.append(0.0)
                    categories.append(cat)
                else:
                    if amt < 0: debits.append(abs(amt)); credits.append(0.0); categories.append("OPEX")
                    else: credits.append(abs(amt)); debits.append(0.0); categories.append("REVENUE")

            norm_df["debit"] = debits
            norm_df["credit"] = credits
            norm_df["account_category"] = categories
        else:
            norm_df["debit"] = 0.0
            norm_df["credit"] = 0.0
            norm_df["account_category"] = "OPEX"

        return norm_df

    @classmethod
    def _generate_receipt(
        cls, df: pd.DataFrame, mapping: Dict[str, str], profile: Optional[DatasetTopologyProfile]
    ) -> StandardizationReceipt:
        cats = df["account_category"].value_counts().to_dict()
        return StandardizationReceipt(
            total_records=len(df),
            revenue_rows=cats.get("REVENUE", 0),
            cogs_rows=cats.get("COGS", 0),
            opex_rows=cats.get("OPEX", 0),
            asset_rows=cats.get("ASSET", 0),
            liability_rows=cats.get("LIABILITY", 0),
            equity_rows=cats.get("EQUITY", 0),
            total_debit=float(df["debit"].sum()),
            total_credit=float(df["credit"].sum()),
            detected_currency=profile.detected_currency if profile else "INR",
            inferred_mappings=mapping,
        )

    @staticmethod
    def _empty_receipt() -> StandardizationReceipt:
        return StandardizationReceipt(
            total_records=0, revenue_rows=0, cogs_rows=0, opex_rows=0,
            asset_rows=0, liability_rows=0, equity_rows=0,
            total_debit=0.0, total_credit=0.0, detected_currency="INR",
            inferred_mappings={},
        )
