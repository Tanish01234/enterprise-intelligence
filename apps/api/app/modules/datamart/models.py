"""Phase 2: Business Domain Models (organization-scoped)

Tables:
- categories
- regions
- customers
- products
- orders
- order_items
- transactions
"""

import uuid
from datetime import datetime, date
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    UUID,
    DateTime,
    Date,
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
    CheckConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.core.base import Base
import enum


# ──────────────────────────────────────────
# Enums
# ──────────────────────────────────────────

class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    RETURNED = "returned"


class TransactionType(str, enum.Enum):
    SALE = "sale"
    REFUND = "refund"
    ADJUSTMENT = "adjustment"


class CustomerSegment(str, enum.Enum):
    NEW = "new"
    REGULAR = "regular"
    VIP = "vip"
    CHURNED = "churned"


# ──────────────────────────────────────────
# Category
# ──────────────────────────────────────────

class Category(Base):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False)
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    products: Mapped[list["Product"]] = relationship(back_populates="category")
    children: Mapped[list["Category"]] = relationship(back_populates="parent", remote_side="Category.id")
    parent: Mapped[Optional["Category"]] = relationship(back_populates="children", remote_side="Category.parent_id")

    __table_args__ = (
        UniqueConstraint("organization_id", "slug", name="uq_category_org_slug"),
        Index("ix_categories_org_id", "organization_id"),
    )


# ──────────────────────────────────────────
# Region
# ──────────────────────────────────────────

class Region(Base):
    __tablename__ = "regions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(20), nullable=False)
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("regions.id", ondelete="SET NULL"), nullable=True
    )
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    customers: Mapped[list["Customer"]] = relationship(back_populates="region")

    __table_args__ = (
        UniqueConstraint("organization_id", "code", name="uq_region_org_code"),
        Index("ix_regions_org_id", "organization_id"),
    )


# ──────────────────────────────────────────
# Customer
# ──────────────────────────────────────────

class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    external_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    segment: Mapped[CustomerSegment] = mapped_column(
        SQLEnum(CustomerSegment), nullable=False, default=CustomerSegment.NEW
    )
    region_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("regions.id", ondelete="SET NULL"), nullable=True
    )
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSONB, nullable=True)
    first_purchase_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    region: Mapped[Optional["Region"]] = relationship(back_populates="customers")
    orders: Mapped[list["Order"]] = relationship(back_populates="customer")

    __table_args__ = (
        UniqueConstraint("organization_id", "external_id", name="uq_customer_org_external_id"),
        Index("ix_customers_org_id", "organization_id"),
        Index("ix_customers_segment", "organization_id", "segment"),
        Index("ix_customers_region", "organization_id", "region_id"),
    )


# ──────────────────────────────────────────
# Product
# ──────────────────────────────────────────

class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    sku: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )
    unit_price: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False
    )
    cost_price: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(12, 2), nullable=True
    )
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    tags: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    attributes: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    category: Mapped[Optional["Category"]] = relationship(back_populates="products")
    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="product")

    __table_args__ = (
        UniqueConstraint("organization_id", "sku", name="uq_product_org_sku"),
        Index("ix_products_org_id", "organization_id"),
        Index("ix_products_category", "organization_id", "category_id"),
        CheckConstraint("unit_price >= 0", name="ck_product_unit_price_positive"),
    )


# ──────────────────────────────────────────
# Order
# ──────────────────────────────────────────

class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    order_number: Mapped[str] = mapped_column(String(50), nullable=False)
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False
    )
    status: Mapped[OrderStatus] = mapped_column(
        SQLEnum(OrderStatus), nullable=False, default=OrderStatus.PENDING
    )
    order_date: Mapped[date] = mapped_column(Date, nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0.00"))
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), default=Decimal("0.00"))
    total_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    customer: Mapped["Customer"] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )
    transactions: Mapped[list["Transaction"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("organization_id", "order_number", name="uq_order_org_number"),
        Index("ix_orders_org_id", "organization_id"),
        Index("ix_orders_customer", "organization_id", "customer_id"),
        Index("ix_orders_date", "organization_id", "order_date"),
        Index("ix_orders_status", "organization_id", "status"),
    )


# ──────────────────────────────────────────
# OrderItem
# ──────────────────────────────────────────

class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="RESTRICT"), nullable=False
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    discount_pct: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0.00"))
    line_total: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)

    # Relationships
    order: Mapped["Order"] = relationship(back_populates="items")
    product: Mapped["Product"] = relationship(back_populates="order_items")

    __table_args__ = (
        Index("ix_order_items_org_id", "organization_id"),
        Index("ix_order_items_order_id", "order_id"),
        Index("ix_order_items_product_id", "organization_id", "product_id"),
        CheckConstraint("quantity > 0", name="ck_order_item_qty_positive"),
    )


# ──────────────────────────────────────────
# Transaction
# ──────────────────────────────────────────

class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
    )
    type: Mapped[TransactionType] = mapped_column(
        SQLEnum(TransactionType), nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    payment_method: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    transaction_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    order: Mapped["Order"] = relationship(back_populates="transactions")

    __table_args__ = (
        Index("ix_transactions_org_id", "organization_id"),
        Index("ix_transactions_order_id", "order_id"),
        Index("ix_transactions_date", "organization_id", "transaction_date"),
        Index("ix_transactions_type", "organization_id", "type"),
    )


# ──────────────────────────────────────────
# DataMart & Upload Tracking Enums & Models
# ──────────────────────────────────────────

class DatasetStatus(str, enum.Enum):
    PENDING = "pending"
    MAPPED = "mapped"
    INGESTING = "ingesting"
    COMPLETED = "completed"
    FAILED = "failed"


class Dataset(Base):
    """Uploaded CSV dataset tracking & metadata."""
    __tablename__ = "datasets"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(Text, nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    row_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    column_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    delimiter: Mapped[str] = mapped_column(String(10), default=",", nullable=False)
    columns_metadata: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)  # detected schema, sample data, inferred types
    status: Mapped[DatasetStatus] = mapped_column(
        SQLEnum(DatasetStatus), nullable=False, default=DatasetStatus.PENDING
    )
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
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
    mappings: Mapped[list["DatasetMapping"]] = relationship(
        back_populates="dataset", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_datasets_org_id", "organization_id"),
        Index("ix_datasets_status", "organization_id", "status"),
    )


class DatasetMapping(Base):
    """Mapping rules from CSV columns to target domain fields."""
    __tablename__ = "dataset_mappings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    dataset_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False
    )
    target_entity: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., 'orders', 'products', 'customers'
    mapping_rules: Mapped[dict] = mapped_column(JSONB, nullable=False)  # { "csv_col": "target_field" }
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    dataset: Mapped["Dataset"] = relationship(back_populates="mappings")

    __table_args__ = (
        Index("ix_dataset_mappings_org_id", "organization_id"),
        Index("ix_dataset_mappings_dataset_id", "dataset_id"),
    )


class AnalyticsMetadata(Base):
    """Custom metric & KPI definitions for an organization."""
    __tablename__ = "analytics_metadata"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    metric_key: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    calculation_type: Mapped[str] = mapped_column(String(50), nullable=False)  # sum, avg, count, formula
    definition: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    __table_args__ = (
        UniqueConstraint("organization_id", "metric_key", name="uq_analytics_meta_key"),
        Index("ix_analytics_meta_org_id", "organization_id"),
    )

