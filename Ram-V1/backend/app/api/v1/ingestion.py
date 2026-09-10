import logging
import uuid
from typing import List
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import TokenData, require_roles
from app.db.session import get_db
from app.services.ingestion_service import IngestionService

logger = logging.getLogger("finos.ingestion")
router = APIRouter(prefix="/ingestion", tags=["Data Ingestion & Mapper"])

MAX_FILES_PER_BATCH = 10
MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB


@router.post(
    "/batch",
    status_code=status.HTTP_200_OK,
    summary="Process Multi-File Financial Ingestion Batch (Restricted to ADMIN, FINANCE_MANAGER)",
)
async def upload_financial_batch(
    files: List[UploadFile] = File(...),
    metadata: str = Form(default="[]"),
    db: AsyncSession = Depends(get_db),
    # Strict server-side RBAC Guard
    current_user: TokenData = Depends(require_roles(["ADMIN", "FINANCE_MANAGER"])),
):
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files uploaded in request batch.",
        )

    if len(files) > MAX_FILES_PER_BATCH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Batch file limit exceeded. Maximum {MAX_FILES_PER_BATCH} files allowed.",
        )

    try:
        organization_id = uuid.UUID(str(current_user.organization_id))
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid organization ID format in user session.",
        )

    for file in files:
        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(0)
        if size > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File '{file.filename}' exceeds maximum allowed size of 25MB.",
            )

    result = await IngestionService.process_batch(
        db=db,
        files=files,
        raw_metadata=metadata,
        organization_id=organization_id,
        user_id=uuid.UUID(current_user.user_id),
    )

    if not result.get("success", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Batch ingestion failed."),
        )

    return result
