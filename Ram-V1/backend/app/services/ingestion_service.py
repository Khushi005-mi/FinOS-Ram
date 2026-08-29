"""
backend/app/services/ingestion_service.py

Service Layer orchestrator for multi-file batch ingestion.
Guarantees PostgreSQL native UUID type safety when updating active_batch_id.
"""
import json
from datetime import date
import uuid
from decimal import Decimal
from typing import Any, Dict, List
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
        raw_metadata: str,
        organization_id: Any,
    ) -> Dict[str, Any]:
        try:
            metadata_list: List[Dict[str, Any]] = json.loads(raw_metadata) if raw_metadata else []
        except Exception:
            metadata_list = []

        org_uuid = _to_uuid(organization_id)
        batch_uuid = uuid.uuid4()

        # 1. Create UploadBatch record with UUID
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

        all_parsed_dfs: List[pd.DataFrame] = []

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

            consolidated_df = pd.concat(all_parsed_dfs, ignore_index=True)

            # 2. Validate
            validation_result = validate_ledger_dataframe(consolidated_df)
            if not validation_result.is_valid:
                raise ValueError(
                    f"Validation failed: {', '.join(validation_result.validation_errors)}"
                )

            # 3. Create JournalEntry rows with native UUIDs
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
                    reference_id=str(row.get("reference_id")) if row.get("reference_id") else f"BATCH-{str(batch_uuid)[:6]}",
                )
                journal_entries.append(entry)

            db.add_all(journal_entries)
            batch.status = "PROCESSED"
            batch.total_records_ingested = len(journal_entries)

            # 4. Strictly Update Organization Active Batch with native UUID
            org_stmt = select(Organization).where(Organization.id == org_uuid)
            org_res = await db.execute(org_stmt)
            org = org_res.scalar_one_or_none()
            if org:
                org.active_batch_id = batch_uuid

            await db.commit()

            return {
                "batch_id": str(batch_uuid),
                "status": "PROCESSED",
                "success": True,
                "file_count": len(files),
                "total_records_ingested": len(journal_entries),
                "active_batch_id": str(batch_uuid),
            }

        except Exception as err:
            await db.rollback()
            batch.status = "FAILED"
            batch.error_message = str(err)[:1000]
            await db.commit()
            return {
                "batch_id": str(batch_uuid),
                "status": "FAILED",
                "success": False,
                "error": str(err),
            }
