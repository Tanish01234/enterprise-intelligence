"""Dataset processing service with intelligent validation and transformation."""

import pandas as pd
import chardet
import csv
import io
import hashlib
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
import duckdb

from app.core.config import settings

logger = logging.getLogger(__name__)


class DatasetProcessor:
    """Intelligent dataset processor with validation and transformation."""
    
    def __init__(self):
        self.supported_formats = ['.csv', '.xlsx', '.xls', '.json', '.parquet']
    
    async def detect_encoding(self, file_content: bytes) -> str:
        """Detect file encoding using chardet."""
        try:
            result = chardet.detect(file_content[:10000])  # Check first 10KB
            encoding = result['encoding']
            confidence = result['confidence']
            
            logger.info(f"Detected encoding: {encoding} (confidence: {confidence})")
            
            # Fallback to utf-8 if confidence is low
            if confidence < 0.7:
                logger.warning("Low confidence, using UTF-8 as fallback")
                return 'utf-8'
            
            return encoding or 'utf-8'
            
        except Exception as e:
            logger.error(f"Encoding detection failed: {e}")
            return 'utf-8'
    
    async def detect_delimiter(self, file_content: str, sample_size: int = 1000) -> str:
        """Detect CSV delimiter."""
        try:
            sample = '\n'.join(file_content.split('\n')[:sample_size])
            sniffer = csv.Sniffer()
            delimiter = sniffer.sniff(sample).delimiter
            logger.info(f"Detected delimiter: {repr(delimiter)}")
            return delimiter
        except Exception as e:
            logger.error(f"Delimiter detection failed: {e}, using comma")
            return ','
    
    async def process_csv(
        self,
        file_content: bytes,
        filename: str
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Process CSV file with intelligent detection."""
        
        # Detect encoding
        encoding = await self.detect_encoding(file_content)
        
        # Decode content
        content_str = file_content.decode(encoding)
        
        # Detect delimiter
        delimiter = await self.detect_delimiter(content_str)
        
        # Read CSV
        df = pd.read_csv(
            io.StringIO(content_str),
            delimiter=delimiter,
            encoding=encoding,
            low_memory=False
        )
        
        # Generate metadata
        metadata = {
            'encoding': encoding,
            'delimiter': delimiter,
            'row_count': len(df),
            'column_count': len(df.columns),
            'columns': list(df.columns),
            'dtypes': {col: str(dtype) for col, dtype in df.dtypes.items()},
            'memory_usage': df.memory_usage(deep=True).sum(),
            'has_nulls': df.isnull().any().to_dict(),
            'null_counts': df.isnull().sum().to_dict(),
        }
        
        return df, metadata
    
    async def process_excel(
        self,
        file_content: bytes,
        filename: str
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Process Excel file."""
        
        df = pd.read_excel(io.BytesIO(file_content), engine='openpyxl')
        
        metadata = {
            'row_count': len(df),
            'column_count': len(df.columns),
            'columns': list(df.columns),
            'dtypes': {col: str(dtype) for col, dtype in df.dtypes.items()},
            'has_nulls': df.isnull().any().to_dict(),
            'null_counts': df.isnull().sum().to_dict(),
        }
        
        return df, metadata
    
    async def process_json(
        self,
        file_content: bytes,
        filename: str
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Process JSON file."""
        
        content_str = file_content.decode('utf-8')
        df = pd.read_json(io.StringIO(content_str))
        
        metadata = {
            'row_count': len(df),
            'column_count': len(df.columns),
            'columns': list(df.columns),
            'dtypes': {col: str(dtype) for col, dtype in df.dtypes.items()},
        }
        
        return df, metadata
    
    async def detect_schema(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Detect and analyze schema."""
        
        schema = {}
        
        for col in df.columns:
            col_data = df[col]
            
            # Infer data type
            inferred_type = self._infer_column_type(col_data)
            
            # Calculate statistics
            stats = self._calculate_statistics(col_data, inferred_type)
            
            schema[col] = {
                'name': col,
                'type': inferred_type,
                'nullable': col_data.isnull().any(),
                'null_count': int(col_data.isnull().sum()),
                'unique_count': int(col_data.nunique()),
                'stats': stats
            }
        
        return schema
    
    def _infer_column_type(self, series: pd.Series) -> str:
        """Infer column data type."""
        
        # Remove nulls for type inference
        non_null = series.dropna()
        
        if len(non_null) == 0:
            return 'unknown'
        
        # Check for numeric types
        if pd.api.types.is_numeric_dtype(series):
            if pd.api.types.is_integer_dtype(series):
                return 'integer'
            return 'float'
        
        # Check for datetime
        if pd.api.types.is_datetime64_any_dtype(series):
            return 'datetime'
        
        # Try to parse as datetime
        try:
            pd.to_datetime(non_null.head(100))
            return 'datetime'
        except:
            pass
        
        # Check for boolean
        unique_values = set(non_null.astype(str).str.lower().unique())
        if unique_values.issubset({'true', 'false', '1', '0', 'yes', 'no'}):
            return 'boolean'
        
        # Default to string
        return 'string'
    
    def _calculate_statistics(self, series: pd.Series, data_type: str) -> Dict[str, Any]:
        """Calculate column statistics."""
        
        stats = {}
        
        if data_type in ['integer', 'float']:
            stats.update({
                'min': float(series.min()) if not pd.isna(series.min()) else None,
                'max': float(series.max()) if not pd.isna(series.max()) else None,
                'mean': float(series.mean()) if not pd.isna(series.mean()) else None,
                'median': float(series.median()) if not pd.isna(series.median()) else None,
                'std': float(series.std()) if not pd.isna(series.std()) else None,
            })
        
        elif data_type == 'string':
            stats.update({
                'min_length': int(series.astype(str).str.len().min()),
                'max_length': int(series.astype(str).str.len().max()),
                'avg_length': float(series.astype(str).str.len().mean()),
            })
        
        elif data_type == 'datetime':
            try:
                dates = pd.to_datetime(series)
                stats.update({
                    'min_date': dates.min().isoformat() if not pd.isna(dates.min()) else None,
                    'max_date': dates.max().isoformat() if not pd.isna(dates.max()) else None,
                })
            except:
                pass
        
        return stats
    
    async def detect_duplicates(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Detect duplicate rows."""
        
        duplicate_count = df.duplicated().sum()
        duplicate_percentage = (duplicate_count / len(df)) * 100 if len(df) > 0 else 0
        
        return {
            'has_duplicates': duplicate_count > 0,
            'duplicate_count': int(duplicate_count),
            'duplicate_percentage': float(duplicate_percentage),
            'unique_rows': int(len(df) - duplicate_count)
        }
    
    async def validate_data(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Validate data quality."""
        
        validation_results = {
            'is_valid': True,
            'issues': [],
            'warnings': []
        }
        
        # Check for empty dataframe
        if len(df) == 0:
            validation_results['is_valid'] = False
            validation_results['issues'].append('Dataset is empty')
            return validation_results
        
        # Check for columns with all nulls
        all_null_cols = [col for col in df.columns if df[col].isnull().all()]
        if all_null_cols:
            validation_results['warnings'].append(f'Columns with all nulls: {all_null_cols}')
        
        # Check for high null percentage
        for col in df.columns:
            null_pct = (df[col].isnull().sum() / len(df)) * 100
            if null_pct > 50:
                validation_results['warnings'].append(
                    f'Column "{col}" has {null_pct:.1f}% null values'
                )
        
        # Check for duplicate column names
        if len(df.columns) != len(set(df.columns)):
            validation_results['is_valid'] = False
            validation_results['issues'].append('Duplicate column names detected')
        
        return validation_results
    
    async def transform_data(
        self,
        df: pd.DataFrame,
        transformations: Optional[List[Dict[str, Any]]] = None
    ) -> pd.DataFrame:
        """Apply data transformations."""
        
        if not transformations:
            return df
        
        df_transformed = df.copy()
        
        for transform in transformations:
            operation = transform.get('operation')
            column = transform.get('column')
            
            if operation == 'cast':
                target_type = transform.get('target_type')
                df_transformed[column] = self._cast_column(df_transformed[column], target_type)
            
            elif operation == 'rename':
                new_name = transform.get('new_name')
                df_transformed.rename(columns={column: new_name}, inplace=True)
            
            elif operation == 'drop':
                df_transformed.drop(columns=[column], inplace=True)
            
            elif operation == 'fill_null':
                fill_value = transform.get('fill_value')
                df_transformed[column].fillna(fill_value, inplace=True)
            
            elif operation == 'trim':
                if df_transformed[column].dtype == 'object':
                    df_transformed[column] = df_transformed[column].str.strip()
            
            elif operation == 'lowercase':
                if df_transformed[column].dtype == 'object':
                    df_transformed[column] = df_transformed[column].str.lower()
            
            elif operation == 'uppercase':
                if df_transformed[column].dtype == 'object':
                    df_transformed[column] = df_transformed[column].str.upper()
        
        return df_transformed
    
    def _cast_column(self, series: pd.Series, target_type: str) -> pd.Series:
        """Cast column to target type."""
        
        try:
            if target_type == 'integer':
                return pd.to_numeric(series, errors='coerce').astype('Int64')
            elif target_type == 'float':
                return pd.to_numeric(series, errors='coerce')
            elif target_type == 'string':
                return series.astype(str)
            elif target_type == 'datetime':
                return pd.to_datetime(series, errors='coerce')
            elif target_type == 'boolean':
                return series.map({'true': True, 'false': False, '1': True, '0': False, 'yes': True, 'no': False})
            else:
                return series
        except Exception as e:
            logger.error(f"Cast failed: {e}")
            return series
    
    async def load_to_duckdb(
        self,
        df: pd.DataFrame,
        table_name: str,
        duckdb_path: str
    ) -> bool:
        """Load dataframe into DuckDB."""
        
        try:
            conn = duckdb.connect(duckdb_path)
            
            # Create table from dataframe
            conn.register('temp_df', df)
            conn.execute(f"CREATE OR REPLACE TABLE {table_name} AS SELECT * FROM temp_df")
            
            # Verify load
            count = conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
            logger.info(f"Loaded {count} rows into DuckDB table {table_name}")
            
            conn.close()
            return True
            
        except Exception as e:
            logger.error(f"Failed to load to DuckDB: {e}")
            return False
    
    async def generate_file_hash(self, file_content: bytes) -> str:
        """Generate SHA-256 hash of file content."""
        return hashlib.sha256(file_content).hexdigest()
    
    async def process_dataset(
        self,
        file_content: bytes,
        filename: str,
        file_extension: str
    ) -> Dict[str, Any]:
        """Complete dataset processing pipeline."""
        
        try:
            # Process file based on type
            if file_extension == '.csv':
                df, metadata = await self.process_csv(file_content, filename)
            elif file_extension in ['.xlsx', '.xls']:
                df, metadata = await self.process_excel(file_content, filename)
            elif file_extension == '.json':
                df, metadata = await self.process_json(file_content, filename)
            else:
                raise ValueError(f"Unsupported file type: {file_extension}")
            
            # Detect schema
            schema = await self.detect_schema(df)
            
            # Detect duplicates
            duplicates = await self.detect_duplicates(df)
            
            # Validate data
            validation = await self.validate_data(df)
            
            # Generate file hash
            file_hash = await self.generate_file_hash(file_content)
            
            return {
                'success': True,
                'dataframe': df,
                'metadata': metadata,
                'schema': schema,
                'duplicates': duplicates,
                'validation': validation,
                'file_hash': file_hash
            }
            
        except Exception as e:
            logger.error(f"Dataset processing failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }


# Global processor instance
dataset_processor = DatasetProcessor()
