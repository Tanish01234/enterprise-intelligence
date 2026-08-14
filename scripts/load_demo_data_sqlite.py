#!/usr/bin/env python3
"""
SYNORA DEMO DATA LOADER - SQLite Version
Loads the 100K row CSV into SQLite database
"""

import csv
import sys
import sqlite3
from pathlib import Path

# Configuration
CSV_PATH = Path(__file__).parent.parent / "demo_sales_data_2025_2026.csv"
SQLITE_PATH = Path(__file__).parent.parent / "apps/api/data/synora.db"

def load_to_sqlite():
    """Load CSV data to SQLite"""
    print("=" * 60)
    print("SYNORA DEMO DATA LOADER (SQLite)")
    print("=" * 60)
    print()
    
    if not CSV_PATH.exists():
        print(f"❌ Error: CSV file not found at {CSV_PATH}")
        sys.exit(1)
    
    print(f"✓ Found CSV file: {CSV_PATH}")
    print()
    
    # Ensure directory exists
    SQLITE_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    print(f"Connecting to SQLite database: {SQLITE_PATH}")
    conn = sqlite3.connect(str(SQLITE_PATH))
    cursor = conn.cursor()
    
    print("Creating demo_sales_data table...")
    cursor.execute("DROP TABLE IF EXISTS demo_sales_data")
    cursor.execute("""
        CREATE TABLE demo_sales_data (
            id INTEGER PRIMARY KEY,
            date TEXT NOT NULL,
            order_id TEXT NOT NULL,
            invoice_number TEXT NOT NULL,
            company_name TEXT NOT NULL,
            industry TEXT NOT NULL,
            region TEXT NOT NULL,
            city TEXT NOT NULL,
            customer_type TEXT NOT NULL,
            sales_rep TEXT NOT NULL,
            product_name TEXT NOT NULL,
            product_category TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            discount_percentage REAL NOT NULL,
            tax_percentage REAL NOT NULL,
            total_sales REAL NOT NULL,
            cost REAL NOT NULL,
            profit REAL NOT NULL,
            profit_margin REAL NOT NULL,
            payment_method TEXT NOT NULL,
            order_status TEXT NOT NULL,
            delivery_status TEXT NOT NULL,
            customer_satisfaction REAL,
            subscription_plan TEXT,
            renewal_status TEXT
        )
    """)
    print("✓ Table created")
    print()
    
    print("Reading CSV and inserting data (this may take 1-2 minutes)...")
    
    with open(CSV_PATH, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        rows_inserted = 0
        batch = []
        
        for row in reader:
            # Convert empty strings to None for nullable fields
            customer_satisfaction = row['customer_satisfaction'] if row['customer_satisfaction'] else None
            subscription_plan = row['subscription_plan'] if row['subscription_plan'] else None
            renewal_status = row['renewal_status'] if row['renewal_status'] else None
            
            batch.append((
                int(row['id']),
                row['date'],
                row['order_id'],
                row['invoice_number'],
                row['company_name'],
                row['industry'],
                row['region'],
                row['city'],
                row['customer_type'],
                row['sales_rep'],
                row['product_name'],
                row['product_category'],
                int(row['quantity']),
                float(row['unit_price']),
                float(row['discount_percentage']),
                float(row['tax_percentage']),
                float(row['total_sales']),
                float(row['cost']),
                float(row['profit']),
                float(row['profit_margin']),
                row['payment_method'],
                row['order_status'],
                row['delivery_status'],
                float(customer_satisfaction) if customer_satisfaction else None,
                subscription_plan,
                renewal_status
            ))
            
            rows_inserted += 1
            
            # Insert in batches of 1000
            if len(batch) >= 1000:
                cursor.executemany("""
                    INSERT INTO demo_sales_data VALUES (
                        ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
                    )
                """, batch)
                batch = []
                if rows_inserted % 10000 == 0:
                    print(f"  Inserted {rows_inserted:,} rows...")
        
        # Insert remaining rows
        if batch:
            cursor.executemany("""
                INSERT INTO demo_sales_data VALUES (
                    ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
                )
            """, batch)
    
    conn.commit()
    print(f"✓ Inserted {rows_inserted:,} rows")
    print()
    
    print("Creating indexes for optimal performance...")
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_demo_sales_date ON demo_sales_data(date)",
        "CREATE INDEX IF NOT EXISTS idx_demo_sales_industry ON demo_sales_data(industry)",
        "CREATE INDEX IF NOT EXISTS idx_demo_sales_region ON demo_sales_data(region)",
        "CREATE INDEX IF NOT EXISTS idx_demo_sales_product ON demo_sales_data(product_category)",
        "CREATE INDEX IF NOT EXISTS idx_demo_sales_customer_type ON demo_sales_data(customer_type)",
        "CREATE INDEX IF NOT EXISTS idx_demo_sales_city ON demo_sales_data(city)",
        "CREATE INDEX IF NOT EXISTS idx_demo_sales_order_status ON demo_sales_data(order_status)",
    ]
    
    for idx in indexes:
        cursor.execute(idx)
    
    conn.commit()
    print("✓ Indexes created")
    print()
    
    # Verify data
    print("Verifying data load...")
    cursor.execute("SELECT COUNT(*) FROM demo_sales_data")
    row_count = cursor.fetchone()[0]
    print(f"✓ Total rows: {row_count:,}")
    
    cursor.execute("SELECT MIN(date), MAX(date) FROM demo_sales_data")
    date_range = cursor.fetchone()
    print(f"✓ Date range: {date_range[0]} to {date_range[1]}")
    
    cursor.execute("SELECT SUM(total_sales) FROM demo_sales_data")
    total_revenue = cursor.fetchone()[0]
    print(f"✓ Total revenue: ${total_revenue:,.2f}")
    
    cursor.close()
    conn.close()
    
    print()
    print("=" * 60)
    print("✅ DEMO DATA LOADED SUCCESSFULLY!")
    print("=" * 60)
    print()
    print("You can now:")
    print("1. Login with demo@synora.ai / Synora@2026")
    print("2. View 100,000 sales records")
    print("3. Explore analytics and dashboards")
    print()

if __name__ == "__main__":
    try:
        load_to_sqlite()
    except Exception as e:
        print()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
