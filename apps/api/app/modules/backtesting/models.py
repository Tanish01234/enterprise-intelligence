"""Phase 2: Market Domain Models (platform-shared, read-only for users)

Tables:
- symbols
- ohlcv_metadata
"""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    UUID,
    DateTime,
    String,
    Text,
    Integer,
    BigInteger,
    Boolean,
    ForeignKey,
    UniqueConstraint,
    Index,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.core.base import Base


# ──────────────────────────────────────────
# Symbol (Market Instrument)
# ──────────────────────────────────────────

class Symbol(Base):
    """Market symbol / instrument metadata. Shared across all organizations."""
    __tablename__ = "symbols"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    ticker: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    exchange: Mapped[str] = mapped_column(String(20), nullable=False)
    asset_class: Mapped[str] = mapped_column(String(20), nullable=False)  # equity, crypto, forex, commodity
    sector: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    industry: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    ohlcv_files: Mapped[list["OHLCVMetadata"]] = relationship(back_populates="symbol")

    __table_args__ = (
        Index("ix_symbols_ticker", "ticker", unique=True),
        Index("ix_symbols_exchange", "exchange"),
        Index("ix_symbols_asset_class", "asset_class"),
    )


# ──────────────────────────────────────────
# OHLCV Metadata (pointer to Parquet files)
# ──────────────────────────────────────────

class OHLCVMetadata(Base):
    """Metadata about OHLCV parquet files. Actual data stored in Parquet."""
    __tablename__ = "ohlcv_metadata"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    symbol_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("symbols.id", ondelete="CASCADE"), nullable=False
    )
    timeframe: Mapped[str] = mapped_column(String(10), nullable=False)  # 1m, 5m, 15m, 1h, 4h, 1d
    file_path: Mapped[str] = mapped_column(Text, nullable=False)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    bar_count: Mapped[int] = mapped_column(Integer, nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    checksum: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)  # SHA-256
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    symbol: Mapped["Symbol"] = relationship(back_populates="ohlcv_files")

    __table_args__ = (
        UniqueConstraint("symbol_id", "timeframe", name="uq_ohlcv_symbol_timeframe"),
        Index("ix_ohlcv_symbol_id", "symbol_id"),
        Index("ix_ohlcv_timeframe", "timeframe"),
    )
