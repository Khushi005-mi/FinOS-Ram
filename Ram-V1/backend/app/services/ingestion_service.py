"""
backend/app/services/ingestion_service.py

STATION 6: Master Ingestion Service Orchestrator
Connects Stations 1 through 5 into an atomic, observable execution pipeline:
Parser -> Understanding -> Sanitization -> Standardization -> Quality Engine -> Reconciliation -> Database Persistence.
"""
import json
from datetime import date
import uuid
from decimal import Decimal
from typing import Any, Dict, List, Optional
from fastapi import UploadFile
import pandas as pd
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.journal_entry import JournalEntry
from app.db.models.organization import Organization
from app.db.models.upload_batch import UploadBatch
from app.engine.parser import FileParsingError, parse_file_stream
from app.engine.data_understanding import DataUnderstandingEngine
from app.engine.structural_sanitizer import StructuralSanitizerEngine
from app.engine.standardizer import FinancialStandardizerEngine
from app.engine.quality_engine import DataQualityEngine
from app.engine.reconciliation import AccountingReconciliationEngine


def _to_uuid(val: Any) -> uuid.UUID:
    if isinstance(val, uuid.UUID):
        return val
    try:
        return uuid.UUID(str(val))
    except Exception:
        return uuid.UUID("00000000-0000-0000-0000-000000000001")


def _safe_decimal(val: Any) -> Decimal:
    try:
        if pd.isna(val) or val is None or str(val).strip().lower() in ["nan", "none", "null", ""]:
            return Decimal("0.0000")
        clean_num = float(str(val).replace(",", "").replace("$", "").replace("₹", "").strip())
        return Decimal(str(round(clean_num, 4)))
    except Exception:
        return Decimal("0.0000")


class IngestionService:
    @staticmethod
    async def process_batch(
        db: AsyncSession,
        files: List[UploadFile],
        raw_metadata: str = "[]",
        organization_id: Any = "00000000-0000-0000-0000-000000000001",
        auto_balance: bool = True,
    ) -> Dict[str, Any]:
        try:
            metadata_list: List[Dict[str, Any]] = json.loads(raw_metadata) if raw_metadata else []
        except Exception:
            metadata_list = []

        org_uuid = _to_uuid(organization_id)
        batch_uuid = uuid.uuid4()
        batch_id_str = str(batch_uuid)

        # 1. Create UploadBatch tracking record
        batch = UploadBatch(
            id=batch_uuid,
            organization_id=org_uuid,
            status="PARSING",
            file_count=len(files),
            total_records_ingested=0,
        )
        db.add(batch)
        await db.commit()
        await db.refresh(batch)

        all_balanced_dfs: List[pd.DataFrame] = []
        pipeline_audit_receipts: List[Dict[str, Any]] = []

        try:
            for file in files:
                await file.seek(0)
                file_bytes = await file.read()

                if not file_bytes or len(file_bytes) == 0:
                    continue

                file_meta = next(
                    (m for m in metadata_list if m.get("fileName") == file.filename),
                    {},
                )
                custom_mapping = file_meta.get("columnMapping", {})
                source_type = file_meta.get("sourceType", "GENERAL_LEDGER")

                # STAGE 1: Raw File Stream Parsing
                raw_df = parse_file_stream(file.filename or "upload.csv", file_bytes)
                if raw_df.empty:
                    continue

                # STAGE 2: Autonomous Data Understanding
                profile = DataUnderstandingEngine.analyze_raw_matrix(raw_df)

                # STAGE 3: Structural Sanitization & De-noising
                sanitized_df, s_receipt = StructuralSanitizerEngine.sanitize_matrix(raw_df, profile)
                if sanitized_df.empty:
                    continue

                # STAGE 4: Financial Standardization & Canonical Schema Mapping
                canonical_df, std_receipt = FinancialStandardizerEngine.standardize_to_canonical(
                    sanitized_df, profile, custom_mapping=custom_mapping
                )
                canonical_df["source_type"] = source_type

                # STAGE 5: Data Quality Engine & Anomaly Audit
                q_report = DataQualityEngine.audit_canonical_dataframe(canonical_df)
                if not q_report.valid_records:
                    raise ValueError(f"Data quality validation failed for {file.filename}: zero valid records.")

                # STAGE 6: Accounting Reconciliation & Double-Entry Balancing Gate
                balanced_df, r_receipt = AccountingReconciliationEngine.reconcile_and_balance(
                    canonical_df=canonical_df,
                    dataset_id=batch_id_str,
                    source_row_count=len(raw_df),
                    auto_balance=auto_balance,
                )

                all_balanced_dfs.append(balanced_df)
                pipeline_audit_receipts.append({
                    "filename": file.filename,
                    "original_rows": len(raw_df),
                    "sanitized_rows": s_receipt["cleaned_rows"],
                    "quality_score": q_report.quality_score,
                    "quality_grade": q_report.quality_grade,
                    "is_reconciled": r_receipt.is_reconciled,
                    "clearing_offset": r_receipt.synthetic_offset_applied,
                })

            if not all_balanced_dfs:
                raise FileParsingError("No valid financial entries could be extracted from uploaded files.")

            consolidated_df = pd.concat(all_balanced_dfs, ignore_index=True)

            # Convert DataFrame rows into JournalEntry ORM models
            journal_entries: List[JournalEntry] = []
            for _, row in consolidated_df.iterrows():
                entry = JournalEntry(
                    id=uuid.uuid4(),
                    organization_id=org_uuid,
                    upload_batch_id=batch_uuid,
                    source_type=str(row.get("source_type", "GENERAL_LEDGER")),
                    account_code=str(row.get("account_code")) if row.get("account_code") else None,
                    account_name=str(row.get("account_name", "General Ingested Transaction")),
                    account_category=str(row.get("account_category", "OPEX")),
                    debit=_safe_decimal(row.get("debit")),
                    credit=_safe_decimal(row.get("credit")),
                    transaction_date=row.get("transaction_date") or date.today(),
                    description=str(row.get("description", row.get("account_name", ""))),
                    reference_id=str(row.get("reference_id")) if row.get("reference_id") else f"BATCH-{batch_id_str[:6]}",
                )
                journal_entries.append(entry)

            db.add_all(journal_entries)
            batch.status = "PROCESSED"
            batch.total_records_ingested = len(journal_entries)

            # Atomically update active batch pointer
            org_stmt = select(Organization).where(Organization.id == org_uuid)
            org_res = await db.execute(org_stmt)
            org = org_res.scalar_one_or_none()
            if org:
                org.active_batch_id = batch_id_str

            await db.commit()

            return {
                "batch_id": batch_id_str,
                "status": "PROCESSED",
                "success": True,
                "file_count": len(files),
                "total_records_ingested": len(journal_entries),
                "active_batch_id": batch_id_str,
                "audit_summary": pipeline_audit_receipts,
            }

        except Exception as err:
            await db.rollback()
            batch.status = "FAILED"
            batch.error_message = str(err)[:1000]
            await db.commit()
            return {
                "batch_id": batch_id_str,
                "status": "FAILED",
                "success": False,
                "error": str(err),
            }
