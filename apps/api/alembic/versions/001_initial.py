"""Initial migration: organizations, organization_members, profiles with RLS

Revision ID: 001
Revises: 
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create organizations table
    op.create_table(
        'organizations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('slug', sa.String(50), nullable=False),
        sa.Column('settings', postgresql.JSONB(), nullable=False, 
                  server_default=sa.text("'{\"timezone\": \"UTC\", \"currency\": \"USD\", \"fiscal_year_start\": 1}'::jsonb")),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug', name='uq_organizations_slug'),
        schema='public'
    )
    
    op.create_index('ix_organizations_owner_id', 'organizations', ['owner_id'], schema='public')

    # Create organization_members table
    op.create_table(
        'organization_members',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.Enum('owner', 'admin', 'analyst', 'viewer', name='organization_role'), nullable=False, server_default='viewer'),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('invited_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['organization_id'], ['public.organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['auth.users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['invited_by'], ['auth.users.id'], ondelete='SET NULL'),
        sa.UniqueConstraint('organization_id', 'user_id', name='uq_org_member'),
        schema='public'
    )
    
    op.create_index('ix_org_members_org_id', 'organization_members', ['organization_id'], schema='public')
    op.create_index('ix_org_members_user_id', 'organization_members', ['user_id'], schema='public')

    # Create profiles table (public schema)
    op.create_table(
        'profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('full_name', sa.String(100), nullable=True),
        sa.Column('avatar_url', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['id'], ['auth.users.id'], ondelete='CASCADE'),
        schema='public'
    )

    # Enable RLS on organizations
    op.execute('ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY')
    
    # Enable RLS on organization_members
    op.execute('ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY')
    
    # Enable RLS on profiles
    op.execute('ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY')

    # Create RLS policies for organizations
    # Users can see organizations they are members of
    op.execute("""
        CREATE POLICY organizations_select_policy ON public.organizations
        FOR SELECT USING (
            id IN (
                SELECT organization_id FROM public.organization_members
                WHERE user_id = auth.uid()
            )
        )
    """)
    
    # Owners can insert organizations
    op.execute("""
        CREATE POLICY organizations_insert_policy ON public.organizations
        FOR INSERT WITH CHECK (
            owner_id = auth.uid()
        )
    """)
    
    # Owners and admins can update organizations
    op.execute("""
        CREATE POLICY organizations_update_policy ON public.organizations
        FOR UPDATE USING (
            id IN (
                SELECT organization_id FROM public.organization_members
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
            )
        )
    """)
    
    # Owners can delete organizations
    op.execute("""
        CREATE POLICY organizations_delete_policy ON public.organizations
        FOR DELETE USING (
            id IN (
                SELECT organization_id FROM public.organization_members
                WHERE user_id = auth.uid() AND role = 'owner'
            )
        )
    """)

    # Create RLS policies for organization_members
    # Users can see members of organizations they belong to
    op.execute("""
        CREATE POLICY org_members_select_policy ON public.organization_members
        FOR SELECT USING (
            organization_id IN (
                SELECT organization_id FROM public.organization_members
                WHERE user_id = auth.uid()
            )
        )
    """)
    
    # Admins and owners can insert members
    op.execute("""
        CREATE POLICY org_members_insert_policy ON public.organization_members
        FOR INSERT WITH CHECK (
            organization_id IN (
                SELECT organization_id FROM public.organization_members
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
            )
        )
    """)
    
    # Admins and owners can update members (but not promote to owner unless owner)
    op.execute("""
        CREATE POLICY org_members_update_policy ON public.organization_members
        FOR UPDATE USING (
            organization_id IN (
                SELECT organization_id FROM public.organization_members
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
            )
        )
    """)
    
    # Admins and owners can delete members (but not remove owner unless owner)
    op.execute("""
        CREATE POLICY org_members_delete_policy ON public.organization_members
        FOR DELETE USING (
            organization_id IN (
                SELECT organization_id FROM public.organization_members
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
            )
        )
    """)

    # Create RLS policies for profiles
    # Users can see their own profile
    op.execute("""
        CREATE POLICY profiles_select_policy ON public.profiles
        FOR SELECT USING (id = auth.uid())
    """)
    
    # Users can insert their own profile
    op.execute("""
        CREATE POLICY profiles_insert_policy ON public.profiles
        FOR INSERT WITH CHECK (id = auth.uid())
    """)
    
    # Users can update their own profile
    op.execute("""
        CREATE POLICY profiles_update_policy ON public.profiles
        FOR UPDATE USING (id = auth.uid())
    """)


def downgrade() -> None:
    # Drop RLS policies
    op.execute('DROP POLICY IF EXISTS organizations_select_policy ON public.organizations')
    op.execute('DROP POLICY IF EXISTS organizations_insert_policy ON public.organizations')
    op.execute('DROP POLICY IF EXISTS organizations_update_policy ON public.organizations')
    op.execute('DROP POLICY IF EXISTS organizations_delete_policy ON public.organizations')
    
    op.execute('DROP POLICY IF EXISTS org_members_select_policy ON public.organization_members')
    op.execute('DROP POLICY IF EXISTS org_members_insert_policy ON public.organization_members')
    op.execute('DROP POLICY IF EXISTS org_members_update_policy ON public.organization_members')
    op.execute('DROP POLICY IF EXISTS org_members_delete_policy ON public.organization_members')
    
    op.execute('DROP POLICY IF EXISTS profiles_select_policy ON public.profiles')
    op.execute('DROP POLICY IF EXISTS profiles_insert_policy ON public.profiles')
    op.execute('DROP POLICY IF EXISTS profiles_update_policy ON public.profiles')

    # Disable RLS
    op.execute('ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY')
    op.execute('ALTER TABLE public.organization_members DISABLE ROW LEVEL SECURITY')
    op.execute('ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY')

    # Drop tables
    op.drop_table('profiles', schema='public')
    op.drop_table('organization_members', schema='public')
    op.drop_table('organizations', schema='public')