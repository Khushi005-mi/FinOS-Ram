import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class UploadBatch(Base):
    """
    Represents an ingestion batch session in FinOS.
    Tracks multi-file upload processing states, audit metadata, and diagnostic logs.
    """
    __tablename__ = "upload_batches"

    # Primary Key (UUID v4)
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )

    # Multi-Tenant Isolation Foreign Key
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    # Batch State & Ingestion Telemetry
    status: Mapped[str] = mapped_column(
        String(50),
        default="PENDING",
        nullable=False,
    )  # Processing States: "PENDING", "PARSING", "PROCESSED", "FAILED"

    file_count: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )

    total_records_ingested: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    # Diagnostic Error Log (Nullable for successful batches)
    error_message: Mapped[Optional[str]] = mapped_column(
        String(1000),
        nullable=True,
    )

    # Server-side Audit Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )