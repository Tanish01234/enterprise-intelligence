-- ============================================================
-- Enterprise Intelligence Platform
-- Migration 001: Auth, Organizations, Profiles
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Enum: organization_role
DO $$ BEGIN
  CREATE TYPE organization_role AS ENUM ('owner', 'admin', 'analyst', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Table: organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  slug          VARCHAR(50) NOT NULL,
  settings      JSONB NOT NULL DEFAULT '{"timezone": "UTC", "currency": "USD", "fiscal_year_start": 1}'::jsonb,
  owner_id      UUID NOT NULL REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_organizations_slug UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS ix_organizations_owner_id ON public.organizations (owner_id);

-- 3. Table: organization_members
CREATE TABLE IF NOT EXISTS public.organization_members (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role              organization_role NOT NULL DEFAULT 'viewer',
  joined_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  invited_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_org_member UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS ix_org_members_org_id ON public.organization_members (organization_id);
CREATE INDEX IF NOT EXISTS ix_org_members_user_id ON public.organization_members (user_id);

-- 4. Table: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     VARCHAR(100),
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Organizations policies
DROP POLICY IF EXISTS organizations_select_policy ON public.organizations;
CREATE POLICY organizations_select_policy ON public.organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS organizations_insert_policy ON public.organizations;
CREATE POLICY organizations_insert_policy ON public.organizations
  FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS organizations_update_policy ON public.organizations;
CREATE POLICY organizations_update_policy ON public.organizations
  FOR UPDATE USING (
    id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

DROP POLICY IF EXISTS organizations_delete_policy ON public.organizations;
CREATE POLICY organizations_delete_policy ON public.organizations
  FOR DELETE USING (
    id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND role = 'owner')
  );

-- Organization members policies
DROP POLICY IF EXISTS org_members_select_policy ON public.organization_members;
CREATE POLICY org_members_select_policy ON public.organization_members
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS org_members_insert_policy ON public.organization_members;
CREATE POLICY org_members_insert_policy ON public.organization_members
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

DROP POLICY IF EXISTS org_members_update_policy ON public.organization_members;
CREATE POLICY org_members_update_policy ON public.organization_members
  FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

DROP POLICY IF EXISTS org_members_delete_policy ON public.organization_members;
CREATE POLICY org_members_delete_policy ON public.organization_members
  FOR DELETE USING (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- Profiles policies
DROP POLICY IF EXISTS profiles_select_policy ON public.profiles;
CREATE POLICY profiles_select_policy ON public.profiles
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS profiles_insert_policy ON public.profiles;
CREATE POLICY profiles_insert_policy ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS profiles_update_policy ON public.profiles;
CREATE POLICY profiles_update_policy ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- ============================================================
-- Service role bypass (so FastAPI backend with service_role key can CRUD all rows)
-- ============================================================
ALTER TABLE public.organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members FORCE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
