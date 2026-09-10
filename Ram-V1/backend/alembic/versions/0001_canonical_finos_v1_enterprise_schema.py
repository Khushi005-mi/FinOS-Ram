"""canonical_finos_v1_enterprise_schema

Revision ID: 0001_canonical_v1
Revises: 
Create Date: 2026-09-06 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0001_canonical_v1'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. ORGANIZATIONS
    op.create_table(
        'organizations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(255), nullable=False),
        sa.Column('industry_type', sa.String(50), server_default='GENERAL_SMB', nullable=False),
        sa.Column('currency', sa.String(10), server_default='INR', nullable=False),
        sa.Column('fiscal_year_start', sa.Integer(), server_default='4', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('active_batch_id', sa.String(36), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_organizations_slug', 'organizations', ['slug'], unique=True)

    # 2. USERS
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=True),
        sa.Column('role', sa.String(50), server_default='ANALYST', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_org_role', 'users', ['organization_id', 'role'])

    # 3. UPLOAD_BATCHES
    op.create_table(
        'upload_batches',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(50), server_default='PENDING', nullable=False),
        sa.Column('file_count', sa.Integer(), server_default='1', nullable=False),
        sa.Column('total_records_ingested', sa.Integer(), server_default='0', nullable=False),
        sa.Column('file_checksum_sha256', sa.String(64), nullable=True),
        sa.Column('calculation_version', sa.String(50), server_default='v1.0-deterministic', nullable=False),
        sa.Column('error_message', sa.String(1000), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_upload_batches_org', 'upload_batches', ['organization_id'])
    op.create_index('ix_upload_batches_sha256', 'upload_batches', ['file_checksum_sha256'])

    # 4. JOURNAL_ENTRIES
    op.create_table(
        'journal_entries',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('upload_batch_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('upload_batches.id', ondelete='CASCADE'), nullable=True),
        sa.Column('source_type', sa.String(50), nullable=False),
        sa.Column('account_code', sa.String(50), nullable=True),
        sa.Column('account_name', sa.String(255), nullable=False),
        sa.Column('account_category', sa.String(50), nullable=False),
        sa.Column('debit', sa.Numeric(precision=18, scale=4), server_default='0.0000', nullable=False),
        sa.Column('credit', sa.Numeric(precision=18, scale=4), server_default='0.0000', nullable=False),
        sa.Column('transaction_date', sa.Date(), nullable=False),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('reference_id', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('idx_journal_org_batch', 'journal_entries', ['organization_id', 'upload_batch_id'])
    op.create_index('idx_journal_org_date', 'journal_entries', ['organization_id', 'transaction_date'])

    # 5. AUDIT_LOGS
    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('event_type', sa.String(100), nullable=False),
        sa.Column('description', sa.String(500), nullable=False),
        sa.Column('metadata_payload', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_audit_org_event', 'audit_logs', ['organization_id', 'event_type'])
    op.create_index('ix_audit_org_created', 'audit_logs', ['organization_id', 'created_at'])


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('journal_entries')
    op.drop_table('upload_batches')
    op.drop_table('users')
    op.drop_table('organizations')
