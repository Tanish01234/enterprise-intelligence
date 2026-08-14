"""Auto-dashboard generator with AI analysis."""

import logging
from typing import Dict, Any, List, Optional
import pandas as pd
from datetime import datetime

from app.services.ai_service import (
    generate_data_insights,
    generate_chart_recommendations,
    ai_orchestrator
)

logger = logging.getLogger(__name__)


class DashboardGenerator:
    """Automatically generate dashboards from datasets."""
    
    async def analyze_dataset_for_dashboard(
        self,
        df: pd.DataFrame,
        schema: Dict[str, Any],
        dataset_name: str
    ) -> Dict[str, Any]:
        """Analyze dataset and generate dashboard configuration."""
        
        # Detect data category
        data_category = await self._detect_data_category(df, schema, dataset_name)
        
        # Generate KPIs
        kpis = await self._generate_kpis(df, schema, data_category)
        
        # Generate charts
        charts = await self._generate_charts(df, schema, data_category)
        
        # Generate insights
        insights = await self._generate_insights(df, schema)
        
        # Create dashboard layout
        layout = self._create_dashboard_layout(kpis, charts)
        
        return {
            'success': True,
            'data_category': data_category,
            'kpis': kpis,
            'charts': charts,
            'insights': insights,
            'layout': layout,
            'dashboard_config': {
                'title': f"{dataset_name} Dashboard",
                'description': f"Auto-generated dashboard for {data_category} data",
                'widgets': len(kpis) + len(charts)
            }
        }
    
    async def _detect_data_category(
        self,
        df: pd.DataFrame,
        schema: Dict[str, Any],
        dataset_name: str
    ) -> str:
        """Detect the category of data."""
        
        column_names = [col.lower() for col in df.columns]
        
        # Sales data detection
        sales_keywords = ['revenue', 'sales', 'price', 'amount', 'total', 'quantity', 'product']
        if any(keyword in ' '.join(column_names) for keyword in sales_keywords):
            return 'sales'
        
        # Financial data detection
        finance_keywords = ['profit', 'expense', 'cost', 'budget', 'income', 'balance']
        if any(keyword in ' '.join(column_names) for keyword in finance_keywords):
            return 'financial'
        
        # Inventory data detection
        inventory_keywords = ['stock', 'inventory', 'warehouse', 'sku', 'unit']
        if any(keyword in ' '.join(column_names) for keyword in inventory_keywords):
            return 'inventory'
        
        # Healthcare data detection
        healthcare_keywords = ['patient', 'diagnosis', 'treatment', 'medical', 'hospital']
        if any(keyword in ' '.join(column_names) for keyword in healthcare_keywords):
            return 'healthcare'
        
        # Retail data detection
        retail_keywords = ['customer', 'order', 'transaction', 'purchase', 'cart']
        if any(keyword in ' '.join(column_names) for keyword in retail_keywords):
            return 'retail'
        
        # HR data detection
        hr_keywords = ['employee', 'salary', 'department', 'hire', 'performance']
        if any(keyword in ' '.join(column_names) for keyword in hr_keywords):
            return 'human_resources'
        
        # Marketing data detection
        marketing_keywords = ['campaign', 'lead', 'conversion', 'click', 'impression']
        if any(keyword in ' '.join(column_names) for keyword in marketing_keywords):
            return 'marketing'
        
        return 'general'
    
    async def _generate_kpis(
        self,
        df: pd.DataFrame,
        schema: Dict[str, Any],
        category: str
    ) -> List[Dict[str, Any]]:
        """Generate KPI definitions based on data category."""
        
        kpis = []
        
        # Find numeric columns for aggregation
        numeric_cols = [col for col, info in schema.items() 
                       if info['type'] in ['integer', 'float']]
        
        if category == 'sales':
            # Revenue KPI
            revenue_col = self._find_column(df.columns, ['revenue', 'sales', 'amount', 'total'])
            if revenue_col:
                kpis.append({
                    'id': 'total_revenue',
                    'title': 'Total Revenue',
                    'type': 'sum',
                    'column': revenue_col,
                    'format': 'currency',
                    'icon': 'dollar-sign'
                })
            
            # Transaction count
            kpis.append({
                'id': 'total_transactions',
                'title': 'Total Transactions',
                'type': 'count',
                'format': 'number',
                'icon': 'shopping-cart'
            })
            
            # Average order value
            if revenue_col:
                kpis.append({
                    'id': 'avg_order_value',
                    'title': 'Avg Order Value',
                    'type': 'avg',
                    'column': revenue_col,
                    'format': 'currency',
                    'icon': 'trending-up'
                })
        
        elif category == 'financial':
            # Profit KPI
            profit_col = self._find_column(df.columns, ['profit', 'net_income', 'earnings'])
            if profit_col:
                kpis.append({
                    'id': 'total_profit',
                    'title': 'Total Profit',
                    'type': 'sum',
                    'column': profit_col,
                    'format': 'currency',
                    'icon': 'dollar-sign'
                })
            
            # Expense KPI
            expense_col = self._find_column(df.columns, ['expense', 'cost', 'spending'])
            if expense_col:
                kpis.append({
                    'id': 'total_expenses',
                    'title': 'Total Expenses',
                    'type': 'sum',
                    'column': expense_col,
                    'format': 'currency',
                    'icon': 'credit-card'
                })
        
        elif category == 'inventory':
            # Stock level
            stock_col = self._find_column(df.columns, ['stock', 'quantity', 'units'])
            if stock_col:
                kpis.append({
                    'id': 'total_stock',
                    'title': 'Total Stock',
                    'type': 'sum',
                    'column': stock_col,
                    'format': 'number',
                    'icon': 'package'
                })
            
            # Product count
            kpis.append({
                'id': 'product_count',
                'title': 'Product Count',
                'type': 'count',
                'format': 'number',
                'icon': 'box'
            })
        
        else:
            # Generic KPIs
            kpis.append({
                'id': 'total_records',
                'title': 'Total Records',
                'type': 'count',
                'format': 'number',
                'icon': 'database'
            })
            
            # Add KPI for first numeric column
            if numeric_cols:
                col = numeric_cols[0]
                kpis.append({
                    'id': f'sum_{col}',
                    'title': f'Total {col.replace("_", " ").title()}',
                    'type': 'sum',
                    'column': col,
                    'format': 'number',
                    'icon': 'trending-up'
                })
        
        return kpis
    
    async def _generate_charts(
        self,
        df: pd.DataFrame,
        schema: Dict[str, Any],
        category: str
    ) -> List[Dict[str, Any]]:
        """Generate chart definitions."""
        
        charts = []
        
        # Find date column for time series
        date_col = self._find_date_column(schema)
        
        # Find numeric columns
        numeric_cols = [col for col, info in schema.items() 
                       if info['type'] in ['integer', 'float']]
        
        # Find categorical columns
        categorical_cols = [col for col, info in schema.items() 
                          if info['type'] == 'string' and info.get('unique_count', 0) < 50]
        
        # Time series chart
        if date_col and numeric_cols:
            charts.append({
                'id': 'time_series_chart',
                'title': f'{numeric_cols[0].replace("_", " ").title()} Over Time',
                'type': 'line',
                'config': {
                    'x_column': date_col,
                    'y_column': numeric_cols[0],
                    'aggregation': 'sum'
                }
            })
        
        # Category breakdown chart
        if categorical_cols and numeric_cols:
            cat_col = categorical_cols[0]
            num_col = numeric_cols[0]
            
            # Use bar chart if few categories, pie chart if very few
            unique_count = schema[cat_col].get('unique_count', 0)
            chart_type = 'pie' if unique_count <= 5 else 'bar'
            
            charts.append({
                'id': 'category_breakdown',
                'title': f'{num_col.replace("_", " ").title()} by {cat_col.replace("_", " ").title()}',
                'type': chart_type,
                'config': {
                    'category_column': cat_col,
                    'value_column': num_col,
                    'aggregation': 'sum',
                    'limit': 10
                }
            })
        
        # Top N chart
        if numeric_cols and len(df) > 10:
            charts.append({
                'id': 'top_values',
                'title': f'Top 10 by {numeric_cols[0].replace("_", " ").title()}',
                'type': 'bar',
                'config': {
                    'value_column': numeric_cols[0],
                    'sort': 'desc',
                    'limit': 10
                }
            })
        
        # Distribution chart
        if numeric_cols:
            charts.append({
                'id': 'distribution',
                'title': f'{numeric_cols[0].replace("_", " ").title()} Distribution',
                'type': 'histogram',
                'config': {
                    'column': numeric_cols[0],
                    'bins': 20
                }
            })
        
        return charts
    
    async def _generate_insights(
        self,
        df: pd.DataFrame,
        schema: Dict[str, Any]
    ) -> List[str]:
        """Generate AI insights."""
        
        # Prepare summary
        summary = {
            'row_count': len(df),
            'column_count': len(df.columns),
            'columns': list(df.columns),
            'data_types': {col: info['type'] for col, info in schema.items()}
        }
        
        # Get sample data
        sample_data = df.head(5).to_dict(orient='records')
        
        # Generate insights using AI
        try:
            result = await generate_data_insights(summary, sample_data)
            
            if result['success']:
                # Parse insights (assuming they're in bullet points)
                insights_text = result['insights']
                insights = [line.strip('- •').strip() 
                          for line in insights_text.split('\n') 
                          if line.strip().startswith(('-', '•', '*'))]
                return insights[:5]  # Return top 5 insights
            
        except Exception as e:
            logger.error(f"Failed to generate AI insights: {e}")
        
        # Fallback insights
        return [
            f"Dataset contains {len(df):,} rows and {len(df.columns)} columns",
            f"Data types: {len([c for c in schema.values() if c['type'] in ['integer', 'float']])} numeric, "
            f"{len([c for c in schema.values() if c['type'] == 'string'])} text columns"
        ]
    
    def _create_dashboard_layout(
        self,
        kpis: List[Dict[str, Any]],
        charts: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Create dashboard grid layout."""
        
        layout = {
            'grid_columns': 12,
            'widgets': []
        }
        
        # KPIs in top row (each taking 3 columns)
        row = 0
        col = 0
        for i, kpi in enumerate(kpis):
            layout['widgets'].append({
                'id': kpi['id'],
                'type': 'kpi',
                'x': col,
                'y': row,
                'w': 3,
                'h': 2,
                'config': kpi
            })
            col += 3
            if col >= 12:
                col = 0
                row += 2
        
        # Charts below KPIs
        if col > 0:
            row += 2
            col = 0
        
        for i, chart in enumerate(charts):
            # Alternate between full width and half width
            if i % 2 == 0:
                w = 12 if len(charts) - i == 1 else 6
            else:
                w = 6
            
            layout['widgets'].append({
                'id': chart['id'],
                'type': 'chart',
                'x': col,
                'y': row,
                'w': w,
                'h': 4,
                'config': chart
            })
            
            col += w
            if col >= 12:
                col = 0
                row += 4
        
        return layout
    
    def _find_column(self, columns: List[str], keywords: List[str]) -> Optional[str]:
        """Find column matching keywords."""
        columns_lower = [col.lower() for col in columns]
        
        for keyword in keywords:
            for i, col_lower in enumerate(columns_lower):
                if keyword in col_lower:
                    return columns[i]
        
        return None
    
    def _find_date_column(self, schema: Dict[str, Any]) -> Optional[str]:
        """Find date/datetime column."""
        date_keywords = ['date', 'time', 'day', 'month', 'year', 'created', 'updated']
        
        for col, info in schema.items():
            if info['type'] == 'datetime':
                return col
            
            col_lower = col.lower()
            if any(keyword in col_lower for keyword in date_keywords):
                return col
        
        return None


# Global instance
dashboard_generator = DashboardGenerator()
