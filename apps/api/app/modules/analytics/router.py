"""Analytics FastAPI Router

Endpoints for:
- Executive KPI Summary
- Time-series revenue trends
- Customer segment breakdown
- Category sales performance
- Analytics Metadata CRUD
"""

from typing import Optional
from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_session
from app.modules.auth.dependencies import get_current_organization
from app.modules.auth.schemas import OrganizationResponse
from app.modules.datamart.models import AnalyticsMetadata
from app.modules.analytics.schemas import (
    KPISummaryResponse,
    TimeSeriesTrendResponse,
    SegmentBreakdownResponse,
    CategoryPerformanceResponse,
    AnalyticsMetadataCreate,
    AnalyticsMetadataResponse,
)
from app.services.analytics_service import (
    calculate_kpi_summary,
    calculate_time_series_trend,
    calculate_segment_breakdown,
    calculate_category_performance,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/kpis", response_model=KPISummaryResponse)
async def get_kpi_summary(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_org: OrganizationResponse = Depends(get_current_organization),
    session: AsyncSession = Depends(get_session),
):
    """Retrieve top executive KPI metrics for the current organization."""
    return await calculate_kpi_summary(
        session=session,
        org_id=current_org.id,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/trends", response_model=TimeSeriesTrendResponse)
async def get_time_series_trend(
    granularity: str = Query("daily", regex="^(daily|weekly|monthly)$"),
    current_org: OrganizationResponse = Depends(get_current_organization),
    session: AsyncSession = Depends(get_session),
):
    """Retrieve time-series revenue and order volume trends."""
    return await calculate_time_series_trend(
        session=session,
        org_id=current_org.id,
        granularity=granularity,
    )


@router.get("/segments", response_model=SegmentBreakdownResponse)
async def get_segment_breakdown(
    current_org: OrganizationResponse = Depends(get_current_organization),
    session: AsyncSession = Depends(get_session),
):
    """Retrieve customer segment revenue breakdown."""
    return await calculate_segment_breakdown(
        session=session,
        org_id=current_org.id,
    )


@router.get("/categories", response_model=CategoryPerformanceResponse)
async def get_category_performance(
    current_org: OrganizationResponse = Depends(get_current_organization),
    session: AsyncSession = Depends(get_session),
):
    """Retrieve sales performance metrics grouped by product category."""
    return await calculate_category_performance(
        session=session,
        org_id=current_org.id,
    )


@router.get("/metadata", response_model=list[AnalyticsMetadataResponse])
async def list_analytics_metadata(
    current_org: OrganizationResponse = Depends(get_current_organization),
    session: AsyncSession = Depends(get_session),
):
    """List custom metric & KPI definitions for the organization."""
    stmt = (
        select(AnalyticsMetadata)
        .where(AnalyticsMetadata.organization_id == current_org.id)
        .order_by(AnalyticsMetadata.created_at.desc())
    )
    res = await session.execute(stmt)
    records = res.scalars().all()
    return [AnalyticsMetadataResponse.model_validate(r) for r in records]


@router.post("/metadata", response_model=AnalyticsMetadataResponse, status_code=status.HTTP_201_CREATED)
async def create_analytics_metadata(
    meta_data: AnalyticsMetadataCreate,
    current_org: OrganizationResponse = Depends(get_current_organization),
    session: AsyncSession = Depends(get_session),
):
    """Create a new custom analytics metric definition."""
    record = AnalyticsMetadata(
        organization_id=current_org.id,
        metric_key=meta_data.metric_key,
        name=meta_data.name,
        calculation_type=meta_data.calculation_type,
        definition=meta_data.definition,
    )
    session.add(record)
    await session.commit()
    await session.refresh(record)

    return AnalyticsMetadataResponse.model_validate(record)
