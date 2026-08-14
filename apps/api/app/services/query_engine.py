"""Query execution engine for DuckDB with NL-to-SQL support."""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import pandas as pd

from app.core.config import settings
from app.services.ai_service import generate_sql_from_natural_language

logger = logging.getLogger(__name__)


class QueryEngine:
    """DuckDB query execution engine."""
    
    def __init__(self, duckdb_conn):
        self.conn = duckdb_conn
    
    async def execute_sql(
        self,
        sql: str,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Execute SQL query and return results."""
        
        start_time = datetime.now()
        
        try:
            # Execute query
            if params:
                result = self.conn.execute(sql, params)
            else:
                result = self.conn.execute(sql)
            
            # Fetch results as DataFrame
            df = result.df()
            
            # Calculate execution time
            execution_time = (datetime.now() - start_time).total_seconds() * 1000
            
            # Convert to dict
            data = df.to_dict(orient='records')
            columns = list(df.columns)
            
            return {
                'success': True,
                'data': data,
                'columns': columns,
                'row_count': len(df),
                'execution_time_ms': execution_time
            }
            
        except Exception as e:
            logger.error(f"Query execution failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'execution_time_ms': (datetime.now() - start_time).total_seconds() * 1000
            }
    
    async def execute_natural_language_query(
        self,
        question: str,
        table_name: str,
        schema_info: Dict[str, Any],
        dataset_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """Execute natural language query."""
        
        # Generate SQL from natural language
        sql_result = await generate_sql_from_natural_language(
            question=question,
            schema_info=schema_info,
            dataset_context=dataset_context
        )
        
        if not sql_result['success']:
            return {
                'success': False,
                'error': 'Failed to generate SQL',
                'details': sql_result
            }
        
        sql = sql_result['sql']
        
        # Execute SQL
        exec_result = await self.execute_sql(sql)
        
        # Add generated SQL to response
        exec_result['generated_sql'] = sql
        exec_result['ai_provider'] = sql_result['provider']
        
        # Generate chart recommendations
        if exec_result['success'] and exec_result['data']:
            from app.services.ai_service import generate_chart_recommendations
            
            # Get column types
            column_types = {col: str(schema_info.get(col, {}).get('type', 'unknown')) 
                          for col in exec_result['columns']}
            
            chart_rec = await generate_chart_recommendations(
                data_types=column_types,
                data_sample=exec_result['data'][:5]
            )
            
            if chart_rec['success']:
                exec_result['chart_recommendations'] = chart_rec['recommendations']
        
        return exec_result
    
    async def get_table_info(self, table_name: str) -> Dict[str, Any]:
        """Get table schema and statistics."""
        
        try:
            # Get column info
            columns_df = self.conn.execute(f"PRAGMA table_info('{table_name}')").df()
            
            # Get row count
            count = self.conn.execute(f"SELECT COUNT(*) as count FROM {table_name}").df()['count'][0]
            
            # Get column statistics
            stats_query = f"SELECT * FROM {table_name} LIMIT 1000"
            sample_df = self.conn.execute(stats_query).df()
            
            column_stats = {}
            for col in sample_df.columns:
                col_type = str(sample_df[col].dtype)
                
                stats = {
                    'type': col_type,
                    'null_count': int(sample_df[col].isnull().sum()),
                    'unique_count': int(sample_df[col].nunique())
                }
                
                if pd.api.types.is_numeric_dtype(sample_df[col]):
                    stats.update({
                        'min': float(sample_df[col].min()),
                        'max': float(sample_df[col].max()),
                        'mean': float(sample_df[col].mean()),
                        'median': float(sample_df[col].median())
                    })
                
                column_stats[col] = stats
            
            return {
                'success': True,
                'table_name': table_name,
                'row_count': int(count),
                'column_count': len(columns_df),
                'columns': columns_df.to_dict(orient='records'),
                'column_stats': column_stats
            }
            
        except Exception as e:
            logger.error(f"Failed to get table info: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def aggregate_data(
        self,
        table_name: str,
        aggregations: List[Dict[str, Any]],
        group_by: Optional[List[str]] = None,
        filters: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Execute aggregation query."""
        
        # Build SELECT clause
        select_parts = []
        if group_by:
            select_parts.extend(group_by)
        
        for agg in aggregations:
            func = agg['function']  # sum, avg, count, min, max
            column = agg['column']
            alias = agg.get('alias', f"{func}_{column}")
            select_parts.append(f"{func.upper()}({column}) as {alias}")
        
        select_clause = ", ".join(select_parts)
        
        # Build WHERE clause
        where_clause = ""
        if filters:
            conditions = []
            for f in filters:
                column = f['column']
                operator = f['operator']
                value = f['value']
                
                if isinstance(value, str):
                    value = f"'{value}'"
                
                conditions.append(f"{column} {operator} {value}")
            
            where_clause = "WHERE " + " AND ".join(conditions)
        
        # Build GROUP BY clause
        group_clause = ""
        if group_by:
            group_clause = "GROUP BY " + ", ".join(group_by)
        
        # Construct full query
        sql = f"SELECT {select_clause} FROM {table_name} {where_clause} {group_clause}"
        
        return await self.execute_sql(sql)
    
    async def calculate_kpis(
        self,
        table_name: str,
        kpi_definitions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Calculate KPIs."""
        
        kpis = {}
        
        for kpi_def in kpi_definitions:
            name = kpi_def['name']
            metric_type = kpi_def['type']  # count, sum, avg, percentage
            column = kpi_def.get('column')
            
            try:
                if metric_type == 'count':
                    sql = f"SELECT COUNT(*) as value FROM {table_name}"
                elif metric_type == 'sum':
                    sql = f"SELECT SUM({column}) as value FROM {table_name}"
                elif metric_type == 'avg':
                    sql = f"SELECT AVG({column}) as value FROM {table_name}"
                elif metric_type == 'min':
                    sql = f"SELECT MIN({column}) as value FROM {table_name}"
                elif metric_type == 'max':
                    sql = f"SELECT MAX({column}) as value FROM {table_name}"
                else:
                    continue
                
                result = await self.execute_sql(sql)
                
                if result['success'] and result['data']:
                    kpis[name] = {
                        'value': result['data'][0]['value'],
                        'type': metric_type
                    }
                    
            except Exception as e:
                logger.error(f"Failed to calculate KPI {name}: {e}")
                kpis[name] = {
                    'value': None,
                    'error': str(e)
                }
        
        return {
            'success': True,
            'kpis': kpis
        }
    
    async def generate_time_series(
        self,
        table_name: str,
        date_column: str,
        value_column: str,
        aggregation: str = 'sum',
        interval: str = 'day'
    ) -> Dict[str, Any]:
        """Generate time series data."""
        
        # Map interval to DuckDB date_trunc
        interval_map = {
            'hour': 'hour',
            'day': 'day',
            'week': 'week',
            'month': 'month',
            'quarter': 'quarter',
            'year': 'year'
        }
        
        interval_func = interval_map.get(interval, 'day')
        
        sql = f"""
        SELECT 
            date_trunc('{interval_func}', {date_column}) as period,
            {aggregation.upper()}({value_column}) as value
        FROM {table_name}
        GROUP BY period
        ORDER BY period
        """
        
        return await self.execute_sql(sql)
