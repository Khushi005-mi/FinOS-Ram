import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import Date, DateTime, ForeignKey, Index, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class JournalEntry(Base):
    """
    Represents a normalized double-entry ledger transaction in FinOS.
    Stores financial line items ingested across all data sources.
    """
    __tablename__ = "journal_entries"

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

    # Explicit Upload Batch Foreign Key
    upload_batch_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("upload_batches.id", ondelete="CASCADE"),
        index=True,
        nullable=True,
    )

    # Bi-directional ORM Relationship to UploadBatch
    upload_batch: Mapped[Optional["UploadBatch"]] = relationship(
        "UploadBatch",
        back_populates="journal_entries",
    )

    # Ingestion Source & Account Classification
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)
    account_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    account_name: Mapped[str] = mapped_column(String(255), nullable=False)
    account_category: Mapped[str] = mapped_column(String(50), nullable=False)

    # Financial Amounts
    debit: Mapped[Decimal] = mapped_column(
        Numeric(precision=18, scale=4),
        default=Decimal("0.0000"),
        nullable=False,
    )

    credit: Mapped[Decimal] = mapped_column(
        Numeric(precision=18, scale=4),
        default=Decimal("0.0000"),
        nullable=False,
    )

    transaction_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    reference_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        Index("idx_journal_org_batch", "organization_id", "upload_batch_id"),
        Index("idx_journal_org_date", "organization_id", "transaction_date"),
    )