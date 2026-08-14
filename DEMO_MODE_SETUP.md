# 🚀 SYNORA DEMO MODE - SETUP GUIDE

## Quick Setup (5 Minutes)

### Step 1: Create Demo User in Supabase

1. Go to your Supabase Dashboard
2. Navigate to: **Authentication > Users**
3. Click **Add User**
4. Fill in:
   - **Email**: `demo@synora.ai`
   - **Password**: `demo123`
   - **Auto Confirm**: ✅ YES (important!)
5. Click **Create User**
6. **Copy the generated UUID** - you'll need it for Step 3

### Step 2: Create Demo Sales Table

1. Go to Supabase Dashboard > **SQL Editor**
2. Run this file: `scripts/sql/04_demo_schema.sql`
3. This creates the `demo_sales_data` table with indexes and RLS policies

### Step 3: Load CSV Data

**Option A: Using psql (Fastest)**
```bash
psql "YOUR_SUPABASE_DATABASE_URL" -c "\COPY public.demo_sales_data FROM '/Users/tanisbedia/PS-05/demo_sales_data_2025_2026.csv' WITH (FORMAT CSV, HEADER true);"
```

**Option B: Using Supabase Dashboard**
1. Table Editor > demo_sales_data
2. Import CSV
3. Select: `/Users/tanisbedia/PS-05/demo_sales_data_2025_2026.csv`

**Option C: Using DBeaver/pgAdmin**
1. Connect to Supabase database
2. Right-click `demo_sales_data` table > Import Data
3. Select CSV file and import

### Step 4: Create Profile & Organization (Optional)

Edit `scripts/sql/04_demo_schema.sql` and uncomment the inserts section:
- Replace `YOUR_USER_UUID` with the UUID from Step 1
- Run the uncommented SQL in Supabase SQL Editor

### Step 5: Test Demo Login

1. Start your application
2. Go to sign-in page
3. Enter:
   - Email: `demo@synora.ai`
   - Password: `demo123`
4. You should be logged in and see the demo data!

---

## Demo Mode Features

✅ **What Works:**
- Demo authentication (bypasses normal Supabase auth)
- Pre-loaded 100,000 sales records (2025-2026)
- Full analytics dashboard with real data
- All charts and KPIs calculated from demo data
- Read-only dataset (no modifications allowed)
- AI queries against demo data

❌ **What's Disabled:**
- Dataset uploads
- Dataset deletion
- Team invitations
- Organization modifications
- Profile editing

---

## Demo Data Overview

**Dataset**: Sales Data 2025-2026  
**Records**: 100,000 rows  
**Date Range**: Jan 1, 2025 - Dec 31, 2026  
**Industries**: 10+ industries  
**Regions**: International coverage  
**Products**: Jewellery, Software, Services  

**Key Columns:**
- `date` - Transaction date
- `company_name` - Customer company
- `industry` - Customer industry
- `region` - Geographic region
- `city` - City location
- `product_name` - Product sold
- `product_category` - Category
- `total_sales` - Revenue
- `profit` - Profit amount
- `profit_margin` - Margin percentage
- `customer_satisfaction` - Rating 1-5
- `subscription_plan` - Plan type

---

## Troubleshooting

### Issue: "User not found" error
**Solution**: Make sure you created the demo user in Supabase Auth and auto-confirmed it

### Issue: "Table does not exist"
**Solution**: Run `scripts/sql/04_demo_schema.sql` in Supabase SQL Editor

### Issue: "No data showing"
**Solution**: Make sure the CSV was loaded. Check row count:
```sql
SELECT COUNT(*) FROM public.demo_sales_data;
-- Should return 100000
```

### Issue: "Permission denied"
**Solution**: The RLS policies should allow all authenticated users to read. Check:
```sql
SELECT * FROM public.demo_sales_data LIMIT 10;
```

---

## Performance Notes

- All indexes are optimized for dashboard queries
- Expected query response time: < 2 seconds
- Dashboard load time: < 3 seconds
- 100K rows fully indexed for fast aggregations

---

## Demo Banner

The demo mode should display a banner:

```
🚀 Demo Mode Active
You're exploring a preloaded enterprise dataset with 100,000 records from 2025-2026.
Sign up to analyze your own data.
```

---

## Next Steps After Demo Setup

1. Test the demo login flow
2. Verify dashboard loads with real data
3. Test analytics queries
4. Try AI queries against demo data
5. Export reports

**Demo is ready when:**
- ✅ Login works with demo@synora.ai
- ✅ Dashboard shows KPIs and charts
- ✅ All data is from demo_sales_data table
- ✅ User can't upload/delete/modify data
