#!/bin/bash
# Simple CSV loader using psql COPY command

set -e

echo "============================================"
echo "SYNORA DEMO DATA LOADER (Simple Version)"
echo "============================================"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable not set"
    echo "Set it with: export DATABASE_URL='your_supabase_url'"
    exit 1
fi

# Check if CSV file exists
CSV_FILE="/Users/tanisbedia/PS-05/demo_sales_data_2025_2026.csv"
if [ ! -f "$CSV_FILE" ]; then
    echo "❌ Error: CSV file not found at $CSV_FILE"
    exit 1
fi

echo "✓ Found CSV file: $CSV_FILE"
echo "✓ Database URL configured"
echo ""

# Create table
echo "Creating demo_sales_data table..."
psql "$DATABASE_URL" << 'EOF'
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
EOF

echo "✓ Table created"
echo ""

# Load CSV data
echo "Loading CSV data (this may take 2-3 minutes)..."
psql "$DATABASE_URL" -c "\COPY public.demo_sales_data FROM '$CSV_FILE' WITH (FORMAT CSV, HEADER true);"

echo "✓ Data loaded"
echo ""

# Create indexes
echo "Creating indexes for optimal performance..."
psql "$DATABASE_URL" << 'EOF'
CREATE INDEX IF NOT EXISTS idx_demo_sales_date ON public.demo_sales_data(date);
CREATE INDEX IF NOT EXISTS idx_demo_sales_industry ON public.demo_sales_data(industry);
CREATE INDEX IF NOT EXISTS idx_demo_sales_region ON public.demo_sales_data(region);
CREATE INDEX IF NOT EXISTS idx_demo_sales_product ON public.demo_sales_data(product_category);
CREATE INDEX IF NOT EXISTS idx_demo_sales_customer_type ON public.demo_sales_data(customer_type);
CREATE INDEX IF NOT EXISTS idx_demo_sales_date_region ON public.demo_sales_data(date, region);
CREATE INDEX IF NOT EXISTS idx_demo_sales_date_industry ON public.demo_sales_data(date, industry);

ANALYZE public.demo_sales_data;
EOF

echo "✓ Indexes created"
echo ""

# Verify data
echo "Verifying data load..."
ROW_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM public.demo_sales_data;")
echo "✓ Loaded $ROW_COUNT rows"
echo ""

echo "============================================"
echo "✅ DEMO DATA LOADED SUCCESSFULLY!"
echo "============================================"
echo ""
echo "You can now:"
echo "1. Login with demo@synora.ai / Synora@2026"
echo "2. View 100,000 sales records"
echo "3. Explore analytics and dashboards"
echo ""
