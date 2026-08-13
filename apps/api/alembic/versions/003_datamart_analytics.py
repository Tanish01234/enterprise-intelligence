"""Phase 3: DataMart & Analytics metadata tables with RLS

Revision ID: 003
Revises: 002
Create Date: 2024-02-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ──────────────────────────────────────────
    # Datasets (Upload Tracking)
    # ──────────────────────────────────────────
    op.create_table(
        'datasets',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('filename', sa.String(255), nullable=False),
        sa.Column('file_path', sa.Text(), nullable=False),
        sa.Column('file_size_bytes', sa.Integer(), nullable=False),
        sa.Column('row_count', sa.Integer(), nullable=True),
        sa.Column('column_count', sa.Integer(), nullable=True),
        sa.Column('delimiter', sa.String(10), server_default=',', nullable=False),
        sa.Column('columns_metadata', postgresql.JSONB(), nullable=True),
        sa.Column('status', sa.Enum('pending', 'mapped', 'ingesting', 'completed', 'failed', name='dataset_status'), nullable=False, server_default='pending'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['organization_id'], ['public.organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['auth.users.id']),
        schema='public'
    )
    op.create_index('ix_datasets_org_id', 'datasets', ['organization_id'], schema='public')
    op.create_index('ix_datasets_status', 'datasets', ['organization_id', 'status'], schema='public')

    # ──────────────────────────────────────────
    # Dataset Mappings
    # ──────────────────────────────────────────
    op.create_table(
        'dataset_mappings',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('dataset_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('target_entity', sa.String(50), nullable=False),
        sa.Column('mapping_rules', postgresql.JSONB(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['organization_id'], ['public.organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['dataset_id'], ['public.datasets.id'], ondelete='CASCADE'),
        schema='public'
    )
    op.create_index('ix_dataset_mappings_org_id', 'dataset_mappings', ['organization_id'], schema='public')
    op.create_index('ix_dataset_mappings_dataset_id', 'dataset_mappings', ['dataset_id'], schema='public')

    # ──────────────────────────────────────────
    # Analytics Metadata
    # ──────────────────────────────────────────
    op.create_table(
        'analytics_metadata',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('metric_key', sa.String(100), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('calculation_type', sa.String(50), nullable=False),
        sa.Column('definition', postgresql.JSONB(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['organization_id'], ['public.organizations.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('organization_id', 'metric_key', name='uq_analytics_meta_key'),
        schema='public'
    )
    op.create_index('ix_analytics_meta_org_id', 'analytics_metadata', ['organization_id'], schema='public')

    # ──────────────────────────────────────────
    # RLS Policies
    # ──────────────────────────────────────────
    tables = ['datasets', 'dataset_mappings', 'analytics_metadata']
    for table in tables:
        op.execute(f'ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY')

        op.execute(f"""
            CREATE POLICY {table}_select_policy ON public.{table}
            FOR SELECT USING (
                organization_id IN (
                    SELECT organization_id FROM public.organization_members
                    WHERE user_id = auth.uid()
                )
            )
        """)

        op.execute(f"""
            CREATE POLICY {table}_insert_policy ON public.{table}
            FOR INSERT WITH CHECK (
                organization_id IN (
                    SELECT organization_id FROM public.organization_members
                    WHERE user_id = auth.uid()
                )
            )
        """)

        op.execute(f"""
            CREATE POLICY {table}_update_policy ON public.{table}
            FOR UPDATE USING (
                organization_id IN (
                    SELECT organization_id FROM public.organization_members
                    WHERE user_id = auth.uid()
                )
            )
        """)

        op.execute(f"""
            CREATE POLICY {table}_delete_policy ON public.{table}
            FOR DELETE USING (
                organization_id IN (
                    SELECT organization_id FROM public.organization_members
                    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
                )
            )
        """)


def downgrade() -> None:
    tables = ['analytics_metadata', 'dataset_mappings', 'datasets']
    for table in tables:
        for policy in ['select', 'insert', 'update', 'delete']:
            op.execute(f'DROP POLICY IF EXISTS {table}_{policy}_policy ON public.{table}')
        op.execute(f'ALTER TABLE public.{table} DISABLE ROW LEVEL SECURITY')

    op.drop_table('analytics_metadata', schema='public')
    op.drop_table('dataset_mappings', schema='public')
    op.drop_table('datasets', schema='public')
    op.execute("DROP TYPE IF EXISTS dataset_status")
