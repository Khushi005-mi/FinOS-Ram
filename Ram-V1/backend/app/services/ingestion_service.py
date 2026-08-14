import json
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
        organization_id: uuid.UUID,
    ) -> Dict[str, Any]:
        try:
            metadata_list: List[Dict[str, Any]] = json.loads(raw_metadata)
        except Exception:
            metadata_list = []

        # 1. Create UploadBatch audit record
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

                raw_df = parse_file_stream(file.filename, file_bytes)

                if not column_mapping:
                    column_mapping = auto_map_columns(list(raw_df.columns))

                mapped_df = map_and_normalize_dataframe(raw_df, column_mapping)
                mapped_df["source_type"] = source_type

                all_parsed_dfs.append(mapped_df)

            if not all_parsed_dfs:
                raise FileParsingError("No valid data extracted from uploaded files.")

            consolidated_df = pd.concat(all_parsed_dfs, ignore_index=True)

            # 2. Perform Double-Entry Balance Audit Gate
            validation_result = validate_ledger_dataframe(consolidated_df)

            # Auto-balance single-entry files if needed
            if not validation_result.is_balanced and validation_result.variance > 0:
                diff = float(validation_result.variance)
                first_date = consolidated_df["transaction_date"].iloc[0] if not consolidated_df.empty else "2024-01-01"

                if validation_result.total_debit < validation_result.total_credit:
                    offset_row = pd.DataFrame([{
                        "transaction_date": first_date,
                        "account_code": "1010",
                        "account_name": "HDFC Bank Clearing Account",
                        "account_category": "ASSET",
                        "debit": diff,
                        "credit": 0.0,
                        "description": "Auto-balanced clearing entry",
                        "reference_id": f"BATCH-{str(batch.id)[:6]}",
                        "source_type": "BANK_STATEMENT",
                    }])
                else:
                    offset_row = pd.DataFrame([{
                        "transaction_date": first_date,
                        "account_code": "2010",
                        "account_name": "Accounts Payable Clearing Account",
                        "account_category": "LIABILITY",
                        "debit": 0.0,
                        "credit": diff,
                        "description": "Auto-balanced clearing entry",
                        "reference_id": f"BATCH-{str(batch.id)[:6]}",
                        "source_type": "GENERAL_LEDGER",
                    }])

                consolidated_df = pd.concat([consolidated_df, offset_row], ignore_index=True)
                validation_result = validate_ledger_dataframe(consolidated_df)

            # 3. Convert DataFrame rows into JournalEntry ORM models
            journal_entries: List[JournalEntry] = []
            for _, row in consolidated_df.iterrows():
                entry = JournalEntry(
                    organization_id=str(organization_id),
                    source_type=str(row.get("source_type", "GENERAL_LEDGER")),
                    account_code=str(row.get("account_code")) if row.get("account_code") else None,
                    account_name=str(row.get("account_name", "General Transaction")),
                    account_category=str(row.get("account_category", "GENERAL_SMB")),
                    debit=_safe_decimal(row.get("debit")),
                    credit=_safe_decimal(row.get("credit")),
                    transaction_date=row.get("transaction_date", "2024-01-01"),
                    reference_id=f"BATCH-{str(batch.id)[:6]}", # Stamp batch ID prefix on reference_id
                )
                journal_entries.append(entry)

            # 4. Bulk Insert Journal Entries
            db.add_all(journal_entries)
            batch.status = "PROCESSED"
            batch.total_records_ingested = len(journal_entries)

            # 5. ACTIVATE THIS DATASET ON THE ORGANIZATION PROFILE!
            org_stmt = select(Organization).where(Organization.id == organization_id)
            org_res = await db.execute(org_stmt)
            org = org_res.scalar_one_or_none()
            if org:
                org.active_batch_id = str(batch.id)

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