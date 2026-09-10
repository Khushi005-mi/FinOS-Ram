"""add upload_batch_id to journal_entries
Revision ID: 7ae8678bf658
Revises: a6098a89b79b
Create Date: 2026-08-17 10:33:49.519719
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '7ae8678bf658'
down_revision: Union[str, Sequence[str], None] = 'a6098a89b79b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "journal_entries",
        sa.Column("upload_batch_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_journal_entries_upload_batch_id",
        "journal_entries",
        "upload_batches",
        ["upload_batch_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index(
        "idx_journal_org_batch",
        "journal_entries",
        ["organization_id", "upload_batch_id"],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("idx_journal_org_batch", table_name="journal_entries")
    op.drop_constraint(
        "fk_journal_entries_upload_batch_id",
        "journal_entries",
        type_="foreignkey",
    )
    op.drop_column("journal_entries", "upload_batch_id")