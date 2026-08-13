from datetime import date, datetime
from typing import Optional, Any
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class KPIQueryRequest(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    region_id: Optional[UUID] = None
    category_id: Optional[UUID] = None


class KPISummaryResponse(BaseModel):
    total_revenue: float
    total_orders: int
    average_order_value: float
    total_customers: int
    gross_margin_pct: float
    currency: str = "USD"


class TrendDataPoint(BaseModel):
    date: str
    revenue: float
    orders: int
    average_order_value: float


class TimeSeriesTrendResponse(BaseModel):
    granularity: str = "daily"  # daily, weekly, monthly
    points: list[TrendDataPoint]


class SegmentMetric(BaseModel):
    segment: str
    customer_count: int
    total_spent: float
    average_spent: float


class SegmentBreakdownResponse(BaseModel):
    segments: list[SegmentMetric]


class CategoryPerformanceMetric(BaseModel):
    category_id: Optional[UUID] = None
    category_name: str
    product_count: int
    total_sales: float
    units_sold: int


class CategoryPerformanceResponse(BaseModel):
    categories: list[CategoryPerformanceMetric]


class AnalyticsMetadataCreate(BaseModel):
    metric_key: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=200)
    calculation_type: str = Field(..., description="sum, avg, count, formula")
    definition: dict[str, Any]


class AnalyticsMetadataResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    metric_key: str
    name: str
    calculation_type: str
    definition: dict[str, Any]
    created_at: datetime
    updated_at: datetime
