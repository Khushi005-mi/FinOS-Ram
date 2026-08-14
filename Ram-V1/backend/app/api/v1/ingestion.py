import uuid
from typing import List
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import TokenData, get_current_tenant_user
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
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files uploaded in request batch.",
        )

    try:
        organization_id = uuid.UUID(current_user.organization_id)
    except (ValueError, TypeError):
        organization_id = uuid.UUID("00000000-0000-0000-0000-000000000001")

    result = await IngestionService.process_batch(
        db=db,
        files=files,
        raw_metadata=metadata,
        organization_id=organization_id,
    )

    if not result.get("success", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result,
        )

    return result