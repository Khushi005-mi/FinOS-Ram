"""lineage_and_defaults

Revision ID: 0003_lineage_and_defaults
Revises: 0002_invitations
Create Date: 2026-09-12 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '0003_lineage_and_defaults'
down_revision = '0002_invitations'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Upload Batches Lineage Columns
    op.execute(sa.text("""
        ALTER TABLE upload_batches ADD COLUMN IF NOT EXISTS file_checksum_sha256 VARCHAR(64);
        ALTER TABLE upload_batches ADD COLUMN IF NOT EXISTS calculation_version VARCHAR(50) DEFAULT 'v1.0-deterministic';
        ALTER TABLE upload_batches ADD COLUMN IF NOT EXISTS error_message VARCHAR(1000);
    """))

    # 2. Organizations Active Dataset & Business Metadata
    op.execute(sa.text("""
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS active_batch_id VARCHAR(36);
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS industry_type VARCHAR(50) DEFAULT 'GENERAL_SMB';
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD';
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS fiscal_year_start INTEGER DEFAULT 1;
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
    """))

    # 3. Kernel-Level PostgreSQL Defaults (CURRENT_TIMESTAMP)
    op.execute(sa.text("""
        ALTER TABLE users ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE users ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE upload_batches ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE upload_batches ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE organizations ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE organizations ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE journal_entries ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;
    """))

def downgrade() -> None:
    pass
