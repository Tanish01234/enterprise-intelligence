# SYNORA DATABASE MIGRATION GUIDE

## Overview
This guide walks through setting up the complete Synora database schema in Supabase.

**Important**: Run these migrations in order. Each migration depends on the previous one.

---

## Prerequisites

1. Supabase project created
2. Access to Supabase SQL Editor (Dashboard > SQL Editor)
3. Service role key configured in backend `.env`

---

## Migration Order

### Step 1: Organizations & Auth
**File**: `01_organizations_and_auth.sql`

**Creates**:
- `organizations` table
- `organization_members` table
- `profiles` table
- Row Level Security policies
- Indexes

**What it does**:
- Sets up multi-tenant organization structure
- Links Supabase auth users to profiles
- Establishes role-based access control (owner, admin, analyst, viewer)

**Run in Supabase SQL Editor**:
```sql
-- Copy and paste contents of 01_organizations_and_auth.sql
```

**Verify**:
```sql
SELECT * FROM public.organizations;
SELECT * FROM public.profiles;
SELECT * FROM public.organization_members;
```

---

### Step 2: DataMart & Analytics
**File**: `02_datamart_and_analytics.sql`

**Creates**:
- `datasets` table
- `dataset_mappings` table
- `analytics_metadata` table
- RLS policies
- Indexes

**What it does**:
- Sets up dataset storage metadata
- Tracks dataset processing status
- Stores column mappings for analytics

**Run in Supabase SQL Editor**:
```sql
-- Copy and paste contents of 02_datamart_and_analytics.sql
```

**Verify**:
```sql
SELECT * FROM public.datasets;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'datasets';
```

---

### Step 3: AI & Reports
**File**: `03_ai_and_reports.sql`

**Creates**:
- `ai_conversations` table
- `ai_messages` table
- `reports` table
- RLS policies
- Indexes

**What it does**:
- Enables AI chat functionality
- Stores conversation history
- Tracks report generation

**Run in Supabase SQL Editor**:
```sql
-- Copy and paste contents of 03_ai_and_reports.sql
```

**Verify**:
```sql
SELECT * FROM public.ai_conversations;
SELECT * FROM public.reports;
```

---

### Step 4: Dataset Enhancements
**File**: `../apps/api/alembic/versions/003_update_datasets_table.sql`

**Adds to datasets**:
- `duckdb_table_name` - Links to DuckDB table
- `schema` - JSONB column metadata
- `description` - Dataset description
- `file_type` - CSV, Excel, etc.
- `original_filename` - Preserves original name
- Processing timestamps

**Run in Supabase SQL Editor**:
```sql
-- Copy and paste contents of 003_update_datasets_table.sql
```

**Verify**:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'datasets' AND column_name LIKE '%duckdb%';
```

---

## Post-Migration Setup

### 1. Create Test Organization

```sql
-- Insert test organization
INSERT INTO public.organizations (id, name, slug, owner_id, settings)
VALUES (
  gen_random_uuid(),
  'Test Company',
  'test-company',
  (SELECT id FROM auth.users LIMIT 1),
  '{"timezone": "UTC", "currency": "USD", "fiscal_year_start": 1}'::jsonb
);

-- Add user as organization member
INSERT INTO public.organization_members (organization_id, user_id, role)
VALUES (
  (SELECT id FROM public.organizations WHERE slug = 'test-company'),
  (SELECT id FROM auth.users LIMIT 1),
  'owner'
);
```

### 2. Verify RLS Policies

```sql
-- Test as authenticated user
SELECT * FROM public.organizations; -- Should see organizations you're a member of
SELECT * FROM public.datasets; -- Should see datasets in your organizations
```

### 3. Test Profile Creation

Sign up a new user via the frontend and verify:

```sql
SELECT * FROM public.profiles WHERE email = 'newuser@example.com';
```

---

## Table Relationships

```
auth.users (Supabase Auth)
    ↓
profiles (1:1)
    ↓
organizations (created by user)
    ↓
organization_members (many:many users ↔ organizations)
    ↓
datasets (belongs to organization)
    ↓
ai_conversations (belongs to organization + user)
    ↓
ai_messages (belongs to conversation)

reports (belongs to organization + user)
```

---

## Row Level Security Summary

### Organizations
- **SELECT**: Members can view their organizations
- **INSERT**: Users can create organizations
- **UPDATE**: Owners/admins can update
- **DELETE**: Only owners can delete

### Datasets
- **SELECT**: Organization members can view
- **INSERT**: Organization members can upload
- **UPDATE**: Organization members can update
- **DELETE**: Owners/admins can delete

### AI Conversations
- **SELECT**: Organization members can view
- **INSERT**: Users can create conversations
- **UPDATE**: Only conversation owner can update
- **DELETE**: Only conversation owner can delete

### Reports
- **SELECT**: Organization members can view
- **INSERT**: Users can generate reports
- **DELETE**: Report owner or org admins can delete

---

## Rollback Instructions

If you need to rollback (⚠️ **WARNING: DELETES ALL DATA**):

```sql
-- Drop tables in reverse order
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.ai_messages CASCADE;
DROP TABLE IF EXISTS public.ai_conversations CASCADE;
DROP TABLE IF EXISTS public.analytics_metadata CASCADE;
DROP TABLE IF EXISTS public.dataset_mappings CASCADE;
DROP TABLE IF EXISTS public.datasets CASCADE;
DROP TABLE IF EXISTS public.organization_members CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop types
DROP TYPE IF EXISTS organization_role CASCADE;
DROP TYPE IF EXISTS dataset_status CASCADE;
DROP TYPE IF EXISTS report_type CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

---

## Troubleshooting

### Issue: "Permission denied for table"
**Solution**: Make sure you're using the SQL Editor in Supabase Dashboard, which runs as service_role.

### Issue: "Relation already exists"
**Solution**: Tables were partially created. Either continue from next step or run rollback.

### Issue: "Foreign key constraint fails"
**Solution**: Run migrations in order. Later migrations depend on earlier ones.

### Issue: RLS blocks all queries
**Solution**: 
1. Check you're authenticated: `SELECT auth.uid();`
2. Verify you're a member: `SELECT * FROM organization_members WHERE user_id = auth.uid();`
3. For testing, temporarily disable RLS: `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;`

---

## Verification Checklist

After running all migrations:

- [ ] All 8 tables created (organizations, organization_members, profiles, datasets, dataset_mappings, analytics_metadata, ai_conversations, ai_messages, reports)
- [ ] All indexes created
- [ ] RLS enabled on all tables
- [ ] Triggers created (updated_at)
- [ ] Test user can sign up and profile auto-creates
- [ ] Test user can create organization
- [ ] Test user can upload dataset
- [ ] Test user can create AI conversation

---

## Next Steps

1. Configure backend environment variables
2. Start FastAPI backend
3. Test authentication flow
4. Upload test dataset
5. Verify dataset appears in dashboard

---

## Support

If you encounter issues:
1. Check Supabase logs (Dashboard > Logs)
2. Verify all migrations ran successfully
3. Check RLS policies are correct
4. Ensure service role key is in backend .env
