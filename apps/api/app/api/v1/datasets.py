from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pathlib import Path
from typing import List, Optional
from datetime import datetime
import uuid
import aiofiles

from app.core.database import get_db, get_duckdb
from app.core.config import settings
from app.models.dataset import Dataset, DatasetStatus, FileType
from app.models.user import User
from app.services.dataset_processor import dataset_processor
from app.services.ai_service import generate_data_insights, generate_chart_recommendations
from app.services.supabase_auth import verify_supabase_token
from pydantic import BaseModel

router = APIRouter()
security = HTTPBearer()


class DatasetResponse(BaseModel):
    id: str
    name: str
    file_type: str
    file_size: int
    status: str
    row_count: Optional[int]
    column_count: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True


class DatasetListResponse(BaseModel):
    datasets: List[DatasetResponse]
    total: int


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


async def process_dataset_background(
    dataset_id: str,
    file_path: str,
    filename: str,
    file_extension: str,
    db_url: str
):
    """Background task to process dataset."""
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
    
    # Create new DB session for background task
    engine = create_async_engine(db_url)
    AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)
    
    async with AsyncSessionLocal() as db:
        try:
            # Get dataset
            result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
            dataset = result.scalar_one_or_none()
            
            if not dataset:
                return
            
            # Update status
            dataset.status = DatasetStatus.PROCESSING
            await db.commit()
            
            # Read file
            async with aiofiles.open(file_path, 'rb') as f:
                file_content = await f.read()
            
            # Process dataset
            result = await dataset_processor.process_dataset(
                file_content=file_content,
                filename=filename,
                file_extension=file_extension
            )
            
            if not result['success']:
                dataset.status = DatasetStatus.FAILED
                dataset.error_message = result.get('error')
                await db.commit()
                return
            
            # Update dataset metadata
            dataset.row_count = result['metadata']['row_count']
            dataset.column_count = result['metadata']['column_count']
            dataset.schema = result['schema']
            
            # Load to DuckDB
            table_name = f"dataset_{str(dataset_id).replace('-', '_')}"
            dataset.duckdb_table_name = table_name
            
            success = await dataset_processor.load_to_duckdb(
                df=result['dataframe'],
                table_name=table_name,
                duckdb_path=settings.DUCKDB_PATH
            )
            
            if success:
                dataset.status = DatasetStatus.READY
            else:
                dataset.status = DatasetStatus.FAILED
                dataset.error_message = "Failed to load to DuckDB"
            
            await db.commit()
            
        except Exception as e:
            dataset.status = DatasetStatus.FAILED
            dataset.error_message = str(e)
            await db.commit()


@router.post("/upload", response_model=DatasetResponse, status_code=status.HTTP_201_CREATED)
async def upload_dataset(
    file: UploadFile = File(...),
    name: Optional[str] = None,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload and process dataset."""
    
    # Validate file extension
    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in dataset_processor.supported_formats:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Supported: {dataset_processor.supported_formats}"
        )
    
    # Create upload directory if not exists
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    dataset_id = uuid.uuid4()
    file_path = upload_dir / f"{dataset_id}{file_extension}"
    
    # Save file
    file_content = await file.read()
    file_size = len(file_content)
    
    # Check file size
    if file_size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Max size: {settings.MAX_UPLOAD_SIZE} bytes"
        )
    
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(file_content)
    
    # Determine file type
    file_type_map = {
        '.csv': FileType.CSV,
        '.xlsx': FileType.EXCEL,
        '.xls': FileType.EXCEL,
        '.json': FileType.JSON,
        '.parquet': FileType.PARQUET
    }
    
    # Create dataset record
    dataset = Dataset(
        id=dataset_id,
        organization_id=uuid.uuid4(),  # Using placeholder org ID
        name=name or file.filename,
        file_type=file_type_map[file_extension],
        file_size=file_size,
        file_path=str(file_path),
        original_filename=file.filename,
        status=DatasetStatus.UPLOADING,
        created_by=current_user.id
    )
    
    db.add(dataset)
    await db.commit()
    await db.refresh(dataset)
    
    # Process in background
    background_tasks.add_task(
        process_dataset_background,
        str(dataset.id),
        str(file_path),
        file.filename,
        file_extension,
        settings.DATABASE_URL
    )
    
    return dataset


@router.get("/", response_model=DatasetListResponse)
async def list_datasets(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List user's datasets."""
    
    # Get datasets
    result = await db.execute(
        select(Dataset)
        .where(Dataset.created_by == current_user.id)
        .offset(skip)
        .limit(limit)
        .order_by(Dataset.created_at.desc())
    )
    datasets = result.scalars().all()
    
    # Get total count
    count_result = await db.execute(
        select(Dataset).where(Dataset.created_by == current_user.id)
    )
    total = len(count_result.scalars().all())
    
    return DatasetListResponse(
        datasets=datasets,
        total=total
    )


@router.get("/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(
    dataset_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get dataset by ID."""
    
    result = await db.execute(
        select(Dataset).where(
            Dataset.id == dataset_id,
            Dataset.created_by == current_user.id
        )
    )
    dataset = result.scalar_one_or_none()
    
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
    
    return dataset


@router.delete("/{dataset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dataset(
    dataset_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete dataset."""
    
    result = await db.execute(
        select(Dataset).where(
            Dataset.id == dataset_id,
            Dataset.created_by == current_user.id
        )
    )
    dataset = result.scalar_one_or_none()
    
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found"
        )
    
    # Delete file
    try:
        Path(dataset.file_path).unlink(missing_ok=True)
    except Exception as e:
        pass
    
    # Delete from database
    await db.delete(dataset)
    await db.commit()


@router.get("/{dataset_id}/preview")
async def preview_dataset(
    dataset_id: str,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    duckdb_conn = Depends(get_duckdb)
):
    """Preview dataset rows."""
    
    result = await db.execute(
        select(Dataset).where(
            Dataset.id == dataset_id,
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
    
    # Query DuckDB
    try:
        query = f"SELECT * FROM {dataset.duckdb_table_name} LIMIT {limit}"
        result_df = duckdb_conn.fetch_df(query)
        
        return {
            "columns": list(result_df.columns),
            "rows": result_df.to_dict(orient='records'),
            "row_count": len(result_df)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query dataset: {str(e)}"
        )


@router.get("/{dataset_id}/export/csv")
async def export_dataset_csv(
    dataset_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    duckdb_conn = Depends(get_duckdb)
):
    """Export dataset as CSV."""
    from fastapi.responses import StreamingResponse
    import io
    
    result = await db.execute(
        select(Dataset).where(
            Dataset.id == dataset_id,
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
    
    # Query all data from DuckDB
    try:
        query = f"SELECT * FROM {dataset.duckdb_table_name}"
        result_df = duckdb_conn.fetch_df(query)
        
        # Convert to CSV
        output = io.StringIO()
        result_df.to_csv(output, index=False)
        output.seek(0)
        
        # Return as streaming response
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={dataset.name}.csv"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export dataset: {str(e)}"
        )
