from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db, get_duckdb
from app.models.dataset import Dataset, DatasetStatus
from app.models.analytics import Query as QueryModel
from app.models.user import User
from app.services.query_engine import QueryEngine
from app.services.supabase_auth import verify_supabase_token

router = APIRouter()
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current authenticated user using Supabase token."""
    token = credentials.credentials
    payload = await verify_supabase_token(token)
    user_id = payload.get("sub")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return user


class SQLQueryRequest(BaseModel):
    sql: str
    dataset_id: str


class NaturalLanguageQueryRequest(BaseModel):
    question: str
    dataset_id: str


class AggregationRequest(BaseModel):
    dataset_id: str
    aggregations: List[Dict[str, Any]]
    group_by: Optional[List[str]] = None
    filters: Optional[List[Dict[str, Any]]] = None


class KPIRequest(BaseModel):
    dataset_id: str
    kpis: List[Dict[str, Any]]


class TimeSeriesRequest(BaseModel):
    dataset_id: str
    date_column: str
    value_column: str
    aggregation: str = "sum"
    interval: str = "day"


@router.post("/query/sql")
async def execute_sql_query(
    request: SQLQueryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    duckdb_conn = Depends(get_duckdb)
):
    """Execute SQL query."""
    
    # Get dataset
    result = await db.execute(
        select(Dataset).where(
            Dataset.id == request.dataset_id,
            Dataset.created_by == current_user.id
        )
    )
    dataset = result.scalar_one_or_none()
    
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
    
    if dataset.status != DatasetStatus.READY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dataset is not ready. Status: {dataset.status}"
        )
    
    # Execute query
    query_engine = QueryEngine(duckdb_conn)
    exec_result = await query_engine.execute_sql(request.sql)
    
    # Log query
    query_log = QueryModel(
        organization_id=dataset.organization_id,
        user_id=current_user.id,
        dataset_id=dataset.id,
        query_text=request.sql,
        query_type='sql',
        execution_time_ms=exec_result.get('execution_time_ms'),
        row_count=exec_result.get('row_count'),
        status='success' if exec_result['success'] else 'failed',
        error_message=exec_result.get('error'),
        results=exec_result.get('data') if exec_result['success'] else None
    )
    db.add(query_log)
    await db.commit()
    
    return exec_result


@router.post("/query/natural-language")
async def execute_natural_language_query(
    request: NaturalLanguageQueryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    duckdb_conn = Depends(get_duckdb)
):
    """Execute natural language query with AI."""
    
    # Get dataset
    result = await db.execute(
        select(Dataset).where(
            Dataset.id == request.dataset_id,
            Dataset.created_by == current_user.id
        )
    )
    dataset = result.scalar_one_or_none()
    
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
    
    if dataset.status != DatasetStatus.READY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dataset is not ready. Status: {dataset.status}"
        )
    
    # Execute NL query
    query_engine = QueryEngine(duckdb_conn)
    exec_result = await query_engine.execute_natural_language_query(
        question=request.question,
        table_name=dataset.duckdb_table_name,
        schema_info=dataset.schema,
        dataset_context=dataset.description
    )
    
    # Log query
    query_log = QueryModel(
        organization_id=dataset.organization_id,
        user_id=current_user.id,
        dataset_id=dataset.id,
        query_text=request.question,
        query_type='natural_language',
        execution_time_ms=exec_result.get('execution_time_ms'),
        row_count=exec_result.get('row_count'),
        status='success' if exec_result['success'] else 'failed',
        error_message=exec_result.get('error'),
        results=exec_result.get('data') if exec_result['success'] else None
    )
    db.add(query_log)
    await db.commit()
    
    return exec_result


@router.post("/aggregate")
async def execute_aggregation(
    request: AggregationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    duckdb_conn = Depends(get_duckdb)
):
    """Execute aggregation query."""
    
    # Get dataset
    result = await db.execute(
        select(Dataset).where(
            Dataset.id == request.dataset_id,
            Dataset.created_by == current_user.id
        )
    )
    dataset = result.scalar_one_or_none()
    
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
    
    if dataset.status != DatasetStatus.READY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dataset is not ready. Status: {dataset.status}"
        )
    
    # Execute aggregation
    query_engine = QueryEngine(duckdb_conn)
    result = await query_engine.aggregate_data(
        table_name=dataset.duckdb_table_name,
        aggregations=request.aggregations,
        group_by=request.group_by,
        filters=request.filters
    )
    
    return result


@router.post("/kpis")
async def calculate_kpis(
    request: KPIRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    duckdb_conn = Depends(get_duckdb)
):
    """Calculate KPIs."""
    
    # Get dataset
    result = await db.execute(
        select(Dataset).where(
            Dataset.id == request.dataset_id,
            Dataset.created_by == current_user.id
        )
    )
    dataset = result.scalar_one_or_none()
    
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
    
    if dataset.status != DatasetStatus.READY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dataset is not ready. Status: {dataset.status}"
        )
    
    # Calculate KPIs
    query_engine = QueryEngine(duckdb_conn)
    result = await query_engine.calculate_kpis(
        table_name=dataset.duckdb_table_name,
        kpi_definitions=request.kpis
    )
    
    return result


@router.post("/time-series")
async def generate_time_series(
    request: TimeSeriesRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    duckdb_conn = Depends(get_duckdb)
):
    """Generate time series data."""
    
    # Get dataset
    result = await db.execute(
        select(Dataset).where(
            Dataset.id == request.dataset_id,
            Dataset.created_by == current_user.id
        )
    )
    dataset = result.scalar_one_or_none()
    
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
    
    if dataset.status != DatasetStatus.READY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dataset is not ready. Status: {dataset.status}"
        )
    
    # Generate time series
    query_engine = QueryEngine(duckdb_conn)
    result = await query_engine.generate_time_series(
        table_name=dataset.duckdb_table_name,
        date_column=request.date_column,
        value_column=request.value_column,
        aggregation=request.aggregation,
        interval=request.interval
    )
    
    return result


@router.get("/queries")
async def list_queries(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List query history."""
    
    result = await db.execute(
        select(QueryModel)
        .where(QueryModel.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .order_by(QueryModel.created_at.desc())
    )
    queries = result.scalars().all()
    
    return {"queries": queries}


@router.get("/dashboards")
async def list_dashboards():
    """List dashboards (placeholder)."""
    return {"dashboards": []}
