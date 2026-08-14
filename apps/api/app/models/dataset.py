from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, BigInteger, JSON, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum

from app.core.database import Base


class DatasetStatus(str, enum.Enum):
    """Dataset processing status."""
    UPLOADING = "uploading"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class FileType(str, enum.Enum):
    """Supported file types."""
    CSV = "csv"
    EXCEL = "excel"
    JSON = "json"
    PARQUET = "parquet"


class Dataset(Base):
    """Dataset model."""
    __tablename__ = "datasets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # File info
    file_type = Column(SQLEnum(FileType), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    file_path = Column(String(500), nullable=False)
    original_filename = Column(String(255), nullable=False)
    
    # Status
    status = Column(SQLEnum(DatasetStatus), default=DatasetStatus.UPLOADING, nullable=False)
    error_message = Column(Text, nullable=True)
    
    # Statistics
    row_count = Column(BigInteger, nullable=True)
    column_count = Column(Integer, nullable=True)
    
    # Schema
    schema = Column(JSON, nullable=True)  # Detected schema
    
    # DuckDB
    duckdb_table_name = Column(String(255), nullable=True, unique=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    organization = relationship("Organization", back_populates="datasets")
    versions = relationship("DatasetVersion", back_populates="dataset", cascade="all, delete-orphan")
    mappings = relationship("SchemaMapping", back_populates="dataset", cascade="all, delete-orphan")


class DatasetVersion(Base):
    """Dataset version model for versioning."""
    __tablename__ = "dataset_versions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    version = Column(Integer, nullable=False)
    
    # File info
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    row_count = Column(BigInteger, nullable=True)
    
    # Schema
    schema = Column(JSON, nullable=True)
    
    # Changes
    change_summary = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    dataset = relationship("Dataset", back_populates="versions")


class SchemaMapping(Base):
    """Schema mapping model for column transformations."""
    __tablename__ = "schema_mappings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    
    # Mapping
    source_column = Column(String(255), nullable=False)
    target_column = Column(String(255), nullable=False)
    data_type = Column(String(50), nullable=False)
    transformation = Column(String(100), nullable=True)  # cast, trim, lowercase, etc.
    
    # Validation
    is_required = Column(Boolean, default=False, nullable=False)
    validation_rules = Column(JSON, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    dataset = relationship("Dataset", back_populates="mappings")
