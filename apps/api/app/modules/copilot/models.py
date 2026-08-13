"""Phase 2: Intelligence Domain Models (organization-scoped)

Tables:
- strategies
- backtest_runs
- alerts
- ai_conversations
"""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    UUID,
    DateTime,
    String,
    Text,
    Numeric,
    Integer,
    Boolean,
    ForeignKey,
    UniqueConstraint,
    Index,
    func,
    Enum as SQLEnum,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.core.base import Base
import enum


# ──────────────────────────────────────────
# Enums
# ──────────────────────────────────────────

class StrategyStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class BacktestStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class AlertSeverity(str, enum.Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class AlertStatus(str, enum.Enum):
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


# ──────────────────────────────────────────
# Strategy
# ──────────────────────────────────────────

class Strategy(Base):
    __tablename__ = "strategies"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    strategy_type: Mapped[str] = mapped_column(String(50), nullable=False)  # sma_cross, rsi_mean_reversion, custom
    parameters: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    status: Mapped[StrategyStatus] = mapped_column(
        SQLEnum(StrategyStatus), nullable=False, default=StrategyStatus.DRAFT
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("auth.users.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    backtest_runs: Mapped[list["BacktestRun"]] = relationship(
        back_populates="strategy", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_strategies_org_id", "organization_id"),
        Index("ix_strategies_status", "organization_id", "status"),
        Index("ix_strategies_type", "organization_id", "strategy_type"),
    )


# ──────────────────────────────────────────
# Backtest Run
# ──────────────────────────────────────────

class BacktestRun(Base):
    __tablename__ = "backtest_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    strategy_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("strategies.id", ondelete="CASCADE"), nullable=False
    )
    symbol: Mapped[str] = mapped_column(String(20), nullable=False)
    timeframe: Mapped[str] = mapped_column(String(10), nullable=False)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    initial_capital: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    status: Mapped[BacktestStatus] = mapped_column(
        SQLEnum(BacktestStatus), nullable=False, default=BacktestStatus.PENDING
    )
    # Results (populated after completion)
    total_return_pct: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 4), nullable=True)
    sharpe_ratio: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 4), nullable=True)
    max_drawdown_pct: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 4), nullable=True)
    win_rate: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 4), nullable=True)
    total_trades: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    final_equity: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True)
    results_detail: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    started_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("auth.users.id"), nullable=False
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    strategy: Mapped["Strategy"] = relationship(back_populates="backtest_runs")

    __table_args__ = (
        Index("ix_backtest_runs_org_id", "organization_id"),
        Index("ix_backtest_runs_strategy", "organization_id", "strategy_id"),
        Index("ix_backtest_runs_status", "organization_id", "status"),
    )


# ──────────────────────────────────────────
# Alert
# ──────────────────────────────────────────

class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[AlertSeverity] = mapped_column(
        SQLEnum(AlertSeverity), nullable=False, default=AlertSeverity.INFO
    )
    status: Mapped[AlertStatus] = mapped_column(
        SQLEnum(AlertStatus), nullable=False, default=AlertStatus.ACTIVE
    )
    source_module: Mapped[str] = mapped_column(String(50), nullable=False)  # datamart, analytics, backtesting, retail
    source_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSONB, nullable=True)
    acknowledged_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("auth.users.id"), nullable=True
    )
    acknowledged_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        Index("ix_alerts_org_id", "organization_id"),
        Index("ix_alerts_status", "organization_id", "status"),
        Index("ix_alerts_severity", "organization_id", "severity"),
        Index("ix_alerts_source", "organization_id", "source_module"),
    )


# ──────────────────────────────────────────
# AI Conversation
# ──────────────────────────────────────────

class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("auth.users.id"), nullable=False
    )
    title: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    context_module: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    messages: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    tool_calls: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    token_count: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    __table_args__ = (
        Index("ix_ai_conversations_org_id", "organization_id"),
        Index("ix_ai_conversations_user", "organization_id", "user_id"),
    )
