-- ============================================================================
-- SYNORA DEMO MODE - ANALYTICS QUERIES
-- ============================================================================
-- Pre-optimized queries for demo dashboard and analytics
-- ============================================================================

-- DASHBOARD KPIs
-- ============================================================================

-- Total Revenue
SELECT 
    SUM(total_sales) as total_revenue,
    COUNT(DISTINCT order_id) as total_orders,
    SUM(profit) as total_profit,
    ROUND(AVG(total_sales / quantity), 2) as avg_order_value,
    ROUND(AVG(profit_margin), 2) as avg_profit_margin,
    ROUND(AVG(customer_satisfaction), 2) as avg_customer_satisfaction,
    COUNT(DISTINCT company_name) as active_customers
FROM demo_sales_data
WHERE order_status = 'Completed';

-- Subscription Growth
SELECT 
    subscription_plan,
    COUNT(*) as subscribers,
    SUM(CASE WHEN renewal_status = 'Renewed' THEN 1 ELSE 0 END) as renewals,
    ROUND(SUM(CASE WHEN renewal_status = 'Renewed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as renewal_rate
FROM demo_sales_data
WHERE subscription_plan IS NOT NULL AND subscription_plan != 'None'
GROUP BY subscription_plan
ORDER BY subscribers DESC;

-- REVENUE TRENDS
-- ============================================================================

-- Monthly Revenue Trend
SELECT 
    TO_CHAR(date, 'YYYY-MM') as month,
    SUM(total_sales) as revenue,
    SUM(profit) as profit,
    COUNT(DISTINCT order_id) as orders,
    ROUND(AVG(profit_margin), 2) as avg_margin
FROM demo_sales_data
WHERE order_status = 'Completed'
GROUP BY TO_CHAR(date, 'YYYY-MM')
ORDER BY month;

-- Quarterly Revenue
SELECT 
    TO_CHAR(date, 'YYYY-Q') as quarter,
    SUM(total_sales) as revenue,
    SUM(profit) as profit,
    COUNT(DISTINCT order_id) as orders
FROM demo_sales_data
WHERE order_status = 'Completed'
GROUP BY TO_CHAR(date, 'YYYY-Q')
ORDER BY quarter;

-- Year-over-Year Comparison
SELECT 
    EXTRACT(YEAR FROM date) as year,
    SUM(total_sales) as total_revenue,
    SUM(profit) as total_profit,
    COUNT(DISTINCT order_id) as total_orders,
    ROUND(AVG(profit_margin), 2) as avg_margin
FROM demo_sales_data
WHERE order_status = 'Completed'
GROUP BY EXTRACT(YEAR FROM date)
ORDER BY year;

-- PRODUCT PERFORMANCE
-- ============================================================================

-- Top 10 Products by Revenue
SELECT 
    product_name,
    product_category,
    SUM(total_sales) as revenue,
    SUM(profit) as profit,
    SUM(quantity) as units_sold,
    ROUND(AVG(profit_margin), 2) as avg_margin
FROM demo_sales_data
WHERE order_status = 'Completed'
GROUP BY product_name, product_category
ORDER BY revenue DESC
LIMIT 10;

-- Product Category Performance
SELECT 
    product_category,
    SUM(total_sales) as revenue,
    SUM(profit) as profit,
    COUNT(DISTINCT order_id) as orders,
    SUM(quantity) as units_sold,
    ROUND(AVG(profit_margin), 2) as avg_margin
FROM demo_sales_data
WHERE order_status = 'Completed'
GROUP BY product_category
ORDER BY revenue DESC;

-- REGIONAL ANALYSIS
-- ============================================================================

-- Revenue by Region
SELECT 
    region,
    SUM(total_sales) as revenue,
    SUM(profit) as profit,
    COUNT(DISTINCT order_id) as orders,
    COUNT(DISTINCT company_name) as customers,
    ROUND(AVG(customer_satisfaction), 2) as avg_satisfaction
FROM demo_sales_data
WHERE order_status = 'Completed'
GROUP BY region
ORDER BY revenue DESC;

-- Top 10 Cities by Revenue
SELECT 
    city,
    region,
    SUM(total_sales) as revenue,
    SUM(profit) as profit,
    COUNT(DISTINCT order_id) as orders
FROM demo_sales_data
WHERE order_status = 'Completed'
GROUP BY city, region
ORDER BY revenue DESC
LIMIT 10;

-- INDUSTRY ANALYSIS
-- ============================================================================

-- Revenue by Industry
SELECT 
    industry,
    SUM(total_sales) as revenue,
    SUM(profit) as profit,
    COUNT(DISTINCT order_id) as orders,
    COUNT(DISTINCT company_name) as customers,
    ROUND(AVG(profit_margin), 2) as avg_margin
FROM demo_sales_data
WHERE order_status = 'Completed'
GROUP BY industry
ORDER BY revenue DESC;

-- Industry Growth Comparison (2025 vs 2026)
SELECT 
    industry,
    SUM(CASE WHEN EXTRACT(YEAR FROM date) = 2025 THEN total_sales ELSE 0 END) as revenue_2025,
    SUM(CASE WHEN EXTRACT(YEAR FROM date) = 2026 THEN total_sales ELSE 0 END) as revenue_2026,
    ROUND((SUM(CASE WHEN EXTRACT(YEAR FROM date) = 2026 THEN total_sales ELSE 0 END) - 
           SUM(CASE WHEN EXTRACT(YEAR FROM date) = 2025 THEN total_sales ELSE 0 END)) * 100.0 / 
           NULLIF(SUM(CASE WHEN EXTRACT(YEAR FROM date) = 2025 THEN total_sales ELSE 0 END), 0), 2) as growth_percentage
FROM demo_sales_data
WHERE order_status = 'Completed'
GROUP BY industry
ORDER BY growth_percentage DESC;

-- CUSTOMER SEGMENTATION
-- ============================================================================

-- Revenue by Customer Type
SELECT 
    customer_type,
    SUM(total_sales) as revenue,
    SUM(profit) as profit,
    COUNT(DISTINCT order_id) as orders,
    COUNT(DISTINCT company_name) as customers,
    ROUND(AVG(total_sales / quantity), 2) as avg_order_value
FROM demo_sales_data
WHERE order_status = 'Completed'
GROUP BY customer_type
ORDER BY revenue DESC;

-- Top 10 Customers by Revenue
SELECT 
    company_name,
    industry,
    customer_type,
    SUM(total_sales) as total_revenue,
    SUM(profit) as total_profit,
    COUNT(DISTINCT order_id) as total_orders,
    ROUND(AVG(customer_satisfaction), 2) as avg_satisfaction
FROM demo_sales_data
WHERE order_status = 'Completed'
GROUP BY company_name, industry, customer_type
ORDER BY total_revenue DESC
LIMIT 10;

-- SALES REPRESENTATIVE PERFORMANCE
-- ============================================================================

-- Top Sales Reps
SELECT 
    sales_rep,
    SUM(total_sales) as revenue,
    SUM(profit) as profit,
    COUNT(DISTINCT order_id) as orders,
    COUNT(DISTINCT company_name) as customers,
    ROUND(AVG(customer_satisfaction), 2) as avg_satisfaction
FROM demo_sales_data
WHERE order_status = 'Completed'
GROUP BY sales_rep
ORDER BY revenue DESC
LIMIT 10;

-- PAYMENT & DELIVERY INSIGHTS
-- ============================================================================

-- Payment Method Analysis
SELECT 
    payment_method,
    COUNT(*) as transactions,
    SUM(total_sales) as revenue,
    ROUND(AVG(total_sales), 2) as avg_transaction_value
FROM demo_sales_data
WHERE order_status = 'Completed'
GROUP BY payment_method
ORDER BY revenue DESC;

-- Order Status Distribution
SELECT 
    order_status,
    COUNT(*) as count,
    SUM(total_sales) as revenue,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM demo_sales_data
GROUP BY order_status
ORDER BY count DESC;

-- Delivery Status
SELECT 
    delivery_status,
    COUNT(*) as count,
    ROUND(AVG(customer_satisfaction), 2) as avg_satisfaction
FROM demo_sales_data
GROUP BY delivery_status
ORDER BY count DESC;

-- PROFITABILITY ANALYSIS
-- ============================================================================

-- Profit Margin Distribution
SELECT 
    CASE 
        WHEN profit_margin < 10 THEN '0-10%'
        WHEN profit_margin < 20 THEN '10-20%'
        WHEN profit_margin < 30 THEN '20-30%'
        WHEN profit_margin < 40 THEN '30-40%'
        WHEN profit_margin < 50 THEN '40-50%'
        ELSE '50%+'
    END as margin_range,
    COUNT(*) as orders,
    SUM(total_sales) as revenue,
    SUM(profit) as profit
FROM demo_sales_data
WHERE order_status = 'Completed'
GROUP BY margin_range
ORDER BY margin_range;

-- High Value vs Low Value Orders
SELECT 
    CASE 
        WHEN total_sales < 10000 THEN 'Low (<10K)'
        WHEN total_sales < 50000 THEN 'Medium (10K-50K)'
        WHEN total_sales < 100000 THEN 'High (50K-100K)'
        ELSE 'Premium (100K+)'
    END as order_value_segment,
    COUNT(*) as orders,
    SUM(total_sales) as revenue,
    SUM(profit) as profit,
    ROUND(AVG(profit_margin), 2) as avg_margin
FROM demo_sales_data
WHERE order_status = 'Completed'
GROUP BY order_value_segment
ORDER BY MIN(total_sales);

-- CUSTOMER SATISFACTION INSIGHTS
-- ============================================================================

-- Satisfaction by Product Category
SELECT 
    product_category,
    ROUND(AVG(customer_satisfaction), 2) as avg_satisfaction,
    COUNT(*) as orders,
    SUM(total_sales) as revenue
FROM demo_sales_data
WHERE customer_satisfaction IS NOT NULL
GROUP BY product_category
ORDER BY avg_satisfaction DESC;

-- Satisfaction Trend Over Time
SELECT 
    TO_CHAR(date, 'YYYY-MM') as month,
    ROUND(AVG(customer_satisfaction), 2) as avg_satisfaction,
    COUNT(*) as orders
FROM demo_sales_data
WHERE customer_satisfaction IS NOT NULL
GROUP BY TO_CHAR(date, 'YYYY-MM')
ORDER BY month;
