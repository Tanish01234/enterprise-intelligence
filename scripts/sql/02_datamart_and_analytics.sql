-- ============================================================
-- Enterprise Intelligence Platform
-- Migration 003: DataMart & Analytics Tables
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- Depends on: 01_organizations_and_auth.sql
-- ============================================================

-- 1. Enum: dataset_status
DO $$ BEGIN
  CREATE TYPE dataset_status AS ENUM ('pending', 'mapped', 'ingesting', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Table: datasets
CREATE TABLE IF NOT EXISTS public.datasets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  filename          VARCHAR(255) NOT NULL,
  file_path         TEXT NOT NULL,
  file_size_bytes   INTEGER NOT NULL,
  row_count         INTEGER,
  column_count      INTEGER,
  delimiter         VARCHAR(10) NOT NULL DEFAULT ',',
  columns_metadata  JSONB,
  status            dataset_status NOT NULL DEFAULT 'pending',
  error_message     TEXT,
  created_by        UUID NOT NULL REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_datasets_org_id ON public.datasets (organization_id);
CREATE INDEX IF NOT EXISTS ix_datasets_status ON public.datasets (organization_id, status);

-- 3. Table: dataset_mappings
CREATE TABLE IF NOT EXISTS public.dataset_mappings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  dataset_id        UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  target_entity     VARCHAR(50) NOT NULL,
  mapping_rules     JSONB NOT NULL,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_dataset_mappings_org_id ON public.dataset_mappings (organization_id);
CREATE INDEX IF NOT EXISTS ix_dataset_mappings_dataset_id ON public.dataset_mappings (dataset_id);

-- 4. Table: analytics_metadata
CREATE TABLE IF NOT EXISTS public.analytics_metadata (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  metric_key        VARCHAR(100) NOT NULL,
  name              VARCHAR(200) NOT NULL,
  calculation_type  VARCHAR(50) NOT NULL,
  definition        JSONB NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_analytics_meta_key UNIQUE (organization_id, metric_key)
);

CREATE INDEX IF NOT EXISTS ix_analytics_meta_org_id ON public.analytics_metadata (organization_id);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_metadata ENABLE ROW LEVEL SECURITY;

-- Datasets policies
DROP POLICY IF EXISTS datasets_select_policy ON public.datasets;
CREATE POLICY datasets_select_policy ON public.datasets
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS datasets_insert_policy ON public.datasets;
CREATE POLICY datasets_insert_policy ON public.datasets
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS datasets_update_policy ON public.datasets;
CREATE POLICY datasets_update_policy ON public.datasets
  FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS datasets_delete_policy ON public.datasets;
CREATE POLICY datasets_delete_policy ON public.datasets
  FOR DELETE USING (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- Dataset mappings policies
DROP POLICY IF EXISTS dataset_mappings_select_policy ON public.dataset_mappings;
CREATE POLICY dataset_mappings_select_policy ON public.dataset_mappings
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS dataset_mappings_insert_policy ON public.dataset_mappings;
CREATE POLICY dataset_mappings_insert_policy ON public.dataset_mappings
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS dataset_mappings_update_policy ON public.dataset_mappings;
CREATE POLICY dataset_mappings_update_policy ON public.dataset_mappings
  FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS dataset_mappings_delete_policy ON public.dataset_mappings;
CREATE POLICY dataset_mappings_delete_policy ON public.dataset_mappings
  FOR DELETE USING (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- Analytics metadata policies
DROP POLICY IF EXISTS analytics_metadata_select_policy ON public.analytics_metadata;
CREATE POLICY analytics_metadata_select_policy ON public.analytics_metadata
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS analytics_metadata_insert_policy ON public.analytics_metadata;
CREATE POLICY analytics_metadata_insert_policy ON public.analytics_metadata
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS analytics_metadata_update_policy ON public.analytics_metadata;
CREATE POLICY analytics_metadata_update_policy ON public.analytics_metadata
  FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS analytics_metadata_delete_policy ON public.analytics_metadata;
CREATE POLICY analytics_metadata_delete_policy ON public.analytics_metadata
  FOR DELETE USING (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================================
-- Service role bypass
-- ============================================================
ALTER TABLE public.datasets FORCE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_mappings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_metadata FORCE ROW LEVEL SECURITY;
