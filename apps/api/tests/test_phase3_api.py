import pytest
import uuid
from datetime import date
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import Organization, OrganizationMember, OrganizationRole
from app.modules.datamart.models import (
    Dataset, DatasetStatus, DatasetMapping, AnalyticsMetadata,
    Order, Customer, Product, Category, CustomerSegment, OrderStatus
)
from app.services.csv_inspector import inspect_csv_bytes, infer_type, detect_delimiter
from app.services.duckdb_engine import DuckDBAnalyticsEngine
from app.services.analytics_service import (
    calculate_kpi_summary,
    calculate_time_series_trend,
    calculate_segment_breakdown,
    calculate_category_performance,
)
from app.services.ingestion_service import process_dataset_ingestion


def test_csv_inspector_type_inference_and_delimiter():
    assert infer_type("12345") == "integer"
    assert infer_type("99.95") == "float"
    assert infer_type("2026-08-13") == "date"
    assert infer_type("true") == "boolean"
    assert infer_type("hello world") == "string"

    sample_csv = "order_id,amount,customer_name\n1,150.00,Alice\n2,200.50,Bob\n"
    assert detect_delimiter(sample_csv) == ","

    detection = inspect_csv_bytes(sample_csv.encode("utf-8"), "test.csv")
    assert detection.filename == "test.csv"
    assert detection.column_count == 3
    assert len(detection.columns) == 3
    assert detection.columns[0].name == "order_id"
    assert detection.columns[1].inferred_type == "float"


def test_duckdb_engine_kpi_computation():
    engine = DuckDBAnalyticsEngine()
    orders_data = [
        {"id": "o1", "order_date": "2026-08-01", "total_amount": 100.0},
        {"id": "o2", "order_date": "2026-08-02", "total_amount": 200.0},
        {"id": "o3", "order_date": "2026-08-03", "total_amount": 300.0},
    ]
    customers_data = [{"id": "c1"}, {"id": "c2"}]

    engine.load_orders_data(orders_data)
    engine.load_customers_data(customers_data)

    kpis = engine.query_kpi_summary()
    assert kpis["total_revenue"] == 600.0
    assert kpis["total_orders"] == 3
    assert kpis["average_order_value"] == 200.0
    assert kpis["total_customers"] == 2

    trends = engine.query_time_series_trend(granularity="daily")
    assert len(trends) == 3
    assert trends[0]["revenue"] == 100.0
    assert trends[2]["revenue"] == 300.0

    engine.close()


@pytest.mark.asyncio
async def test_analytics_service_and_org_isolation(db_session: AsyncSession):
    user_id = uuid.uuid4()

    # Create Org A and Org B
    org_a = Organization(id=uuid.uuid4(), name="Org A", slug="org-a", owner_id=user_id)
    org_b = Organization(id=uuid.uuid4(), name="Org B", slug="org-b", owner_id=user_id)
    db_session.add_all([org_a, org_b])
    await db_session.flush()

    # Create customer & order for Org A ($500)
    cust_a = Customer(
        id=uuid.uuid4(), organization_id=org_a.id, name="Cust A", segment=CustomerSegment.VIP
    )
    db_session.add(cust_a)
    await db_session.flush()

    order_a = Order(
        id=uuid.uuid4(),
        organization_id=org_a.id,
        order_number="ORD-A-1",
        customer_id=cust_a.id,
        status=OrderStatus.DELIVERED,
        order_date=date(2026, 8, 1),
        subtotal=Decimal("500.00"),
        total_amount=Decimal("500.00"),
    )
    db_session.add(order_a)

    # Create order for Org B ($1200)
    cust_b = Customer(
        id=uuid.uuid4(), organization_id=org_b.id, name="Cust B", segment=CustomerSegment.REGULAR
    )
    db_session.add(cust_b)
    await db_session.flush()

    order_b = Order(
        id=uuid.uuid4(),
        organization_id=org_b.id,
        order_number="ORD-B-1",
        customer_id=cust_b.id,
        status=OrderStatus.DELIVERED,
        order_date=date(2026, 8, 1),
        subtotal=Decimal("1200.00"),
        total_amount=Decimal("1200.00"),
    )
    db_session.add(order_b)
    await db_session.commit()

    # Calculate Org A KPIs -> Total revenue MUST be exactly $500, NOT $1700
    kpi_a = await calculate_kpi_summary(db_session, org_a.id)
    assert kpi_a.total_revenue == 500.0
    assert kpi_a.total_orders == 1

    # Calculate Org B KPIs -> Total revenue MUST be exactly $1200, NOT $1700
    kpi_b = await calculate_kpi_summary(db_session, org_b.id)
    assert kpi_b.total_revenue == 1200.0
    assert kpi_b.total_orders == 1


@pytest.mark.asyncio
async def test_dataset_ingestion_service(db_session: AsyncSession):
    user_id = uuid.uuid4()
    org = Organization(id=uuid.uuid4(), name="Ingest Org", slug="ingest-org", owner_id=user_id)
    db_session.add(org)
    await db_session.flush()

    dataset = Dataset(
        id=uuid.uuid4(),
        organization_id=org.id,
        filename="orders_import.csv",
        file_path="/tmp/orders_import.csv",
        file_size_bytes=4096,
        row_count=50,
        column_count=4,
        delimiter=",",
        status=DatasetStatus.PENDING,
        created_by=user_id,
    )
    db_session.add(dataset)
    await db_session.commit()

    result = await process_dataset_ingestion(
        session=db_session,
        org_id=org.id,
        dataset_id=dataset.id,
        mapping_rules={"col1": "order_number", "col2": "total_amount"},
        target_entity="orders",
    )

    assert result.status == DatasetStatus.COMPLETED
    assert result.rows_processed == 50

    # Query updated dataset state
    ds_res = await db_session.execute(select(Dataset).where(Dataset.id == dataset.id))
    fetched_ds = ds_res.scalar_one_or_none()
    assert fetched_ds is not None
    assert fetched_ds.status == DatasetStatus.COMPLETED
