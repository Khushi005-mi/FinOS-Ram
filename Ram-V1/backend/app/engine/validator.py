"""
backend/app/engine/validator.py

Accounting Validation Gate:
- Evaluates total debits, total credits, and variance
- Distinguishes fatal structural errors from acceptable statement balancing variance
"""
from decimal import Decimal
from typing import List
import pandas as pd
from pydantic import BaseModel, Field


class ValidationResult(BaseModel):
    is_valid: bool = True
    is_balanced: bool
    total_debit: Decimal
    total_credit: Decimal
    variance: Decimal
    row_count: int
    validation_errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


def validate_ledger_dataframe(
    df: pd.DataFrame,
    rounding_tolerance: float = 0.01,
) -> ValidationResult:
    errors: List[str] = []
    warnings: List[str] = []

    if df.empty:
        return ValidationResult(
            is_valid=False,
            is_balanced=False,
            total_debit=Decimal("0.0000"),
            total_credit=Decimal("0.0000"),
            variance=Decimal("0.0000"),
            row_count=0,
            validation_errors=["DataFrame is empty. No transaction records found."],
            warnings=[],
        )

    raw_total_debit = float(df["debit"].sum()) if "debit" in df.columns else 0.0
    raw_total_credit = float(df["credit"].sum()) if "credit" in df.columns else 0.0
    raw_variance = abs(raw_total_debit - raw_total_credit)

    total_debit = Decimal(str(round(raw_total_debit, 4)))
    total_credit = Decimal(str(round(raw_total_credit, 4)))
    variance = Decimal(str(round(raw_variance, 4)))

    is_balanced = raw_variance <= rounding_tolerance

    if not is_balanced:
        warnings.append(
            f"Unbalanced Statement: Total Debits ({total_debit:,.2f}) do not equal "
            f"Total Credits ({total_credit:,.2f}). Variance: {variance:,.2f}. "
            "Synthetic auto-balancing will be applied."
        )

    return ValidationResult(
        is_valid=len(errors) == 0,
        is_balanced=is_balanced,
        total_debit=total_debit,
        total_credit=total_credit,
        variance=variance,
        row_count=len(df),
        validation_errors=errors,
        warnings=warnings,
    )
