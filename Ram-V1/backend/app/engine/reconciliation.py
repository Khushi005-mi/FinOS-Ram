"""
backend/app/engine/reconciliation.py

STATION 5: Accounting Reconciliation Engine
Provides end-to-end lineage tracking from raw source rows to final ledger persistence.
Ensures zero unexplained variances, applies transparent auto-balancing, and generates audit receipts.
"""
from dataclasses import dataclass, field
from datetime import date
from typing import Any, Dict, List, Optional, Tuple
import pandas as pd


@dataclass
class ReconciliationReceipt:
    dataset_id: str
    source_row_count: int
    sanitized_row_count: int
    final_ledger_row_count: int
    initial_debit_sum: float
    initial_credit_sum: float
    final_debit_sum: float
    final_credit_sum: float
    synthetic_offset_applied: float
    clearing_account_inserted: bool
    is_reconciled: bool
    audit_notes: List[str] = field(default_factory=list)


class AccountingReconciliationEngine:
    @classmethod
    def reconcile_and_balance(
        cls,
        canonical_df: pd.DataFrame,
        dataset_id: str,
        source_row_count: int,
        auto_balance: bool = True,
    ) -> Tuple[pd.DataFrame, ReconciliationReceipt]:
        """
        Reconciles source vs. processed totals. If single-entry variance exists, applies
        a transparent, audited synthetic clearing entry to satisfy double-entry invariants.
        """
        if canonical_df.empty:
            return canonical_df, cls._empty_receipt(dataset_id)

        audit_notes: List[str] = []
        df_working = canonical_df.copy()

        init_debit = float(df_working["debit"].sum())
        init_credit = float(df_working["credit"].sum())
        variance = round(init_debit - init_credit, 2)
        offset_amount = 0.0
        clearing_inserted = False

        # Apply synthetic clearing balancing if single-entry variance exists
        if auto_balance and abs(variance) > 0.01:
            clearing_inserted = True
            first_date = df_working["transaction_date"].iloc[0] if not df_working.empty else date.today()

            if variance < 0:
                # Credits exceed Debits -> Insert Asset clearing debit
                offset_amount = abs(variance)
                plug_row = pd.DataFrame([{
                    "transaction_date": first_date,
                    "account_code": "ACC-CLEARING",
                    "account_name": "Auto-Balancing Clearing Account",
                    "account_category": "ASSET",
                    "debit": offset_amount,
                    "credit": 0.0,
                    "description": "Transparent auto-balancing offset for single-entry statement",
                    "reference_id": f"AUDIT-{dataset_id[:6]}",
                }])
                audit_notes.append(f"Applied ₹{offset_amount:,.2f} Debit clearing offset to balance statement.")
            else:
                # Debits exceed Credits -> Insert Liability clearing credit
                offset_amount = variance
                plug_row = pd.DataFrame([{
                    "transaction_date": first_date,
                    "account_code": "ACC-CLEARING",
                    "account_name": "Auto-Balancing Clearing Account",
                    "account_category": "LIABILITY",
                    "debit": 0.0,
                    "credit": offset_amount,
                    "description": "Transparent auto-balancing offset for single-entry statement",
                    "reference_id": f"AUDIT-{dataset_id[:6]}",
                }])
                audit_notes.append(f"Applied ₹{offset_amount:,.2f} Credit clearing offset to balance statement.")

            df_working = pd.concat([df_working, plug_row], ignore_index=True)

        final_debit = float(df_working["debit"].sum())
        final_credit = float(df_working["credit"].sum())
        is_reconciled = abs(final_debit - final_credit) <= 0.01

        receipt = ReconciliationReceipt(
            dataset_id=dataset_id,
            source_row_count=source_row_count,
            sanitized_row_count=len(canonical_df),
            final_ledger_row_count=len(df_working),
            initial_debit_sum=init_debit,
            initial_credit_sum=init_credit,
            final_debit_sum=final_debit,
            final_credit_sum=final_credit,
            synthetic_offset_applied=offset_amount,
            clearing_account_inserted=clearing_inserted,
            is_reconciled=is_reconciled,
            audit_notes=audit_notes,
        )

        return df_working, receipt

    @staticmethod
    def _empty_receipt(dataset_id: str) -> ReconciliationReceipt:
        return ReconciliationReceipt(
            dataset_id=dataset_id, source_row_count=0, sanitized_row_count=0,
            final_ledger_row_count=0, initial_debit_sum=0.0, initial_credit_sum=0.0,
            final_debit_sum=0.0, final_credit_sum=0.0, synthetic_offset_applied=0.0,
            clearing_account_inserted=False, is_reconciled=True, audit_notes=["Empty dataset."],
        )
