import uuid
from datetime import datetime
from sqlalchemy import Boolean, DateTime, Integer, String, UUID, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Organization(Base):
    """
    Represents a tenant organization (SME company) in FinOS.
    Dual-compatible with PostgreSQL (Supabase) and SQLite (Local).
    """
    __tablename__ = "organizations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    industry_type: Mapped[str] = mapped_column(String(50), default="GENERAL_SMB", nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    fiscal_year_start: Mapped[int] = mapped_column(Integer, default=4, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

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