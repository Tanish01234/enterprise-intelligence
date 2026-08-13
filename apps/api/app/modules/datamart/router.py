"""DataMart FastAPI Router

Endpoints for:
- CSV Upload & automatic schema detection
- Dataset CRUD (list, get, delete)
- Schema inspection & column mapping
- Ingestion execution
"""

import os
import uuid
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.core.database import get_session
from app.modules.auth.dependencies import get_current_user, get_current_organization
from app.modules.auth.schemas import UserResponse, OrganizationResponse
from app.modules.datamart.models import Dataset, DatasetStatus, DatasetMapping
from app.modules.datamart.schemas import (
    DatasetResponse,
    SchemaDetectionResult,
    DatasetMappingCreate,
    DatasetMappingResponse,
    IngestionResult,
)
from app.services.csv_inspector import inspect_csv_bytes
from app.services.ingestion_service import process_dataset_ingestion

router = APIRouter(prefix="/datamart", tags=["datamart"])

UPLOAD_DIR = "/tmp/datamart_uploads"


@router.post("/upload", response_model=DatasetResponse, status_code=status.HTTP_201_CREATED)
async def upload_csv_dataset(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user),
    current_org: OrganizationResponse = Depends(get_current_organization),
    session: AsyncSession = Depends(get_session),
):
    """Upload a CSV dataset file and perform initial schema detection."""
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are supported",
        )

    file_bytes = await file.read()
    file_size = len(file_bytes)

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty",
        )

    # Inspect CSV schema
    try:
        detection = inspect_csv_bytes(file_bytes, file.filename)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse CSV file: {str(e)}",
        )

    # Save file to disk
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    saved_filename = f"{current_org.id}_{uuid.uuid4().hex}_{file.filename}"
    saved_path = os.path.join(UPLOAD_DIR, saved_filename)
    with open(saved_path, "wb") as f:
        f.write(file_bytes)

    # Create dataset record
    dataset = Dataset(
        id=uuid.uuid4(),
        organization_id=current_org.id,
        filename=file.filename,
        file_path=saved_path,
        file_size_bytes=file_size,
        row_count=detection.row_count,
        column_count=detection.column_count,
        delimiter=detection.delimiter,
        columns_metadata={"columns": [c.model_dump() for c in detection.columns]},
        status=DatasetStatus.PENDING,
        created_by=current_user.id,
    )
    session.add(dataset)
    await session.commit()
    await session.refresh(dataset)

    return DatasetResponse.model_validate(dataset)


@router.get("/datasets", response_model=list[DatasetResponse])
async def list_datasets(
    current_org: OrganizationResponse = Depends(get_current_organization),
    session: AsyncSession = Depends(get_session),
):
    """List all datasets uploaded for the current organization."""
    stmt = (
        select(Dataset)
        .where(Dataset.organization_id == current_org.id)
        .order_by(Dataset.created_at.desc())
    )
    res = await session.execute(stmt)
    datasets = res.scalars().all()
    return [DatasetResponse.model_validate(d) for d in datasets]


@router.get("/datasets/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(
    dataset_id: UUID,
    current_org: OrganizationResponse = Depends(get_current_organization),
    session: AsyncSession = Depends(get_session),
):
    """Get details of a specific dataset."""
    stmt = select(Dataset).where(
        Dataset.id == dataset_id,
        Dataset.organization_id == current_org.id,
    )
    res = await session.execute(stmt)
    dataset = res.scalar_one_or_none()

    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found",
        )

    return DatasetResponse.model_validate(dataset)


@router.delete("/datasets/{dataset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dataset(
    dataset_id: UUID,
    current_org: OrganizationResponse = Depends(get_current_organization),
    session: AsyncSession = Depends(get_session),
):
    """Delete a dataset and its mapping configuration."""
    stmt = select(Dataset).where(
        Dataset.id == dataset_id,
        Dataset.organization_id == current_org.id,
    )
    res = await session.execute(stmt)
    dataset = res.scalar_one_or_none()

    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found",
        )

    # Remove physical file if present
    if dataset.file_path and os.path.exists(dataset.file_path):
        try:
            os.remove(dataset.file_path)
        except OSError:
            pass

    await session.delete(dataset)
    await session.commit()
    return None


@router.post("/mappings", response_model=IngestionResult)
async def create_dataset_mapping(
    mapping_data: DatasetMappingCreate,
    current_org: OrganizationResponse = Depends(get_current_organization),
    session: AsyncSession = Depends(get_session),
):
    """Save column mapping rules and trigger dataset ingestion into target entity."""
    try:
        result = await process_dataset_ingestion(
            session=session,
            org_id=current_org.id,
            dataset_id=mapping_data.dataset_id,
            mapping_rules=mapping_data.mapping_rules,
            target_entity=mapping_data.target_entity,
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
