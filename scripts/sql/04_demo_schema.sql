-- ============================================================================
-- SYNORA DEMO MODE - DATABASE SCHEMA (SIMPLIFIED)
-- ============================================================================
-- Description: Demo dataset for 100,000 sales records (2025-2026)
-- Purpose: Allow users to experience Synora without creating an account
-- NOTE: Demo user must be created via Supabase Auth Dashboard first!
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE DEMO USER VIA SUPABASE AUTH DASHBOARD
-- ============================================================================
-- Go to: Authentication > Users > Add User
-- Email: demo@synora.ai
-- Password: demo123
-- Auto Confirm: YES
-- Copy the generated UUID and replace in the inserts below
-- ============================================================================

-- After creating the user in Supabase, uncomment and run these:
-- Replace YOUR_USER_UUID with the actual UUID from Supabase

/*
-- Demo Profile
INSERT INTO public.profiles (
    id,
    full_name,
    avatar_url,
    created_at,
    updated_at
)
VALUES (
    'YOUR_USER_UUID'::uuid,  -- Replace with actual UUID from Supabase
    'Demo User',
    NULL,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

-- Demo Organization
INSERT INTO public.organizations (id, owner_id, name, slug, settings, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000002'::uuid,
    'YOUR_USER_UUID'::uuid,  -- Replace with actual UUID from Supabase
    'Synora Demo Workspace',
    'synora-demo',
    '{"timezone": "UTC", "currency": "USD", "fiscal_year_start": 1}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW();

-- Demo Organization Member (Owner)
INSERT INTO public.organization_members (
    id,
    organization_id,
    user_id,
    role,
    joined_at,
    invited_by
)
VALUES (
    '00000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    'YOUR_USER_UUID'::uuid,  -- Replace with actual UUID from Supabase
    'owner',
    NOW(),
    NULL
) ON CONFLICT (id) DO NOTHING;
*/

-- ============================================================================
-- DEMO SALES DATA TABLE (Can run immediately)
-- ============================================================================

-- Create Demo Sales Data Table
CREATE TABLE IF NOT EXISTS public.demo_sales_data (
    id INTEGER PRIMARY KEY,
    date DATE NOT NULL,
    order_id VARCHAR(50) NOT NULL,
    invoice_number VARCHAR(50) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    customer_type VARCHAR(50) NOT NULL,
    sales_rep VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_category VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    discount_percentage DECIMAL(5, 2) NOT NULL,
    tax_percentage DECIMAL(5, 2) NOT NULL,
    total_sales DECIMAL(15, 2) NOT NULL,
    cost DECIMAL(15, 2) NOT NULL,
    profit DECIMAL(15, 2) NOT NULL,
    profit_margin DECIMAL(5, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    order_status VARCHAR(50) NOT NULL,
    delivery_status VARCHAR(50) NOT NULL,
    customer_satisfaction DECIMAL(3, 1),
    subscription_plan VARCHAR(50),
    renewal_status VARCHAR(50)
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_demo_sales_date ON public.demo_sales_data(date);
CREATE INDEX IF NOT EXISTS idx_demo_sales_product ON public.demo_sales_data(product_name);
CREATE INDEX IF NOT EXISTS idx_demo_sales_industry ON public.demo_sales_data(industry);
CREATE INDEX IF NOT EXISTS idx_demo_sales_customer_type ON public.demo_sales_data(customer_type);
CREATE INDEX IF NOT EXISTS idx_demo_sales_city ON public.demo_sales_data(city);
CREATE INDEX IF NOT EXISTS idx_demo_sales_region ON public.demo_sales_data(region);
CREATE INDEX IF NOT EXISTS idx_demo_sales_subscription ON public.demo_sales_data(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_demo_sales_category ON public.demo_sales_data(product_category);
CREATE INDEX IF NOT EXISTS idx_demo_sales_order_id ON public.demo_sales_data(order_id);
CREATE INDEX IF NOT EXISTS idx_demo_sales_company ON public.demo_sales_data(company_name);
CREATE INDEX IF NOT EXISTS idx_demo_sales_sales_rep ON public.demo_sales_data(sales_rep);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_demo_sales_date_region ON public.demo_sales_data(date, region);
CREATE INDEX IF NOT EXISTS idx_demo_sales_date_industry ON public.demo_sales_data(date, industry);
CREATE INDEX IF NOT EXISTS idx_demo_sales_date_product ON public.demo_sales_data(date, product_category);
CREATE INDEX IF NOT EXISTS idx_demo_sales_date_status ON public.demo_sales_data(date, order_status);

-- Enable RLS for demo data (read-only)
ALTER TABLE public.demo_sales_data ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read demo data
DROP POLICY IF EXISTS demo_sales_select_policy ON public.demo_sales_data;
CREATE POLICY demo_sales_select_policy ON public.demo_sales_data
  FOR SELECT TO authenticated USING (true);

-- Prevent any modifications
DROP POLICY IF EXISTS demo_sales_insert_policy ON public.demo_sales_data;
CREATE POLICY demo_sales_insert_policy ON public.demo_sales_data
  FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS demo_sales_update_policy ON public.demo_sales_data;
CREATE POLICY demo_sales_update_policy ON public.demo_sales_data
  FOR UPDATE USING (false);

DROP POLICY IF EXISTS demo_sales_delete_policy ON public.demo_sales_data;
CREATE POLICY demo_sales_delete_policy ON public.demo_sales_data
  FOR DELETE USING (false);

-- Grant SELECT to authenticated users
GRANT SELECT ON public.demo_sales_data TO authenticated;

-- ============================================================================
-- LOAD CSV DATA - Run from terminal
-- ============================================================================
-- After creating the table, load the CSV data:
-- 
-- Method 1: Using psql
-- psql "YOUR_DATABASE_URL" -c "\COPY public.demo_sales_data FROM '/Users/tanisbedia/PS-05/demo_sales_data_2025_2026.csv' WITH (FORMAT CSV, HEADER true);"
--
-- Method 2: Using Supabase SQL Editor (for smaller datasets)
-- You may need to split the CSV into smaller chunks
--
-- Method 3: Use a database tool (DBeaver, pgAdmin) and import the CSV
-- ============================================================================

-- Analyze table for query optimization (run after data load)
-- ANALYZE public.demo_sales_data;
