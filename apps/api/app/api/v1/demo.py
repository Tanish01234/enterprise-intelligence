"""Demo mode API endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Dict, Any, List
import json

from app.core.database import get_db, get_duckdb

router = APIRouter()


def is_demo_token(authorization: str = None) -> bool:
    """Check if the authorization token is for demo mode."""
    if not authorization:
        return False
    return authorization.startswith("Bearer DEMO_ACCESS_TOKEN")


@router.get("/dashboard/kpis")
async def get_demo_dashboard_kpis(db: AsyncSession = Depends(get_db)):
    """Get dashboard KPIs from demo data."""
    
    query = text("""
        SELECT 
            SUM(total_sales) as total_revenue,
            COUNT(DISTINCT order_id) as total_orders,
            SUM(profit) as total_profit,
            ROUND(AVG(total_sales / NULLIF(quantity, 0)), 2) as avg_order_value,
            ROUND(AVG(profit_margin), 2) as avg_profit_margin,
            ROUND(AVG(customer_satisfaction), 2) as avg_customer_satisfaction,
            COUNT(DISTINCT company_name) as active_customers
        FROM public.demo_sales_data
        WHERE order_status = 'Completed'
    """)
    
    result = await db.execute(query)
    row = result.fetchone()
    
    if not row:
        return {}
    
    return {
        "total_revenue": float(row[0] or 0),
        "total_orders": int(row[1] or 0),
        "total_profit": float(row[2] or 0),
        "avg_order_value": float(row[3] or 0),
        "avg_profit_margin": float(row[4] or 0),
        "avg_customer_satisfaction": float(row[5] or 0),
        "active_customers": int(row[6] or 0)
    }


@router.get("/dashboard/revenue-trend")
async def get_demo_revenue_trend(db: AsyncSession = Depends(get_db)):
    """Get monthly revenue trend."""
    
    query = text("""
        SELECT 
            TO_CHAR(date, 'YYYY-MM') as month,
            SUM(total_sales) as revenue,
            SUM(profit) as profit,
            COUNT(DISTINCT order_id) as orders
        FROM public.demo_sales_data
        WHERE order_status = 'Completed'
        GROUP BY TO_CHAR(date, 'YYYY-MM')
        ORDER BY month
    """)
    
    result = await db.execute(query)
    rows = result.fetchall()
    
    return [
        {
            "month": row[0],
            "revenue": float(row[1] or 0),
            "profit": float(row[2] or 0),
            "orders": int(row[3] or 0)
        }
        for row in rows
    ]


@router.get("/dashboard/activity")
async def get_demo_activity(db: AsyncSession = Depends(get_db)):
    """Get daily activity for last 30 days."""
    
    query = text("""
        SELECT 
            TO_CHAR(date, 'MM-DD') as day,
            COUNT(DISTINCT order_id) as queries
        FROM public.demo_sales_data
        WHERE order_status = 'Completed'
        AND date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY TO_CHAR(date, 'MM-DD'), date
        ORDER BY date
        LIMIT 30
    """)
    
    result = await db.execute(query)
    rows = result.fetchall()
    
    return [
        {
            "time": row[0],
            "queries": int(row[1] or 0)
        }
        for row in rows
    ]


@router.get("/analytics/regions")
async def get_demo_regions(db: AsyncSession = Depends(get_db)):
    """Get revenue by region."""
    
    query = text("""
        SELECT 
            region,
            SUM(total_sales) as revenue,
            SUM(profit) as profit,
            COUNT(DISTINCT order_id) as orders
        FROM public.demo_sales_data
        WHERE order_status = 'Completed'
        GROUP BY region
        ORDER BY revenue DESC
    """)
    
    result = await db.execute(query)
    rows = result.fetchall()
    
    return [
        {
            "region": row[0],
            "revenue": float(row[1] or 0),
            "profit": float(row[2] or 0),
            "orders": int(row[3] or 0)
        }
        for row in rows
    ]


@router.get("/analytics/industries")
async def get_demo_industries(db: AsyncSession = Depends(get_db)):
    """Get revenue by industry."""
    
    query = text("""
        SELECT 
            industry,
            SUM(total_sales) as revenue,
            SUM(profit) as profit,
            COUNT(DISTINCT order_id) as orders,
            ROUND(AVG(profit_margin), 2) as avg_margin
        FROM public.demo_sales_data
        WHERE order_status = 'Completed'
        GROUP BY industry
        ORDER BY revenue DESC
        LIMIT 10
    """)
    
    result = await db.execute(query)
    rows = result.fetchall()
    
    return [
        {
            "industry": row[0],
            "revenue": float(row[1] or 0),
            "profit": float(row[2] or 0),
            "orders": int(row[3] or 0),
            "margin": float(row[4] or 0)
        }
        for row in rows
    ]


@router.get("/analytics/products")
async def get_demo_products(db: AsyncSession = Depends(get_db)):
    """Get top products."""
    
    query = text("""
        SELECT 
            product_name,
            product_category,
            SUM(total_sales) as revenue,
            SUM(profit) as profit,
            SUM(quantity) as units_sold
        FROM public.demo_sales_data
        WHERE order_status = 'Completed'
        GROUP BY product_name, product_category
        ORDER BY revenue DESC
        LIMIT 10
    """)
    
    result = await db.execute(query)
    rows = result.fetchall()
    
    return [
        {
            "name": row[0],
            "category": row[1],
            "revenue": float(row[2] or 0),
            "profit": float(row[3] or 0),
            "units_sold": int(row[4] or 0)
        }
        for row in rows
    ]


@router.get("/analytics/year-comparison")
async def get_demo_year_comparison(db: AsyncSession = Depends(get_db)):
    """Compare 2025 vs 2026."""
    
    query = text("""
        SELECT 
            EXTRACT(YEAR FROM date) as year,
            SUM(total_sales) as revenue,
            SUM(profit) as profit,
            COUNT(DISTINCT order_id) as orders,
            ROUND(AVG(profit_margin), 2) as avg_margin
        FROM public.demo_sales_data
        WHERE order_status = 'Completed'
        GROUP BY EXTRACT(YEAR FROM date)
        ORDER BY year
    """)
    
    result = await db.execute(query)
    rows = result.fetchall()
    
    return [
        {
            "year": int(row[0]),
            "revenue": float(row[1] or 0),
            "profit": float(row[2] or 0),
            "orders": int(row[3] or 0),
            "margin": float(row[4] or 0)
        }
        for row in rows
    ]


@router.get("/datasets/demo")
async def get_demo_dataset_info():
    """Get demo dataset information."""
    
    return {
        "id": "demo-dataset-sales-2025-2026",
        "name": "Sales Data 2025-2026 (Demo)",
        "description": "Enterprise sales dataset with 100,000 transactions across 2 years",
        "row_count": 100000,
        "column_count": 26,
        "status": "ready",
        "file_type": "csv",
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2026-12-31T23:59:59Z",
        "is_demo": True,
        "readonly": True,
        "date_range": {
            "start": "2025-01-01",
            "end": "2026-12-31"
        },
        "columns": [
            "date", "order_id", "company_name", "industry", "region", "city",
            "product_name", "product_category", "quantity", "unit_price",
            "total_sales", "cost", "profit", "profit_margin", "customer_satisfaction"
        ]
    }


@router.post("/ai/query")
async def demo_ai_query(
    query: Dict[str, Any],
    db: AsyncSession = Depends(get_db)
):
    """Execute AI query against demo data."""
    
    user_question = query.get("question", "").lower()
    
    # Simple keyword-based query routing
    if "total revenue" in user_question or "revenue in 2025" in user_question:
        sql = text("""
            SELECT 
                EXTRACT(YEAR FROM date) as year,
                SUM(total_sales) as total_revenue
            FROM public.demo_sales_data
            WHERE order_status = 'Completed'
            AND EXTRACT(YEAR FROM date) = 2025
            GROUP BY EXTRACT(YEAR FROM date)
        """)
        result = await db.execute(sql)
        row = result.fetchone()
        
        return {
            "answer": f"The total revenue in 2025 was ${row[1]:,.2f}" if row else "No data found",
            "sql": str(sql),
            "data": [{"year": int(row[0]), "revenue": float(row[1])}] if row else []
        }
    
    elif "highest sales" in user_question or "top product" in user_question:
        sql = text("""
            SELECT 
                product_name,
                SUM(total_sales) as revenue
            FROM public.demo_sales_data
            WHERE order_status = 'Completed'
            GROUP BY product_name
            ORDER BY revenue DESC
            LIMIT 1
        """)
        result = await db.execute(sql)
        row = result.fetchone()
        
        return {
            "answer": f"The product with highest sales is {row[0]} with revenue of ${row[1]:,.2f}" if row else "No data found",
            "sql": str(sql),
            "data": [{"product": row[0], "revenue": float(row[1])}] if row else []
        }
    
    elif "quarterly" in user_question or "quarter" in user_question:
        sql = text("""
            SELECT 
                TO_CHAR(date, 'YYYY-Q') as quarter,
                SUM(total_sales) as revenue
            FROM public.demo_sales_data
            WHERE order_status = 'Completed'
            GROUP BY TO_CHAR(date, 'YYYY-Q')
            ORDER BY quarter
        """)
        result = await db.execute(sql)
        rows = result.fetchall()
        
        return {
            "answer": f"Found {len(rows)} quarters of data",
            "sql": str(sql),
            "data": [{"quarter": r[0], "revenue": float(r[1])} for r in rows]
        }
    
    else:
        return {
            "answer": "I can help you analyze sales data. Try asking about total revenue, top products, or quarterly performance.",
            "sql": None,
            "data": []
        }
