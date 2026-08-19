"""add_active_batch_id_column

Revision ID: a6098a89b79b
Revises: a935c7b7f5b3
Create Date: 2026-08-15 10:16:53.210082

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a6098a89b79b'
down_revision: Union[str, Sequence[str], None] = 'a935c7b7f5b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
