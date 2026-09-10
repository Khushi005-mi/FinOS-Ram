"""
backend/app/engine/validator.py
Enterprise Accounting Validation Gate:
- Evaluates total debits, total credits, and variance using exact Decimal math
- Enforces strict double-entry balance constraints for balanced ledgers
- Identifies single-leg operational feeds (Expense registers, Sales registers)
  and calculates explicit, auditable clearing offset legs.
"""
from decimal import Decimal, InvalidOperation
from typing import List, Optional, Any
import pandas as pd
from pydantic import BaseModel, Field


class ValidationResult(BaseModel):
    is_valid: bool
    is_balanced: bool
    is_operational_feed: bool = False
    requires_offset: bool = False
    offset_category: Optional[str] = None
    offset_debit: Decimal = Decimal("0.0000")
    offset_credit: Decimal = Decimal("0.0000")
    total_debit: Decimal
    total_credit: Decimal
    variance: Decimal
    row_count: int
    validation_errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


def _to_decimal(val: Any) -> Decimal:
    if val is None or pd.isna(val):
        return Decimal("0.0000")
    if isinstance(val, Decimal):
        return val
    try:
        clean_str = str(val).replace(",", "").replace("$", "").replace("₹", "").strip()
        if not clean_str or clean_str.lower() in ["nan", "none", "null"]:
            return Decimal("0.0000")
        return Decimal(clean_str).quantize(Decimal("0.0001"))
    except (InvalidOperation, ValueError):
        return Decimal("0.0000")


def validate_ledger_dataframe(
    df: pd.DataFrame,
    allow_operational_offset: bool = True,
    rounding_tolerance: Decimal = Decimal("0.0000"),
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

    total_debit = Decimal("0.0000")
    if "debit" in df.columns:
        total_debit = sum((_to_decimal(v) for v in df["debit"]), Decimal("0.0000"))

    total_credit = Decimal("0.0000")
    if "credit" in df.columns:
        total_credit = sum((_to_decimal(v) for v in df["credit"]), Decimal("0.0000"))

    variance = abs(total_debit - total_credit)
    is_balanced = variance <= rounding_tolerance

    is_operational_feed = False
    requires_offset = False
    offset_category = None
    offset_debit = Decimal("0.0000")
    offset_credit = Decimal("0.0000")

    if not is_balanced:
        # Case A: Operational Expense Register (Debits > 0, Credits == 0)
        if total_debit > 0 and total_credit == Decimal("0.0000") and allow_operational_offset:
            is_operational_feed = True
            requires_offset = True
            offset_category = "LIABILITY"
            offset_credit = total_debit  # Offsets to Accounts Payable / Ingestion Clearing
            warnings.append(
                f"Single-Leg Operational Feed Detected: Ingesting ₹{total_debit:,.2f} in expense debits. "
                "An auditable system clearing credit entry will be established in Liabilities."
            )
        # Case B: Operational Sales Register (Credits > 0, Debits == 0)
        elif total_credit > 0 and total_debit == Decimal("0.0000") and allow_operational_offset:
            is_operational_feed = True
            requires_offset = True
            offset_category = "ASSET"
            offset_debit = total_credit  # Offsets to Accounts Receivable / Ingestion Clearing
            warnings.append(
                f"Single-Leg Operational Feed Detected: Ingesting ₹{total_credit:,.2f} in revenue credits. "
                "An auditable system clearing debit entry will be established in Assets."
            )
        else:
            # Case C: Genuine Accounting Imbalance in a Dual-Entry Ledger
            errors.append(
                f"Double-Entry Accounting Imbalance Detected: Total Debits ({total_debit:,.4f}) "
                f"do not match Total Credits ({total_credit:,.4f}). "
                f"Net Imbalance Variance: {variance:,.4f}. "
                "FinOS requires balanced ledgers or explicit single-leg operational feeds."
            )

    return ValidationResult(
        is_valid=len(errors) == 0,
        is_balanced=is_balanced,
        is_operational_feed=is_operational_feed,
        requires_offset=requires_offset,
        offset_category=offset_category,
        offset_debit=offset_debit,
        offset_credit=offset_credit,
        total_debit=total_debit,
        total_credit=total_credit,
        variance=variance,
        row_count=len(df),
        validation_errors=errors,
        warnings=warnings,
    )
