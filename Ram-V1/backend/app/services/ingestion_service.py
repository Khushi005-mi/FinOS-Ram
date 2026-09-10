import hashlib
import json
from datetime import date
import uuid
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, List, Optional
from fastapi import UploadFile
import pandas as pd
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.journal_entry import JournalEntry
from app.db.models.organization import Organization
from app.db.models.upload_batch import UploadBatch
from app.engine.mapper import auto_map_columns, map_and_normalize_dataframe
from app.engine.parser import FileParsingError, parse_file_stream
from app.engine.validator import validate_ledger_dataframe
from app.services.audit_service import AuditService

CALCULATION_VERSION = "v1.0-deterministic"


def _to_uuid(val: Any) -> uuid.UUID:
    if isinstance(val, uuid.UUID):
        return val
    if not val:
        raise ValueError("Organization ID cannot be empty or null.")
    try:
        return uuid.UUID(str(val))
    except (ValueError, AttributeError, TypeError):
        raise ValueError(f"Invalid UUID format provided: '{val}'")


def _safe_decimal(val: Any) -> Decimal:
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


def _compute_sha256(file_bytes_list: List[bytes]) -> str:
    hasher = hashlib.sha256()
    for b in file_bytes_list:
        hasher.update(b)
    return hasher.hexdigest()


class IngestionService:
    @staticmethod
    async def process_batch(
        db: AsyncSession,
        files: List[UploadFile],
        raw_metadata: str,
        organization_id: Any,
        user_id: Optional[Any] = None,
    ) -> Dict[str, Any]:
        org_uuid = _to_uuid(organization_id)
        user_uuid = _to_uuid(user_id) if user_id else None

        try:
            metadata_list: List[Dict[str, Any]] = json.loads(raw_metadata) if raw_metadata else []
        except Exception:
            metadata_list = []

        batch_uuid = uuid.uuid4()
        batch_id_str = str(batch_uuid)

        batch = UploadBatch(
            id=batch_uuid,
            organization_id=org_uuid,
            status="PARSING",
            file_count=len(files),
            total_records_ingested=0,
            calculation_version=CALCULATION_VERSION,
        )
        db.add(batch)
        await db.commit()
        await db.refresh(batch)

        all_parsed_dfs: List[pd.DataFrame] = []
        all_raw_bytes: List[bytes] = []

        try:
            for file in files:
                await file.seek(0)
                file_bytes = await file.read()

                if not file_bytes or len(file_bytes) == 0:
                    continue

                all_raw_bytes.append(file_bytes)

                file_meta = next(
                    (m for m in metadata_list if m.get("fileName") == file.filename),
                    {},
                )
                column_mapping = file_meta.get("columnMapping", {})
                source_type = file_meta.get("sourceType", "GENERAL_LEDGER")

                raw_df = parse_file_stream(file.filename or "upload.csv", file_bytes)
                if raw_df.empty:
                    continue

                if not column_mapping:
                    column_mapping = auto_map_columns(list(raw_df.columns))

                mapped_df = map_and_normalize_dataframe(raw_df, column_mapping)
                mapped_df["source_type"] = source_type

                all_parsed_dfs.append(mapped_df)

            if not all_parsed_dfs:
                raise FileParsingError("No valid tabular data extracted from uploaded files.")

            batch_sha256 = _compute_sha256(all_raw_bytes)
            batch.file_checksum_sha256 = batch_sha256

            consolidated_df = pd.concat(all_parsed_dfs, ignore_index=True)

            # Strict Accounting Gate with Operational Offset Awareness
            validation_result = validate_ledger_dataframe(consolidated_df, allow_operational_offset=True)
            if not validation_result.is_valid:
                error_summary = "; ".join(validation_result.validation_errors)
                raise ValueError(f"Accounting Validation Failed: {error_summary}")

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

            # If this was a single-leg operational feed, synthesize an explicit auditable clearing offset
            if validation_result.requires_offset:
                offset_desc = (
                    "System Ingestion Clearing Offset - Accounts Payable"
                    if validation_result.offset_category == "LIABILITY"
                    else "System Ingestion Clearing Offset - Accounts Receivable"
                )
                clearing_entry = JournalEntry(
                    id=uuid.uuid4(),
                    organization_id=org_uuid,
                    upload_batch_id=batch_uuid,
                    source_type="SYSTEM_OFFSET_CLEARING",
                    account_code="ACC-SYS-CLEARING",
                    account_name=offset_desc,
                    account_category=validation_result.offset_category or "LIABILITY",
                    debit=validation_result.offset_debit,
                    credit=validation_result.offset_credit,
                    transaction_date=date.today(),
                    description=f"Automated GAAP clearing leg balancing operational feed for batch {batch_id_str[:8]}",
                    reference_id=f"OFFSET-{batch_id_str[:6]}",
                )
                journal_entries.append(clearing_entry)

            # Persist journal lines
            db.add_all(journal_entries)
            batch.status = "PROCESSED"
            batch.total_records_ingested = len(journal_entries)

            # Activate dataset on organization
            org_stmt = select(Organization).where(Organization.id == org_uuid)
            org_res = await db.execute(org_stmt)
            org = org_res.scalar_one_or_none()
            if org:
                org.active_batch_id = batch_id_str

            await db.commit()

            # Record Immutable Lineage Audit Event
            await AuditService.log_event(
                db=db,
                organization_id=org_uuid,
                user_id=user_uuid,
                event_type="OPERATIONAL_FEED_INGESTED" if validation_result.requires_offset else "DATASET_PROCESSED",
                description=(
                    f"Batch {batch_id_str[:8]} ingested {len(journal_entries)} entries "
                    f"(Includes automated clearing offset of ₹{validation_result.variance:,.2f})"
                    if validation_result.requires_offset
                    else f"Batch {batch_id_str[:8]} processed {len(journal_entries)} balanced entries."
                ),
                metadata={
                    "batch_id": batch_id_str,
                    "sha256": batch_sha256,
                    "file_count": len(files),
                    "record_count": len(journal_entries),
                    "is_operational_feed": validation_result.is_operational_feed,
                    "offset_applied": validation_result.requires_offset,
                    "calculation_version": CALCULATION_VERSION,
                },
            )

            return {
                "batch_id": batch_id_str,
                "status": "PROCESSED",
                "success": True,
                "file_count": len(files),
                "total_records_ingested": len(journal_entries),
                "active_batch_id": batch_id_str,
                "is_operational_feed": validation_result.is_operational_feed,
                "offset_applied": validation_result.requires_offset,
                "file_checksum_sha256": batch_sha256,
                "calculation_version": CALCULATION_VERSION,
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
