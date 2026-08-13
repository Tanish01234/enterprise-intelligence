import pytest
import uuid
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import Organization, OrganizationMember, OrganizationRole
from app.modules.datamart.models import Category, Region, Product, Customer, Order, OrderItem, Transaction
from app.modules.backtesting.models import Symbol
from app.modules.copilot.models import Strategy, Alert
from app.core.seed import seed_demo_data


@pytest.mark.asyncio
async def test_create_and_query_organization(db_session: AsyncSession):
    user_id = uuid.uuid4()
    org = Organization(
        id=uuid.uuid4(),
        name="Acme Trading",
        slug="acme-trading",
        owner_id=user_id,
    )
    db_session.add(org)
    await db_session.commit()

    stmt = select(Organization).where(Organization.slug == "acme-trading")
    res = await db_session.execute(stmt)
    fetched = res.scalar_one_or_none()

    assert fetched is not None
    assert fetched.name == "Acme Trading"
    assert fetched.owner_id == user_id


@pytest.mark.asyncio
async def test_seed_demo_data(db_session: AsyncSession):
    owner_user_id = uuid.uuid4()

    result = await seed_demo_data(db_session, owner_user_id)

    if result["status"] == "already_seeded":
        assert result["org_id"] is not None
    else:
        assert result["status"] == "success"
        assert result["org_name"] == "Demo Retail Co."
        assert result["categories_count"] == 4
        assert result["products_count"] == 8
        assert result["customers_count"] == 5
        assert result["orders_count"] == 14

    # Verify database state
    org_res = await db_session.execute(select(Organization).where(Organization.slug == "demo-retail-co"))
    demo_org = org_res.scalar_one_or_none()
    assert demo_org is not None

    prods_res = await db_session.execute(
        select(Product).where(Product.organization_id == demo_org.id)
    )
    products = prods_res.scalars().all()
    assert len(products) == 8

    orders_res = await db_session.execute(
        select(Order).where(Order.organization_id == demo_org.id)
    )
    orders = orders_res.scalars().all()
    assert len(orders) == 14


@pytest.mark.asyncio
async def test_idempotent_seed_demo_data(db_session: AsyncSession):
    owner_user_id = uuid.uuid4()
    res = await seed_demo_data(db_session, owner_user_id)
    assert res["status"] in ("success", "already_seeded")
