"""
backend/app/api/v1/ingestion.py

Data Ingestion & Dataset Version Control Endpoints
"""
import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status, Request
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.models.organization import Organization
from app.db.models.upload_batch import UploadBatch
from app.services.ingestion_service import IngestionService
from app.core.security import TokenData, get_current_tenant_user

router = APIRouter(prefix="/ingestion", tags=["Data Ingestion & Mapper"])


def _to_uuid(val: Any) -> uuid.UUID:
    if isinstance(val, uuid.UUID):
        return val
    try:
        return uuid.UUID(str(val))
    except Exception:
        return uuid.UUID("00000000-0000-0000-0000-000000000001")


@router.post(
    "/batch",
    status_code=status.HTTP_200_OK,
    summary="Process Multi-File Financial Ingestion Batch",
)
async def upload_financial_batch(
    files: List[UploadFile] = File(...),
    metadata: Optional[str] = Form(default="[]"),
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
):
    if not files or len(files) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files uploaded in request batch.",
        )

    organization_id = _to_uuid(current_user.organization_id)

    result = await IngestionService.process_batch(
        db=db,
        files=files,
        raw_metadata=metadata or "[]",
        organization_id=organization_id,
    )

    if not result.get("success", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Ingestion processing failed."),
        )

    return result


@router.get(
    "/batches",
    status_code=status.HTTP_200_OK,
    summary="List all historical upload batches with active flag",
)
async def list_upload_batches(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
) -> List[Dict[str, Any]]:
    org_id = _to_uuid(current_user.organization_id)

    # 1. Fetch Organization to check current active_batch_id
    org_stmt = select(Organization).where(Organization.id == org_id)
    org = (await db.execute(org_stmt)).scalar_one_or_none()
    active_batch_str = str(org.active_batch_id) if org and org.active_batch_id else ""

    # 2. Fetch all batches ordered by newest first
    batch_stmt = (
        select(UploadBatch)
        .where(UploadBatch.organization_id == org_id)
        .order_by(desc(UploadBatch.created_at))
    )
    batches = (await db.execute(batch_stmt)).scalars().all()

    return [
        {
            "id": str(b.id),
            "status": b.status,
            "file_count": b.file_count,
            "total_records_ingested": b.total_records_ingested,
            "error_message": b.error_message,
            "created_at": b.created_at.isoformat() if b.created_at else None,
            "is_active": str(b.id) == active_batch_str,
        }
        for b in batches
    ]


@router.post(
    "/batches/{batch_id}/activate",
    status_code=status.HTTP_200_OK,
    summary="Switch the active dataset batch for the organization",
)
async def activate_upload_batch(
    batch_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_tenant_user),
) -> Dict[str, Any]:
    org_id = _to_uuid(current_user.organization_id)
    batch_uuid = _to_uuid(batch_id)

    # 1. Verify batch exists
    batch_stmt = select(UploadBatch).where(
        UploadBatch.id == batch_uuid,
        UploadBatch.organization_id == org_id,
    )
    batch = (await db.execute(batch_stmt)).scalar_one_or_none()
    if not batch:
        raise HTTPException(status_code=404, detail="Upload batch not found.")

    # 2. Update organization active_batch_id
    org_stmt = select(Organization).where(Organization.id == org_id)
    org = (await db.execute(org_stmt)).scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found.")

    org.active_batch_id = str(batch_uuid)
    await db.commit()

    return {
        "success": True,
        "active_batch_id": str(batch_uuid),
        "message": f"Successfully switched active dataset to batch {str(batch_uuid)[:8]}",
    }
