import pytest
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import Organization
from app.modules.datamart.models import Dataset, DatasetStatus, DatasetMapping, AnalyticsMetadata


@pytest.mark.asyncio
async def test_dataset_and_mapping_creation(db_session: AsyncSession):
    user_id = uuid.uuid4()
    org = Organization(
        id=uuid.uuid4(),
        name="DataMart Test Org",
        slug="datamart-test-org",
        owner_id=user_id,
    )
    db_session.add(org)
    await db_session.flush()

    dataset = Dataset(
        id=uuid.uuid4(),
        organization_id=org.id,
        filename="sales_2026.csv",
        file_path="/uploads/sales_2026.csv",
        file_size_bytes=102400,
        row_count=500,
        column_count=8,
        delimiter=",",
        columns_metadata={"columns": ["order_id", "amount", "date"]},
        status=DatasetStatus.PENDING,
        created_by=user_id,
    )
    db_session.add(dataset)
    await db_session.flush()

    mapping = DatasetMapping(
        id=uuid.uuid4(),
        organization_id=org.id,
        dataset_id=dataset.id,
        target_entity="orders",
        mapping_rules={"order_id": "order_number", "amount": "total_amount"},
    )
    db_session.add(mapping)

    meta = AnalyticsMetadata(
        id=uuid.uuid4(),
        organization_id=org.id,
        metric_key="monthly_revenue",
        name="Monthly Revenue",
        calculation_type="sum",
        definition={"target_field": "total_amount", "group_by": "order_date"},
    )
    db_session.add(meta)
    await db_session.commit()

    # Query back
    stmt = select(Dataset).where(Dataset.id == dataset.id)
    res = await db_session.execute(stmt)
    fetched_ds = res.scalar_one_or_none()

    assert fetched_ds is not None
    assert fetched_ds.filename == "sales_2026.csv"
    assert fetched_ds.status == DatasetStatus.PENDING

    stmt_map = select(DatasetMapping).where(DatasetMapping.dataset_id == dataset.id)
    res_map = await db_session.execute(stmt_map)
    fetched_map = res_map.scalar_one_or_none()

    assert fetched_map is not None
    assert fetched_map.target_entity == "orders"
    assert fetched_map.mapping_rules["amount"] == "total_amount"
