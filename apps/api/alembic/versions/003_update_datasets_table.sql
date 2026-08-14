-- ============================================================
-- This migration adds missing columns to existing datasets table
-- The base table was created in 02_datamart_and_analytics.sql
-- Run this AFTER running 02_datamart_and_analytics.sql
-- ============================================================

-- Add DuckDB integration columns
ALTER TABLE public.datasets 
  ADD COLUMN IF NOT EXISTS duckdb_table_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS schema JSONB,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS file_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS original_filename VARCHAR(255),
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processing_duration_ms INTEGER;

-- Create additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_datasets_duckdb_table ON public.datasets (duckdb_table_name);
CREATE INDEX IF NOT EXISTS idx_datasets_file_type ON public.datasets (file_type);
CREATE INDEX IF NOT EXISTS idx_datasets_created_by ON public.datasets (created_by);

-- Update trigger for datasets
DROP TRIGGER IF EXISTS update_datasets_updated_at ON public.datasets;
CREATE TRIGGER update_datasets_updated_at
    BEFORE UPDATE ON public.datasets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
