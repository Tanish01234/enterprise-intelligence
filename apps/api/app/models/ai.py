from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Text, Boolean, Float, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from app.core.database import Base


class AIConversation(Base):
    """AI conversation model."""
    __tablename__ = "ai_conversations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Conversation
    title = Column(String(255), nullable=True)
    context = Column(JSON, nullable=True)  # Dataset context, filters, etc.
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="ai_conversations")
    messages = relationship("AIMessage", back_populates="conversation", cascade="all, delete-orphan")


class AIMessage(Base):
    """AI message model."""
    __tablename__ = "ai_messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False)
    
    # Message
    role = Column(String(20), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    
    # SQL generation (if applicable)
    generated_sql = Column(Text, nullable=True)
    sql_executed = Column(Boolean, default=False, nullable=False)
    execution_results = Column(JSON, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    conversation = relationship("AIConversation", back_populates="messages")


class AIQuery(Base):
    """AI query history for analytics."""
    __tablename__ = "ai_queries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Query
    natural_language_query = Column(Text, nullable=False)
    generated_sql = Column(Text, nullable=True)
    
    # Execution
    executed = Column(Boolean, default=False, nullable=False)
    execution_time_ms = Column(Float, nullable=True)
    row_count = Column(Integer, nullable=True)
    
    # Feedback
    user_feedback = Column(String(20), nullable=True)  # positive, negative
    feedback_comment = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class AIInsight(Base):
    """AI-generated insights."""
    __tablename__ = "ai_insights"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=True)
    
    # Insight
    insight_type = Column(String(50), nullable=False)  # anomaly, trend, correlation, recommendation
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    confidence_score = Column(Float, nullable=False)
    
    # Data
    supporting_data = Column(JSON, nullable=True)
    visualization_config = Column(JSON, nullable=True)
    
    # Status
    is_acknowledged = Column(Boolean, default=False, nullable=False)
    acknowledged_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
