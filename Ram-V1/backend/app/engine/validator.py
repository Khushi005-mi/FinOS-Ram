from decimal import Decimal
from typing import List
import pandas as pd
from pydantic import BaseModel


class ValidationResult(BaseModel):
    """Structured audit result returned by the ledger validation engine."""
    is_balanced: bool
    total_debit: Decimal
    total_credit: Decimal
    variance: Decimal
    row_count: int
    validation_errors: List[str]


def validate_ledger_dataframe(
    df: pd.DataFrame,
    rounding_tolerance: float = 0.01,
) -> ValidationResult:
    """
    Performs accounting invariant checks on a normalized DataFrame.
    Verifies Debit = Credit balance and checks for missing dates or accounts.
    """
    errors: List[str] = []

    if df.empty:
        return ValidationResult(
            is_balanced=False,
            total_debit=Decimal("0.0000"),
            total_credit=Decimal("0.0000"),
            variance=Decimal("0.0000"),
            row_count=0,
            validation_errors=["DataFrame is empty. No transaction records found."],
        )

    # 1. Compute total Debits and Credits using fast vectorized summation
    raw_total_debit = float(df["debit"].sum())
    raw_total_credit = float(df["credit"].sum())
    raw_variance = abs(raw_total_debit - raw_total_credit)

    # Convert to Decimal for exact representation
    total_debit = Decimal(str(round(raw_total_debit, 4)))
    total_credit = Decimal(str(round(raw_total_credit, 4)))
    variance = Decimal(str(round(raw_variance, 4)))

    # 2. Verify Double-Entry Invariant (Debit = Credit within tolerance)
    is_balanced = raw_variance <= rounding_tolerance

    if not is_balanced:
        errors.append(
            f"Unbalanced Ledger: Total Debits (${total_debit:,.2f}) do not equal "
            f"Total Credits (${total_credit:,.2f}). Variance: ${variance:,.2f}."
        )

    # 3. Check for invalid or missing dates
    missing_date_count = df["transaction_date"].isna().sum()
    if missing_date_count > 0:
        errors.append(f"Found {missing_date_count} rows with missing or invalid transaction dates.")

    # 4. Check for missing account names
    missing_account_count = df["account_name"].isna().sum()
    if missing_account_count > 0:
        errors.append(f"Found {missing_account_count} rows with missing account names.")

    # 5. Check for invalid negative values in both debit and credit
    negative_debits = (df["debit"] < 0).sum()
    negative_credits = (df["credit"] < 0).sum()
    if negative_debits > 0 or negative_credits > 0:
        errors.append("Found rows with negative debit or credit amounts. Use zero or positive values.")

    return ValidationResult(
        is_balanced=is_balanced and len(errors) == 0,
        total_debit=total_debit,
        total_credit=total_credit,
        variance=variance,
        row_count=len(df),
        validation_errors=errors,
    )