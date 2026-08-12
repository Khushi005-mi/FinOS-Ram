import json
import uuid
from decimal import Decimal
from typing import Any, Dict, List
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.journal_entry import JournalEntry
from app.db.models.upload_batch import UploadBatch
from app.engine.mapper import auto_map_columns, map_and_normalize_dataframe
from app.engine.parser import FileParsingError, parse_file_stream
from app.engine.validator import validate_ledger_dataframe


class IngestionService:
    """
    Service Layer orchestrator for multi-file batch ingestion.
    Coordinates file parsing, canonical schema mapping, balance validation,
    auto-balancing offsets, and atomic database persistence.
    """

    @staticmethod
    async def process_batch(
        db: AsyncSession,
        files: List[UploadFile],
        raw_metadata: str,
        organization_id: uuid.UUID,
    ) -> Dict[str, Any]:
        try:
            metadata_list: List[Dict[str, Any]] = json.loads(raw_metadata)
        except Exception:
            metadata_list = []

        batch = UploadBatch(
            organization_id=str(organization_id),
            status="PARSING",
            file_count=len(files),
            total_records_ingested=0,
        )
        db.add(batch)
        await db.commit()
        await db.refresh(batch)

        all_parsed_dfs = []

        try:
            for file in files:
                file_bytes = await file.read()
                file_meta = next(
                    (m for m in metadata_list if m.get("fileName") == file.filename),
                    {},
                )
                column_mapping = file_meta.get("columnMapping", {})
                source_type = file_meta.get("sourceType", "GENERAL_LEDGER")

                # 1. Parse raw binary file stream in RAM
                raw_df = parse_file_stream(file.filename, file_bytes)

                # 2. Server-side Auto-Map fallback if columnMapping is empty
                if not column_mapping:
                    column_mapping = auto_map_columns(list(raw_df.columns))

                # 3. Normalize DataFrame columns to FinOS canonical schema
                mapped_df = map_and_normalize_dataframe(raw_df, column_mapping)
                mapped_df["source_type"] = source_type

                all_parsed_dfs.append(mapped_df)

            if not all_parsed_dfs:
                raise FileParsingError("No valid data extracted from uploaded files.")

            import pandas as pd
            consolidated_df = pd.concat(all_parsed_dfs, ignore_index=True)

            # 4. Perform Double-Entry Balance Audit
            validation_result = validate_ledger_dataframe(consolidated_df)

            # 5. AUTO-BALANCE UNMATCHED SINGLE-ENTRY FILES
            # If uploaded file is single-entry (e.g. only Revenue credits without Debit offsets),
            # generate balancing offset entries automatically so no data is wasted!
            if not validation_result.is_balanced and validation_result.variance > 0:
                diff = float(validation_result.variance)
                if validation_result.total_debit < validation_result.total_credit:
                    # Need Debit offset
                    offset_row = pd.DataFrame([{
                        "transaction_date": consolidated_df["transaction_date"].iloc[0],
                        "account_code": "1010",
                        "account_name": "HDFC Bank Clearing Account",
                        "account_category": "ASSET",
                        "debit": diff,
                        "credit": 0.0,
                        "description": "Auto-balanced clearing entry for uploaded batch",
                        "reference_id": f"BATCH-{str(batch.id)[:6]}",
                        "source_type": "BANK_STATEMENT",
                    }])
                else:
                    # Need Credit offset
                    offset_row = pd.DataFrame([{
                        "transaction_date": consolidated_df["transaction_date"].iloc[0],
                        "account_code": "2010",
                        "account_name": "Accounts Payable Clearing Account",
                        "account_category": "LIABILITY",
                        "debit": 0.0,
                        "credit": diff,
                        "description": "Auto-balanced clearing entry for uploaded batch",
                        "reference_id": f"BATCH-{str(batch.id)[:6]}",
                        "source_type": "GENERAL_LEDGER",
                    }])

                consolidated_df = pd.concat([consolidated_df, offset_row], ignore_index=True)
                validation_result = validate_ledger_dataframe(consolidated_df)

            # 6. Convert Mapped Rows into JournalEntry ORM Objects
            journal_entries: List[JournalEntry] = []
            for _, row in consolidated_df.iterrows():
                entry = JournalEntry(
                    organization_id=str(organization_id),
                    source_type=str(row["source_type"]),
                    account_code=str(row["account_code"]) if row["account_code"] else None,
                    account_name=str(row["account_name"]),
                    account_category=str(row["account_category"]),
                    debit=Decimal(str(round(row["debit"], 4))),
                    credit=Decimal(str(round(row["credit"], 4))),
                    transaction_date=row["transaction_date"],
                    reference_id=str(row["reference_id"]) if row["reference_id"] else None,
                )
                journal_entries.append(entry)

            # 7. Bulk Insert into Database & Update Batch Status
            db.add_all(journal_entries)
            batch.status = "PROCESSED"
            batch.total_records_ingested = len(journal_entries)

            await db.commit()

            return {
                "batch_id": str(batch.id),
                "status": "PROCESSED",
                "success": True,
                "file_count": len(files),
                "total_records_ingested": len(journal_entries),
                "total_debit": float(validation_result.total_debit),
                "total_credit": float(validation_result.total_credit),
            }

        except Exception as err:
            await db.rollback()
            batch.status = "FAILED"
            batch.error_message = str(err)
            await db.commit()
            return {
                "batch_id": str(batch.id),
                "status": "FAILED",
                "success": False,
                "error": str(err),
            }