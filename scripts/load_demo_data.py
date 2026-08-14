#!/usr/bin/env python3
"""
SYNORA DEMO DATA LOADER
Loads the 100K row CSV into PostgreSQL and DuckDB
"""

import os
import sys
import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch
import duckdb
from pathlib import Path

# Configuration
CSV_PATH = Path(__file__).parent.parent / "demo_sales_data_2025_2026.csv"
POSTGRES_URL = os.getenv("DATABASE_URL")
DUCKDB_PATH = Path(__file__).parent.parent / "apps/api/data/synora.db"

def load_to_postgres():
    """Load CSV data to PostgreSQL"""
    print("Loading CSV file...")
    df = pd.read_csv(CSV_PATH)
    print(f"Loaded {len(df)} rows")
    
    print("Connecting to PostgreSQL...")
    conn = psycopg2.connect(POSTGRES_URL)
    cursor = conn.cursor()
    
    print("Creating table if not exists...")
    cursor.execute("""
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
    """)
    
    print("Clearing existing data...")
    cursor.execute("DELETE FROM public.demo_sales_data")
    
    print("Inserting data (this may take a minute)...")
    insert_query = """
        INSERT INTO public.demo_sales_data VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s
        )
    """
    
    data_tuples = [tuple(row) for row in df.values]
    execute_batch(cursor, insert_query, data_tuples, page_size=1000)
    
    print("Creating indexes...")
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_demo_sales_date ON public.demo_sales_data(date)",
        "CREATE INDEX IF NOT EXISTS idx_demo_sales_industry ON public.demo_sales_data(industry)",
        "CREATE INDEX IF NOT EXISTS idx_demo_sales_region ON public.demo_sales_data(region)",
        "CREATE INDEX IF NOT EXISTS idx_demo_sales_product ON public.demo_sales_data(product_category)",
        "CREATE INDEX IF NOT EXISTS idx_demo_sales_date_region ON public.demo_sales_data(date, region)",
    ]
    
    for idx in indexes:
        cursor.execute(idx)
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print("✅ PostgreSQL load complete!")

def load_to_duckdb():
    """Load CSV data to DuckDB"""
    print("Loading to DuckDB...")
    
    # Ensure directory exists
    DUCKDB_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    conn = duckdb.connect(str(DUCKDB_PATH))
    
    print("Creating table from CSV...")
    conn.execute(f"""
        CREATE OR REPLACE TABLE demo_sales_data AS 
        SELECT * FROM read_csv_auto('{CSV_PATH}')
    """)
    
    print("Creating indexes...")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_date ON demo_sales_data(date)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_industry ON demo_sales_data(industry)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_region ON demo_sales_data(region)")
    
    row_count = conn.execute("SELECT COUNT(*) FROM demo_sales_data").fetchone()[0]
    print(f"✅ DuckDB load complete! {row_count} rows")
    
    conn.close()

if __name__ == "__main__":
    if not CSV_PATH.exists():
        print(f"❌ Error: CSV file not found at {CSV_PATH}")
        sys.exit(1)
    
    if not POSTGRES_URL:
        print("❌ Error: DATABASE_URL environment variable not set")
        sys.exit(1)
    
    print("=" * 60)
    print("SYNORA DEMO DATA LOADER")
    print("=" * 60)
    
    try:
        load_to_postgres()
        load_to_duckdb()
        
        print("\n" + "=" * 60)
        print("✅ DEMO DATA LOADED SUCCESSFULLY!")
        print("=" * 60)
        print("\nYou can now:")
        print("1. Login with demo@synora.ai / Synora@2026")
        print("2. View 100,000 sales records")
        print("3. Explore analytics and dashboards")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
