from datetime import datetime
from typing import Optional, Any
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from app.modules.datamart.models import DatasetStatus


class ColumnMetadata(BaseModel):
    name: str
    inferred_type: str  # integer, float, string, date, boolean
    sample_values: list[Any] = []
    null_count: int = 0


class SchemaDetectionResult(BaseModel):
    filename: str
    delimiter: str
    row_count: int
    column_count: int
    columns: list[ColumnMetadata]


class DatasetBase(BaseModel):
    filename: str


class DatasetCreate(DatasetBase):
    file_path: str
    file_size_bytes: int
    row_count: Optional[int] = None
    column_count: Optional[int] = None
    delimiter: str = ","
    columns_metadata: Optional[dict[str, Any]] = None


class DatasetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    filename: str
    file_path: str
    file_size_bytes: int
    row_count: Optional[int] = None
    column_count: Optional[int] = None
    delimiter: str
    columns_metadata: Optional[dict[str, Any]] = None
    status: DatasetStatus
    error_message: Optional[str] = None
    created_by: UUID
    created_at: datetime
    updated_at: datetime


class DatasetMappingCreate(BaseModel):
    dataset_id: UUID
    target_entity: str = Field(..., description="Target domain entity: 'orders', 'products', 'customers'")
    mapping_rules: dict[str, str] = Field(..., description="Mapping of CSV column -> target schema field")


class DatasetMappingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    dataset_id: UUID
    target_entity: str
    mapping_rules: dict[str, str]
    is_active: bool
    created_at: datetime


class IngestionPreviewRequest(BaseModel):
    mapping_rules: dict[str, str]
    target_entity: str
    limit: int = Field(default=10, ge=1, le=100)


class IngestionResult(BaseModel):
    dataset_id: UUID
    target_entity: str
    rows_processed: int
    rows_inserted: int
    errors: list[str] = []
    status: DatasetStatus
