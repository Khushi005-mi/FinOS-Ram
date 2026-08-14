"""add_active_batch_id_to_organization

Revision ID: c6bb7429e959
Revises: 49370d058448
Create Date: 2026-08-14 16:29:22.338008

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c6bb7429e959'
down_revision: Union[str, Sequence[str], None] = '49370d058448'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
