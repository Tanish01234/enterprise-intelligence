-- ============================================================
-- Enterprise Intelligence Platform
-- Migration 004: AI Conversations and Reports
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- Depends on: 01_organizations_and_auth.sql
-- ============================================================

-- 1. Table: ai_conversations
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title             VARCHAR(255),
  context           JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_ai_conversations_org_id ON public.ai_conversations (organization_id);
CREATE INDEX IF NOT EXISTS ix_ai_conversations_user_id ON public.ai_conversations (user_id);
CREATE INDEX IF NOT EXISTS ix_ai_conversations_updated_at ON public.ai_conversations (updated_at DESC);

-- 2. Table: ai_messages
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role              VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content           TEXT NOT NULL,
  generated_sql     TEXT,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_ai_messages_conversation_id ON public.ai_messages (conversation_id);
CREATE INDEX IF NOT EXISTS ix_ai_messages_created_at ON public.ai_messages (created_at);

-- 3. Enum: report_type
DO $$ BEGIN
  CREATE TYPE report_type AS ENUM ('pdf', 'csv', 'excel', 'json');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Table: reports
CREATE TABLE IF NOT EXISTS public.reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_name       VARCHAR(255) NOT NULL,
  report_type       report_type NOT NULL,
  file_path         TEXT,
  file_size_bytes   INTEGER,
  query_params      JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_reports_org_id ON public.reports (organization_id);
CREATE INDEX IF NOT EXISTS ix_reports_user_id ON public.reports (user_id);
CREATE INDEX IF NOT EXISTS ix_reports_created_at ON public.reports (created_at DESC);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- AI Conversations policies
DROP POLICY IF EXISTS ai_conversations_select_policy ON public.ai_conversations;
CREATE POLICY ai_conversations_select_policy ON public.ai_conversations
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS ai_conversations_insert_policy ON public.ai_conversations;
CREATE POLICY ai_conversations_insert_policy ON public.ai_conversations
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS ai_conversations_update_policy ON public.ai_conversations;
CREATE POLICY ai_conversations_update_policy ON public.ai_conversations
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS ai_conversations_delete_policy ON public.ai_conversations;
CREATE POLICY ai_conversations_delete_policy ON public.ai_conversations
  FOR DELETE USING (user_id = auth.uid());

-- AI Messages policies
DROP POLICY IF EXISTS ai_messages_select_policy ON public.ai_messages;
CREATE POLICY ai_messages_select_policy ON public.ai_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM public.ai_conversations 
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS ai_messages_insert_policy ON public.ai_messages;
CREATE POLICY ai_messages_insert_policy ON public.ai_messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.ai_conversations WHERE user_id = auth.uid()
    )
  );

-- Reports policies
DROP POLICY IF EXISTS reports_select_policy ON public.reports;
CREATE POLICY reports_select_policy ON public.reports
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS reports_insert_policy ON public.reports;
CREATE POLICY reports_insert_policy ON public.reports
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS reports_delete_policy ON public.reports;
CREATE POLICY reports_delete_policy ON public.reports
  FOR DELETE USING (
    user_id = auth.uid() OR
    organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- ============================================================
-- Service role bypass
-- ============================================================
ALTER TABLE public.ai_conversations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE public.reports FORCE ROW LEVEL SECURITY;

-- ============================================================
-- Update trigger for ai_conversations
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_ai_conversations_updated_at ON public.ai_conversations;
CREATE TRIGGER update_ai_conversations_updated_at
    BEFORE UPDATE ON public.ai_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
