"""Phase 2: Core database schema - business, market, and intelligence tables with RLS

Revision ID: 002
Revises: 001
Create Date: 2024-02-01 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ──────────────────────────────────────────
    # BUSINESS DOMAIN (organization-scoped)
    # ──────────────────────────────────────────

    # Categories
    op.create_table(
        'categories',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('slug', sa.String(100), nullable=False),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('sort_order', sa.Integer(), server_default='0'),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['organization_id'], ['public.organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'], ['public.categories.id'], ondelete='SET NULL'),
        sa.UniqueConstraint('organization_id', 'slug', name='uq_category_org_slug'),
        schema='public'
    )
    op.create_index('ix_categories_org_id', 'categories', ['organization_id'], schema='public')

    # Regions
    op.create_table(
        'regions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('code', sa.String(20), nullable=False),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('metadata', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['organization_id'], ['public.organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'], ['public.regions.id'], ondelete='SET NULL'),
        sa.UniqueConstraint('organization_id', 'code', name='uq_region_org_code'),
        schema='public'
    )
    op.create_index('ix_regions_org_id', 'regions', ['organization_id'], schema='public')

    # Customers
    op.create_table(
        'customers',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('external_id', sa.String(100), nullable=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('phone', sa.String(50), nullable=True),
        sa.Column('segment', sa.Enum('new', 'regular', 'vip', 'churned', name='customer_segment'), nullable=False, server_default='new'),
        sa.Column('region_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('metadata', postgresql.JSONB(), nullable=True),
        sa.Column('first_purchase_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['organization_id'], ['public.organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['region_id'], ['public.regions.id'], ondelete='SET NULL'),
        sa.UniqueConstraint('organization_id', 'external_id', name='uq_customer_org_external_id'),
        schema='public'
    )
    op.create_index('ix_customers_org_id', 'customers', ['organization_id'], schema='public')
    op.create_index('ix_customers_segment', 'customers', ['organization_id', 'segment'], schema='public')
    op.create_index('ix_customers_region', 'customers', ['organization_id', 'region_id'], schema='public')

    # Products
    op.create_table(
        'products',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('sku', sa.String(100), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('unit_price', sa.Numeric(12, 2), nullable=False),
        sa.Column('cost_price', sa.Numeric(12, 2), nullable=True),
        sa.Column('currency', sa.String(3), server_default='USD', nullable=False),
        sa.Column('stock_quantity', sa.Integer(), server_default='0'),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('tags', postgresql.JSONB(), nullable=True),
        sa.Column('attributes', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['organization_id'], ['public.organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['category_id'], ['public.categories.id'], ondelete='SET NULL'),
        sa.UniqueConstraint('organization_id', 'sku', name='uq_product_org_sku'),
        sa.CheckConstraint('unit_price >= 0', name='ck_product_unit_price_positive'),
        schema='public'
    )
    op.create_index('ix_products_org_id', 'products', ['organization_id'], schema='public')
    op.create_index('ix_products_category', 'products', ['organization_id', 'category_id'], schema='public')

    # Orders
    op.create_table(
        'orders',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('order_number', sa.String(50), nullable=False),
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.Enum('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned', name='order_status'), nullable=False, server_default='pending'),
        sa.Column('order_date', sa.Date(), nullable=False),
        sa.Column('subtotal', sa.Numeric(14, 2), nullable=False),
        sa.Column('tax_amount', sa.Numeric(14, 2), server_default='0.00'),
        sa.Column('discount_amount', sa.Numeric(14, 2), server_default='0.00'),
        sa.Column('total_amount', sa.Numeric(14, 2), nullable=False),
        sa.Column('currency', sa.String(3), server_default='USD', nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['organization_id'], ['public.organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['customer_id'], ['public.customers.id'], ondelete='RESTRICT'),
        sa.UniqueConstraint('organization_id', 'order_number', name='uq_order_org_number'),
        schema='public'
    )
    op.create_index('ix_orders_org_id', 'orders', ['organization_id'], schema='public')
    op.create_index('ix_orders_customer', 'orders', ['organization_id', 'customer_id'], schema='public')
    op.create_index('ix_orders_date', 'orders', ['organization_id', 'order_date'], schema='public')
    op.create_index('ix_orders_status', 'orders', ['organization_id', 'status'], schema='public')

    # Order Items
    op.create_table(
        'order_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit_price', sa.Numeric(12, 2), nullable=False),
        sa.Column('discount_pct', sa.Numeric(5, 2), server_default='0.00'),
        sa.Column('line_total', sa.Numeric(14, 2), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['organization_id'], ['public.organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['order_id'], ['public.orders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['public.products.id'], ondelete='RESTRICT'),
        sa.CheckConstraint('quantity > 0', name='ck_order_item_qty_positive'),
        schema='public'
    )
    op.create_index('ix_order_items_org_id', 'order_items', ['organization_id'], schema='public')
    op.create_index('ix_order_items_order_id', 'order_items', ['order_id'], schema='public')
    op.create_index('ix_order_items_product_id', 'order_items', ['organization_id', 'product_id'], schema='public')

    # Transactions
    op.create_table(
        'transactions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('type', sa.Enum('sale', 'refund', 'adjustment', name='transaction_type'), nullable=False),
        sa.Column('amount', sa.Numeric(14, 2), nullable=False),
        sa.Column('currency', sa.String(3), server_default='USD', nullable=False),
        sa.Column('payment_method', sa.String(50), nullable=True),
        sa.Column('reference', sa.String(100), nullable=True),
        sa.Column('transaction_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('metadata', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['organization_id'], ['public.organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['order_id'], ['public.orders.id'], ondelete='CASCADE'),
        schema='public'
    )
    op.create_index('ix_transactions_org_id', 'transactions', ['organization_id'], schema='public')
    op.create_index('ix_transactions_order_id', 'transactions', ['order_id'], schema='public')
    op.create_index('ix_transactions_date', 'transactions', ['organization_id', 'transaction_date'], schema='public')
    op.create_index('ix_transactions_type', 'transactions', ['organization_id', 'type'], schema='public')

    # ──────────────────────────────────────────
    # MARKET DOMAIN (platform-shared)
    # ──────────────────────────────────────────

    # Symbols
    op.create_table(
        'symbols',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('ticker', sa.String(20), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('exchange', sa.String(20), nullable=False),
        sa.Column('asset_class', sa.String(20), nullable=False),
        sa.Column('sector', sa.String(100), nullable=True),
        sa.Column('industry', sa.String(100), nullable=True),
        sa.Column('currency', sa.String(3), server_default='USD', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('metadata', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('ticker', name='uq_symbols_ticker'),
        schema='public'
    )
    op.create_index('ix_symbols_ticker', 'symbols', ['ticker'], unique=True, schema='public')
    op.create_index('ix_symbols_exchange', 'symbols', ['exchange'], schema='public')
    op.create_index('ix_symbols_asset_class', 'symbols', ['asset_class'], schema='public')

    # OHLCV Metadata
    op.create_table(
        'ohlcv_metadata',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('symbol_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('timeframe', sa.String(10), nullable=False),
        sa.Column('file_path', sa.Text(), nullable=False),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('bar_count', sa.Integer(), nullable=False),
        sa.Column('file_size_bytes', sa.BigInteger(), nullable=False),
        sa.Column('checksum', sa.String(64), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['symbol_id'], ['public.symbols.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('symbol_id', 'timeframe', name='uq_ohlcv_symbol_timeframe'),
        schema='public'
    )
    op.create_index('ix_ohlcv_symbol_id', 'ohlcv_metadata', ['symbol_id'], schema='public')
    op.create_index('ix_ohlcv_timeframe', 'ohlcv_metadata', ['timeframe'], schema='public')

    # ──────────────────────────────────────────
    # INTELLIGENCE DOMAIN (organization-scoped)
    # ──────────────────────────────────────────

    # Strategies
    op.create_table(
        'strategies',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('strategy_type', sa.String(50), nullable=False),
        sa.Column('parameters', postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column('status', sa.Enum('draft', 'active', 'archived', name='strategy_status'), nullable=False, server_default='draft'),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['organization_id'], ['public.organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['auth.users.id']),
        schema='public'
    )
    op.create_index('ix_strategies_org_id', 'strategies', ['organization_id'], schema='public')
    op.create_index('ix_strategies_status', 'strategies', ['organization_id', 'status'], schema='public')
    op.create_index('ix_strategies_type', 'strategies', ['organization_id', 'strategy_type'], schema='public')

    # Backtest Runs
    op.create_table(
        'backtest_runs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('strategy_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('symbol', sa.String(20), nullable=False),
        sa.Column('timeframe', sa.String(10), nullable=False),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('initial_capital', sa.Numeric(14, 2), nullable=False),
        sa.Column('status', sa.Enum('pending', 'running', 'completed', 'failed', name='backtest_status'), nullable=False, server_default='pending'),
        sa.Column('total_return_pct', sa.Numeric(10, 4), nullable=True),
        sa.Column('sharpe_ratio', sa.Numeric(10, 4), nullable=True),
        sa.Column('max_drawdown_pct', sa.Numeric(10, 4), nullable=True),
        sa.Column('win_rate', sa.Numeric(5, 4), nullable=True),
        sa.Column('total_trades', sa.Integer(), nullable=True),
        sa.Column('final_equity', sa.Numeric(14, 2), nullable=True),
        sa.Column('results_detail', postgresql.JSONB(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('started_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['organization_id'], ['public.organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['strategy_id'], ['public.strategies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['started_by'], ['auth.users.id']),
        schema='public'
    )
    op.create_index('ix_backtest_runs_org_id', 'backtest_runs', ['organization_id'], schema='public')
    op.create_index('ix_backtest_runs_strategy', 'backtest_runs', ['organization_id', 'strategy_id'], schema='public')
    op.create_index('ix_backtest_runs_status', 'backtest_runs', ['organization_id', 'status'], schema='public')

    # Alerts
    op.create_table(
        'alerts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('severity', sa.Enum('info', 'warning', 'critical', name='alert_severity'), nullable=False, server_default='info'),
        sa.Column('status', sa.Enum('active', 'acknowledged', 'resolved', 'dismissed', name='alert_status'), nullable=False, server_default='active'),
        sa.Column('source_module', sa.String(50), nullable=False),
        sa.Column('source_id', sa.String(100), nullable=True),
        sa.Column('metadata', postgresql.JSONB(), nullable=True),
        sa.Column('acknowledged_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('acknowledged_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['organization_id'], ['public.organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['acknowledged_by'], ['auth.users.id']),
        schema='public'
    )
    op.create_index('ix_alerts_org_id', 'alerts', ['organization_id'], schema='public')
    op.create_index('ix_alerts_status', 'alerts', ['organization_id', 'status'], schema='public')
    op.create_index('ix_alerts_severity', 'alerts', ['organization_id', 'severity'], schema='public')
    op.create_index('ix_alerts_source', 'alerts', ['organization_id', 'source_module'], schema='public')

    # AI Conversations
    op.create_table(
        'ai_conversations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(200), nullable=True),
        sa.Column('context_module', sa.String(50), nullable=True),
        sa.Column('messages', postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column('tool_calls', postgresql.JSONB(), nullable=True),
        sa.Column('token_count', sa.Integer(), server_default='0'),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['organization_id'], ['public.organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['auth.users.id']),
        schema='public'
    )
    op.create_index('ix_ai_conversations_org_id', 'ai_conversations', ['organization_id'], schema='public')
    op.create_index('ix_ai_conversations_user', 'ai_conversations', ['organization_id', 'user_id'], schema='public')

    # ──────────────────────────────────────────
    # RLS POLICIES for all business tables
    # ──────────────────────────────────────────

    business_tables = [
        'categories', 'regions', 'customers', 'products',
        'orders', 'order_items', 'transactions',
        'strategies', 'backtest_runs', 'alerts', 'ai_conversations',
    ]

    for table in business_tables:
        op.execute(f'ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY')

        # SELECT: members of the organization can read
        op.execute(f"""
            CREATE POLICY {table}_select_policy ON public.{table}
            FOR SELECT USING (
                organization_id IN (
                    SELECT organization_id FROM public.organization_members
                    WHERE user_id = auth.uid()
                )
            )
        """)

        # INSERT: members of the organization can insert
        op.execute(f"""
            CREATE POLICY {table}_insert_policy ON public.{table}
            FOR INSERT WITH CHECK (
                organization_id IN (
                    SELECT organization_id FROM public.organization_members
                    WHERE user_id = auth.uid()
                )
            )
        """)

        # UPDATE: members of the organization can update
        op.execute(f"""
            CREATE POLICY {table}_update_policy ON public.{table}
            FOR UPDATE USING (
                organization_id IN (
                    SELECT organization_id FROM public.organization_members
                    WHERE user_id = auth.uid()
                )
            )
        """)

        # DELETE: admins and owners can delete
        op.execute(f"""
            CREATE POLICY {table}_delete_policy ON public.{table}
            FOR DELETE USING (
                organization_id IN (
                    SELECT organization_id FROM public.organization_members
                    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
                )
            )
        """)

    # Market data tables: read-only for all authenticated users
    for table in ['symbols', 'ohlcv_metadata']:
        op.execute(f'ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY')
        op.execute(f"""
            CREATE POLICY {table}_select_policy ON public.{table}
            FOR SELECT USING (auth.uid() IS NOT NULL)
        """)


def downgrade() -> None:
    # Drop RLS policies
    all_tables = [
        'categories', 'regions', 'customers', 'products',
        'orders', 'order_items', 'transactions',
        'strategies', 'backtest_runs', 'alerts', 'ai_conversations',
        'symbols', 'ohlcv_metadata',
    ]

    for table in all_tables:
        for policy in ['select', 'insert', 'update', 'delete']:
            op.execute(f'DROP POLICY IF EXISTS {table}_{policy}_policy ON public.{table}')
        op.execute(f'ALTER TABLE public.{table} DISABLE ROW LEVEL SECURITY')

    # Drop tables in reverse dependency order
    op.drop_table('ai_conversations', schema='public')
    op.drop_table('alerts', schema='public')
    op.drop_table('backtest_runs', schema='public')
    op.drop_table('strategies', schema='public')
    op.drop_table('ohlcv_metadata', schema='public')
    op.drop_table('symbols', schema='public')
    op.drop_table('transactions', schema='public')
    op.drop_table('order_items', schema='public')
    op.drop_table('orders', schema='public')
    op.drop_table('products', schema='public')
    op.drop_table('customers', schema='public')
    op.drop_table('regions', schema='public')
    op.drop_table('categories', schema='public')

    # Drop enums
    op.execute("DROP TYPE IF EXISTS customer_segment")
    op.execute("DROP TYPE IF EXISTS order_status")
    op.execute("DROP TYPE IF EXISTS transaction_type")
    op.execute("DROP TYPE IF EXISTS strategy_status")
    op.execute("DROP TYPE IF EXISTS backtest_status")
    op.execute("DROP TYPE IF EXISTS alert_severity")
    op.execute("DROP TYPE IF EXISTS alert_status")
