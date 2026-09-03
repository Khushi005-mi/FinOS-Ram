"""
backend/app/engine/quality_engine.py

STATION 4: Data Quality Engine
Audits standardized canonical DataFrames, detects structural and accounting anomalies,
and generates an observable DataQualityReport with an automated Quality Score.
"""
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
import pandas as pd


@dataclass
class DataQualityReport:
    total_records: int
    valid_records: int
    duplicate_records: int
    missing_dates_count: int
    missing_account_names: int
    negative_amount_anomalies: int
    unclassified_categories: int
    total_debit: float
    total_credit: float
    variance: float
    is_balanced: bool
    quality_score: float  # 0.0 to 100.0%
    quality_grade: str    # A (Excellent), B (Good), C (Attention Required), F (Critical)
    quality_warnings: List[str] = field(default_factory=list)


class DataQualityEngine:
    @classmethod
    def audit_canonical_dataframe(cls, df: pd.DataFrame, tolerance: float = 0.01) -> DataQualityReport:
        """
        Executes comprehensive data quality inspection on canonical financial DataFrame.
        """
        if df.empty:
            return cls._empty_report()

        warnings: List[str] = []
        total_rows = len(df)

        # 1. Duplicate Detection (Identical date, account, and debit/credit)
        dup_mask = df.duplicated(subset=["transaction_date", "account_name", "debit", "credit"], keep=False)
        duplicate_count = int(dup_mask.sum())
        if duplicate_count > 0:
            warnings.append(f"{duplicate_count} duplicate transaction rows detected.")

        # 2. Missing Dates & Account Names Check
        missing_dates = int(df["transaction_date"].isna().sum())
        missing_accounts = int((df["account_name"].isna() | (df["account_name"].astype(str).str.strip() == "")).sum())
        if missing_accounts > 0:
            warnings.append(f"{missing_accounts} rows have missing account names (auto-labeled).")

        # 3. Negative Value Anomalies Check (Debits/Credits should be non-negative)
        neg_debits = int((df["debit"] < 0).sum()) if "debit" in df.columns else 0
        neg_credits = int((df["credit"] < 0).sum()) if "credit" in df.columns else 0
        negative_anomalies = neg_debits + neg_credits
        if negative_anomalies > 0:
            warnings.append(f"{negative_anomalies} negative debit/credit values flagged.")

        # 4. Unclassified Categories Check
        unclassified = int((df["account_category"].astype(str).str.upper() == "UNKNOWN").sum()) if "account_category" in df.columns else 0
        if unclassified > 0:
            warnings.append(f"{unclassified} accounts required directional fallback classification.")

        # 5. Accounting Balance Audit (Debit vs Credit Variance)
        total_debit = float(df["debit"].sum()) if "debit" in df.columns else 0.0
        total_credit = float(df["credit"].sum()) if "credit" in df.columns else 0.0
        variance = round(abs(total_debit - total_credit), 2)
        is_balanced = variance <= tolerance

        if not is_balanced:
            warnings.append(f"Ledger is unbalanced by ₹{variance:,.2f} (Debits: ₹{total_debit:,.2f}, Credits: ₹{total_credit:,.2f}).")

        # 6. Calculate Quality Score (0 to 100%)
        deductions = 0.0
        if total_rows > 0:
            deductions += (duplicate_count / total_rows) * 15.0
            deductions += (missing_accounts / total_rows) * 20.0
            deductions += (negative_anomalies / total_rows) * 25.0
            deductions += (unclassified / total_rows) * 10.0

        quality_score = max(0.0, min(100.0, round(100.0 - deductions, 1)))

        # Assign Grade
        if quality_score >= 90.0:
            grade = "A (Excellent)"
        elif quality_score >= 75.0:
            grade = "B (Good)"
        elif quality_score >= 50.0:
            grade = "C (Attention Required)"
        else:
            grade = "F (Critical)"

        valid_rows = total_rows - negative_anomalies

        return DataQualityReport(
            total_records=total_rows,
            valid_records=valid_rows,
            duplicate_records=duplicate_count,
            missing_dates_count=missing_dates,
            missing_account_names=missing_accounts,
            negative_amount_anomalies=negative_anomalies,
            unclassified_categories=unclassified,
            total_debit=total_debit,
            total_credit=total_credit,
            variance=variance,
            is_balanced=is_balanced,
            quality_score=quality_score,
            quality_grade=grade,
            quality_warnings=warnings,
        )

    @staticmethod
    def _empty_report() -> DataQualityReport:
        return DataQualityReport(
            total_records=0, valid_records=0, duplicate_records=0,
            missing_dates_count=0, missing_account_names=0,
            negative_amount_anomalies=0, unclassified_categories=0,
            total_debit=0.0, total_credit=0.0, variance=0.0,
            is_balanced=True, quality_score=100.0, quality_grade="A (Excellent)",
            quality_warnings=["Dataset is empty."],
        )
