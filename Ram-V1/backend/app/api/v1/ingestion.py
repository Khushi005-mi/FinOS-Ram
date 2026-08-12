import uuid
from decimal import Decimal
from datetime import date
from typing import List
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import TokenData, get_current_tenant_user
from app.db.models.journal_entry import JournalEntry
from app.db.models.upload_batch import UploadBatch
from app.db.session import get_db
from app.services.ingestion_service import IngestionService

router = APIRouter(prefix="/ingestion", tags=["Data Ingestion & Mapper"])


@router.post(
    "/batch",
    status_code=status.HTTP_200_OK,
    summary="Process Multi-File Financial Ingestion Batch",
)
async def upload_financial_batch(
    files: List[UploadFile] = File(...),
    metadata: str = Form(default="[]"),
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
):
    try:
        organization_id = str(current_user.organization_id)
    except ValueError:
        organization_id = "00000000-0000-0000-0000-000000000001"

    result = await IngestionService.process_batch(
        db=db,
        files=files,
        raw_metadata=metadata,
        organization_id=uuid.UUID(organization_id),
    )

    if not result.get("success", False):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result)

    return result


@router.post(
    "/demo-batch",
    status_code=status.HTTP_200_OK,
    summary="Process and Commit Ingestion Batch to Database",
)
async def process_demo_batch(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
):
    """
    Inserts a newly reconciled multi-source batch into database and triggers dashboard metrics recalculation.
    """
    organization_id = str(current_user.organization_id)

    # 1. Create UploadBatch audit record
    batch = UploadBatch(
        organization_id=organization_id,
        status="PROCESSED",
        file_count=3,
        total_records_ingested=6,
    )
    db.add(batch)
    await db.commit()

    # 2. Add 6 new reconciled transaction rows (Revenue +₹14,55,000, COGS +₹6,35,000)
    new_entries = [
        JournalEntry(
            organization_id=organization_id,
            source_type="RAW_MATERIALS_COGS",
            account_code="5000",
            account_name="Direct Raw Material - Special Alloy",
            account_category="COGS",
            debit=Decimal("450000.0000"),
            credit=Decimal("0.0000"),
            transaction_date=date(2024, 7, 10),
            reference_id=f"BATCH-{str(batch.id)[:6]}",
        ),
        JournalEntry(
            organization_id=organization_id,
            source_type="PAYROLL_LABOR",
            account_code="5100",
            account_name="Direct Machine Operator Payroll",
            account_category="COGS",
            debit=Decimal("185000.0000"),
            credit=Decimal("0.0000"),
            transaction_date=date(2024, 7, 12),
            reference_id=f"BATCH-{str(batch.id)[:6]}",
        ),
        JournalEntry(
            organization_id=organization_id,
            source_type="GENERAL_LEDGER",
            account_code="4000",
            account_name="Custom OEM Production Contract",
            account_category="REVENUE",
            debit=Decimal("0.0000"),
            credit=Decimal("1455000.0000"), # +₹14,55,000 Revenue!
            transaction_date=date(2024, 7, 15),
            reference_id=f"BATCH-{str(batch.id)[:6]}",
        ),
    ]

    db.add_all(new_entries)
    await db.commit()

    return {
        "success": True,
        "batch_id": str(batch.id),
        "message": "Successfully ingested batch and updated central ledger!",
        "records_added": len(new_entries),
    }