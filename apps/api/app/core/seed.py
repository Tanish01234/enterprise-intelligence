"""Phase 2: Demo Seed Data Generator

Populates a demo organization with realistic data across:
- Categories
- Regions
- Products
- Customers
- Orders & Order Items
- Transactions
- Symbols & OHLCV Metadata
- Strategies
- Alerts
"""

import uuid
from datetime import datetime, date, timedelta, timezone
from decimal import Decimal
import random

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.modules.auth.models import Organization, OrganizationMember, OrganizationRole, UserProfile
from app.modules.datamart.models import (
    Category, Region, Customer, CustomerSegment,
    Product, Order, OrderStatus, OrderItem, Transaction, TransactionType
)
from app.modules.backtesting.models import Symbol, OHLCVMetadata
from app.modules.copilot.models import Strategy, StrategyStatus, Alert, AlertSeverity, AlertStatus


async def seed_demo_data(session: AsyncSession, owner_user_id: uuid.UUID) -> dict:
    """Seed demo organization and related business/market data."""

    # 1. Check if demo org already exists
    stmt = select(Organization).where(Organization.slug == "demo-retail-co")
    res = await session.execute(stmt)
    existing_org = res.scalar_one_or_none()

    if existing_org:
        return {"status": "already_seeded", "org_id": str(existing_org.id)}

    # 2. Create Demo Organization
    demo_org = Organization(
        id=uuid.uuid4(),
        name="Demo Retail Co.",
        slug="demo-retail-co",
        settings={"timezone": "America/New_York", "currency": "USD", "fiscal_year_start": 1},
        owner_id=owner_user_id,
    )
    session.add(demo_org)

    # 3. Create Org Member
    member = OrganizationMember(
        id=uuid.uuid4(),
        organization_id=demo_org.id,
        user_id=owner_user_id,
        role=OrganizationRole.OWNER,
    )
    session.add(member)
    await session.flush()

    # 4. Create Regions
    regions_data = [
        ("North America - East", "NA-EAST"),
        ("North America - West", "NA-WEST"),
        ("Europe - Central", "EU-CENTRAL"),
        ("Asia Pacific", "APAC"),
    ]
    regions = []
    for name, code in regions_data:
        r = Region(id=uuid.uuid4(), organization_id=demo_org.id, name=name, code=code)
        session.add(r)
        regions.append(r)
    await session.flush()

    # 5. Create Categories
    categories_data = [
        ("Electronics", "electronics", "Gadgets and tech hardware"),
        ("Apparel & Footwear", "apparel", "Clothing, shoes and fashion"),
        ("Home & Living", "home-living", "Furniture, kitchenware and decor"),
        ("Beauty & Wellness", "beauty-wellness", "Skincare, cosmetics and health"),
    ]
    categories = []
    for name, slug, desc in categories_data:
        c = Category(id=uuid.uuid4(), organization_id=demo_org.id, name=name, slug=slug, description=desc)
        session.add(c)
        categories.append(c)
    await session.flush()

    # 6. Create Products
    products_data = [
        ("SKU-ELEC-001", "Pro Wireless Headphones", categories[0].id, Decimal("199.99"), Decimal("85.00"), 120),
        ("SKU-ELEC-002", "Smart Fitness Watch", categories[0].id, Decimal("149.50"), Decimal("60.00"), 85),
        ("SKU-ELEC-003", "4K Ultra HD Monitor 27\"", categories[0].id, Decimal("349.99"), Decimal("180.00"), 40),
        ("SKU-APP-001", "Performance Running Shoes", categories[1].id, Decimal("119.00"), Decimal("42.00"), 200),
        ("SKU-APP-002", "Organic Cotton Hoodie", categories[1].id, Decimal("65.00"), Decimal("22.00"), 150),
        ("SKU-HOME-001", "Ergonomic Office Chair", categories[2].id, Decimal("249.99"), Decimal("110.00"), 30),
        ("SKU-HOME-002", "Stainless Steel Coffee Maker", categories[2].id, Decimal("89.99"), Decimal("35.00"), 95),
        ("SKU-BEAU-001", "Hydrating Facial Serum 50ml", categories[3].id, Decimal("45.00"), Decimal("12.00"), 300),
    ]
    products = []
    for sku, name, cat_id, price, cost, stock in products_data:
        p = Product(
            id=uuid.uuid4(),
            organization_id=demo_org.id,
            sku=sku,
            name=name,
            category_id=cat_id,
            unit_price=price,
            cost_price=cost,
            stock_quantity=stock,
        )
        session.add(p)
        products.append(p)
    await session.flush()

    # 7. Create Customers
    customers_data = [
        ("CUST-1001", "Alice Vance", "alice@example.com", CustomerSegment.VIP, regions[0].id),
        ("CUST-1002", "Bob Smith", "bob@example.com", CustomerSegment.REGULAR, regions[1].id),
        ("CUST-1003", "Charlie Brown", "charlie@example.com", CustomerSegment.REGULAR, regions[2].id),
        ("CUST-1004", "Diana Prince", "diana@example.com", CustomerSegment.VIP, regions[0].id),
        ("CUST-1005", "Evan Wright", "evan@example.com", CustomerSegment.NEW, regions[3].id),
    ]
    customers = []
    for ext_id, name, email, segment, reg_id in customers_data:
        c = Customer(
            id=uuid.uuid4(),
            organization_id=demo_org.id,
            external_id=ext_id,
            name=name,
            email=email,
            segment=segment,
            region_id=reg_id,
            first_purchase_at=datetime.now(timezone.utc) - timedelta(days=90),
        )
        session.add(c)
        customers.append(c)
    await session.flush()

    # 8. Create Orders & Order Items & Transactions
    today = date.today()
    orders_count = 0
    items_count = 0
    tx_count = 0

    for i in range(1, 15):
        cust = random.choice(customers)
        order_date = today - timedelta(days=random.randint(1, 60))
        prod1 = random.choice(products)
        prod2 = random.choice(products)

        qty1 = random.randint(1, 3)
        line1 = prod1.unit_price * qty1
        qty2 = random.randint(1, 2)
        line2 = prod2.unit_price * qty2

        subtotal = line1 + line2
        tax = (subtotal * Decimal("0.08")).quantize(Decimal("0.01"))
        total = subtotal + tax

        ord_obj = Order(
            id=uuid.uuid4(),
            organization_id=demo_org.id,
            order_number=f"ORD-2026-{1000 + i}",
            customer_id=cust.id,
            status=OrderStatus.DELIVERED if i % 4 != 0 else OrderStatus.SHIPPED,
            order_date=order_date,
            subtotal=subtotal,
            tax_amount=tax,
            total_amount=total,
        )
        session.add(ord_obj)
        orders_count += 1

        item1 = OrderItem(
            id=uuid.uuid4(),
            organization_id=demo_org.id,
            order_id=ord_obj.id,
            product_id=prod1.id,
            quantity=qty1,
            unit_price=prod1.unit_price,
            line_total=line1,
        )
        item2 = OrderItem(
            id=uuid.uuid4(),
            organization_id=demo_org.id,
            order_id=ord_obj.id,
            product_id=prod2.id,
            quantity=qty2,
            unit_price=prod2.unit_price,
            line_total=line2,
        )
        session.add_all([item1, item2])
        items_count += 2

        tx = Transaction(
            id=uuid.uuid4(),
            organization_id=demo_org.id,
            order_id=ord_obj.id,
            type=TransactionType.SALE,
            amount=total,
            payment_method="credit_card",
            reference=f"REF-{uuid.uuid4().hex[:8].upper()}",
            transaction_date=datetime.combine(order_date, datetime.min.time(), tzinfo=timezone.utc),
        )
        session.add(tx)
        tx_count += 1

    # 9. Create Market Symbols (Shared)
    symbols_data = [
        ("AAPL", "Apple Inc.", "NASDAQ", "equity", "Technology", "Consumer Electronics"),
        ("MSFT", "Microsoft Corp.", "NASDAQ", "equity", "Technology", "Software"),
        ("BTC-USD", "Bitcoin USD", "CRYPTO", "crypto", "Digital Assets", "Cryptocurrency"),
        ("SPY", "SPDR S&P 500 ETF Trust", "NYSE", "equity", "Financials", "ETF"),
    ]
    for ticker, name, exch, asset_cls, sec, ind in symbols_data:
        sym_stmt = select(Symbol).where(Symbol.ticker == ticker)
        sym_res = await session.execute(sym_stmt)
        if not sym_res.scalar_one_or_none():
            sym = Symbol(
                id=uuid.uuid4(),
                ticker=ticker,
                name=name,
                exchange=exch,
                asset_class=asset_cls,
                sector=sec,
                industry=ind,
            )
            session.add(sym)

    # 10. Create Strategies & Alerts
    strat1 = Strategy(
        id=uuid.uuid4(),
        organization_id=demo_org.id,
        name="SMA Crossover Strategy",
        description="Dual moving average crossover strategy (50/200 period)",
        strategy_type="sma_cross",
        parameters={"fast_period": 50, "slow_period": 200},
        status=StrategyStatus.ACTIVE,
        created_by=owner_user_id,
    )
    strat2 = Strategy(
        id=uuid.uuid4(),
        organization_id=demo_org.id,
        name="RSI Mean Reversion",
        description="RSI oversold/overbought mean reversion strategy",
        strategy_type="rsi_mean_reversion",
        parameters={"rsi_period": 14, "oversold": 30, "overbought": 70},
        status=StrategyStatus.DRAFT,
        created_by=owner_user_id,
    )
    session.add_all([strat1, strat2])

    alert1 = Alert(
        id=uuid.uuid4(),
        organization_id=demo_org.id,
        title="Low Stock Warning: 4K Ultra HD Monitor",
        message="Stock quantity dropped below threshold (40 remaining).",
        severity=AlertSeverity.WARNING,
        status=AlertStatus.ACTIVE,
        source_module="retail",
    )
    alert2 = Alert(
        id=uuid.uuid4(),
        organization_id=demo_org.id,
        title="Revenue Trend Spike Detected",
        message="Monthly revenue increased by 24.5% compared to prior period.",
        severity=AlertSeverity.INFO,
        status=AlertStatus.ACTIVE,
        source_module="analytics",
    )
    session.add_all([alert1, alert2])

    await session.commit()

    return {
        "status": "success",
        "org_id": str(demo_org.id),
        "org_name": demo_org.name,
        "categories_count": len(categories),
        "products_count": len(products),
        "customers_count": len(customers),
        "orders_count": orders_count,
        "items_count": items_count,
        "transactions_count": tx_count,
    }
