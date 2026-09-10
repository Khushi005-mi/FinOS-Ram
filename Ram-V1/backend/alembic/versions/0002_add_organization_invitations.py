"""add_organization_invitations

Revision ID: 0002_invitations
Revises: 0001_canonical_v1
Create Date: 2026-09-09 18:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0002_invitations'
down_revision: Union[str, Sequence[str], None] = '0001_canonical_v1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'organization_invitations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('role', sa.String(50), server_default='ANALYST', nullable=False),
        sa.Column('token_hash', sa.String(64), nullable=False),
        sa.Column('invited_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('accepted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_invitations_token_hash', 'organization_invitations', ['token_hash'], unique=True)
    op.create_index('ix_invitations_email', 'organization_invitations', ['email'])
    op.create_index('ix_invitation_org_email', 'organization_invitations', ['organization_id', 'email'])


def downgrade() -> None:
    op.drop_table('organization_invitations')
