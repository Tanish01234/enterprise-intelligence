from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, JSON, Text, Float, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from app.core.database import Base


class Query(Base):
    """Query execution history."""
    __tablename__ = "queries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id", ondelete="SET NULL"), nullable=True)
    
    # Query
    query_text = Column(Text, nullable=False)
    query_type = Column(String(50), nullable=False)  # sql, natural_language
    
    # Execution
    execution_time_ms = Column(Float, nullable=True)
    row_count = Column(Integer, nullable=True)
    status = Column(String(50), nullable=False)  # success, failed
    error_message = Column(Text, nullable=True)
    
    # Results (cached)
    results = Column(JSON, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Report(Base):
    """Report model."""
    __tablename__ = "reports"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Configuration
    config = Column(JSON, nullable=False)  # queries, visualizations, filters
    
    # Schedule
    is_scheduled = Column(Boolean, default=False, nullable=False)
    schedule_cron = Column(String(100), nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    executions = relationship("ReportExecution", back_populates="report", cascade="all, delete-orphan")


class ReportExecution(Base):
    """Report execution history."""
    __tablename__ = "report_executions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id = Column(UUID(as_uuid=True), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False)
    
    # Execution
    status = Column(String(50), nullable=False)  # success, failed, running
    execution_time_ms = Column(Float, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Results
    output_path = Column(String(500), nullable=True)
    
    # Metadata
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    report = relationship("Report", back_populates="executions")


class Dashboard(Base):
    """Dashboard model."""
    __tablename__ = "dashboards"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Layout
    layout = Column(JSON, nullable=False)  # Grid layout configuration
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    widgets = relationship("Widget", back_populates="dashboard", cascade="all, delete-orphan")


class Widget(Base):
    """Dashboard widget model."""
    __tablename__ = "widgets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dashboard_id = Column(UUID(as_uuid=True), ForeignKey("dashboards.id", ondelete="CASCADE"), nullable=False)
    
    # Widget configuration
    title = Column(String(255), nullable=False)
    widget_type = Column(String(50), nullable=False)  # chart, kpi, table, text
    config = Column(JSON, nullable=False)  # chart config, query, etc.
    
    # Position
    position_x = Column(Integer, nullable=False)
    position_y = Column(Integer, nullable=False)
    width = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    dashboard = relationship("Dashboard", back_populates="widgets")


class Metric(Base):
    """KPI metric model."""
    __tablename__ = "metrics"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Calculation
    query = Column(Text, nullable=False)
    aggregation = Column(String(50), nullable=False)  # sum, avg, count, etc.
    
    # Format
    format_type = Column(String(50), nullable=False)  # number, currency, percentage
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
