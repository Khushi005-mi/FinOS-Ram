"""add_active_batch_id_and_upload_batch_fk

Revision ID: a935c7b7f5b3
Revises: c6bb7429e959
Create Date: 2026-08-14 21:24:29.174665

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a935c7b7f5b3'
down_revision: Union[str, Sequence[str], None] = 'c6bb7429e959'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
