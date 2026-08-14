import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import Date, DateTime, ForeignKey, Index, Numeric, String, UUID, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    source_type: Mapped[str] = mapped_column(String(50), nullable=False)
    account_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    account_name: Mapped[str] = mapped_column(String(255), nullable=False)
    account_category: Mapped[str] = mapped_column(String(50), nullable=False)

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
        Index("idx_journal_org_date", "organization_id", "transaction_date"),
    )