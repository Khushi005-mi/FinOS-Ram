import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, UUID, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DecisionRecommendation(Base):
    __tablename__ = "decision_recommendations"

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

    priority: Mapped[str] = mapped_column(String(50), default="INFO", nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    finding_summary: Mapped[str] = mapped_column(String(1000), nullable=False)
    recommended_action: Mapped[str] = mapped_column(String(1000), nullable=False)

    cash_impact_amount: Mapped[Decimal] = mapped_column(
        Numeric(precision=18, scale=4),
        default=Decimal("0.0000"),
        nullable=False,
    )

    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

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