# Enterprise Intelligence Platform - Architecture Document

## 1. Product Vision

**DATA → INTELLIGENCE → DECISION → ACTION**

A unified enterprise intelligence platform combining three mandatory capabilities:
1. **Backtesting** - Trustworthy, event-driven strategy validation
2. **DataMart Analytics** - Business data ingestion, validation, and KPI generation
3. **Retail AI Assistant** - Structured product intelligence and recommendations

All connected through a shared **Intelligence Layer (AI Copilot)** that operates on actual system data, not guesses.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │ Command     │ │ DataMart    │ │ Strategy    │ │ Retail    │ │
│  │ Center      │ │ Analytics   │ │ Lab         │ │ Intel     │ │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └─────┬────┘ │
│         │               │               │             │      │
│         └───────────────┼───────────────┼─────────────┘      │
│                         ▼               ▼                    │
│              ┌─────────────────────────────────┐             │
│              │      AI COPILOT (Persistent)    │             │
│              │  ┌─────────────────────────┐   │             │
│              │  │ Tool Registry           │   │             │
│              │  │ • query_kpis            │   │             │
│              │  │ • analyze_trend         │   │             │
│              │  │ • get_product_perf      │   │             │
│              │  │ • recommend_products    │   │             │
│              │  │ • explain_backtest      │   │             │
│              │  └─────────────────────────┘   │             │
│              └──────────────┬────────────────┘             │
└─────────────────────────────┼──────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND (FastAPI)                        │
│  ┌──────────┐ ┌────────────┐ ┌───────────┐ ┌────────────────┐  │
│  │ Auth/Org │ │ DataMart   │ │Analytics  │ │ Backtesting    │  │
│  │ Service  │ │ Service    │ │ Service   │ │ Engine         │  │
│  └────┬─────┘ └─────┬──────┘ └─────┬────┘ └───────┬────────┘  │
│       │             │             │             │            │
│       │      ┌──────┴──────┐       │      ┌──────┴──────┐    │
│       │      │  DuckDB +   │       │      │  Event-Driven│    │
│       │      │  Polars     │       │      │  Engine      │    │
│       │      └─────────────┘       │      └─────────────┘    │
│       │             │             │             │            │
│       └─────────────┼─────────────┼─────────────┘            │
│                     ▼             ▼                          │
│         ┌─────────────────────────────────┐                  │
│         │      AI COPILOT SERVICE         │                  │
│         │  • LLM Abstraction              │                  │
│         │  • Tool Execution               │                  │
│         │  • Context Management           │                  │
│         │  • Observability/Logging        │                  │
│         └──────────────┬──────────────────┘                  │
└───────────────────────┼──────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌───────────────┐ ┌───────────┐ ┌───────────────┐
│  PostgreSQL   │ │  Parquet  │ │  Redis        │
│  (Supabase)   │ │  (Market  │ │  (Cache/      │
│  - Users      │ │   Data)   │ │   Sessions)   │
│  - Orgs       │ │           │ │               │
│  - Business   │ │           │ │               │
│  - Strategies │ │           │ │               │
│  - Backtests  │ │           │ │               │
└───────────────┘ └───────────┘ └───────────────┘
```

---

## 3. Module Boundaries

### Backend Modules (`apps/api/`)

| Module | Responsibility | Data Domain |
|--------|---------------|-------------|
| `auth/` | Supabase Auth integration, JWT validation, session management | Platform |
| `organizations/` | Org CRUD, membership, RBAC, org-scoped context | Platform |
| `datamart/` | CSV ingestion, schema validation, type coercion, DuckDB analytics | Business |
| `analytics/` | KPI computation, trend analysis, aggregations, business insights | Business |
| `backtesting/` | Event-driven engine, strategies, metrics, look-ahead prevention | Market |
| `retail/` | Product catalog, recommendations, product intelligence | Business |
| `copilot/` | LLM abstraction, tool registry, tool execution, context injection | Intelligence |
| `shared/` | Common utilities, database clients, error handling, logging | Platform |

### Frontend Modules (`apps/web/`)

| Module | Responsibility |
|--------|---------------|
| `command-center/` | Executive dashboard, health scores, cross-module alerts |
| `datamart/` | Data ingestion UI, schema mapping, validation results |
| `analytics/` | KPI dashboards, trend charts, drill-downs, filters |
| `strategy-lab/` | Strategy builder, backtest runner, results visualization |
| `retail/` | Product browser, recommendations, comparison tools |
| `copilot/` | Persistent AI sidebar, tool call visualization, evidence panel |
| `shared/` | UI components, hooks, types, auth context, query client |

### Shared Package (`packages/shared/`)

- TypeScript ↔ Python type definitions (via OpenAPI/codegen)
- Shared constants, enums, validation schemas
- Utility functions (date formatting, currency, etc.)

---

## 4. Data Boundaries

### Business Domain (Organization-Scoped)
- **Tables**: `customers`, `products`, `orders`, `transactions`, `categories`, `regions`
- **Access**: Row Level Security (RLS) on `organization_id`
- **Isolation**: Strict - org A cannot see org B's data
- **Storage**: PostgreSQL (Supabase) - source of truth

### Market Domain (Platform-Shared)
- **Data**: OHLCV bars, symbols, exchanges, timeframes
- **Access**: Read-only for all authenticated users
- **Isolation**: None - shared reference data
- **Storage**: Parquet files + PostgreSQL metadata

### Intelligence Domain (Organization-Scoped)
- **Tables**: `strategies`, `backtest_runs`, `backtest_results`, `alerts`, `ai_conversations`
- **Access**: RLS on `organization_id` (strategies/runs belong to org)
- **Storage**: PostgreSQL (Supabase)

### Cross-Domain Rules
- Market data NEVER mixed with business data in same tables
- AI tools receive `organization_id` from context, never from user input
- Backtesting uses market data + org-scoped strategy configs

---

## 5. AI Boundaries

### AI Copilot Architecture

```
User Query
    │
    ▼
┌─────────────────┐
│  Context Builder │ ← Current module, org_id, user_id, recent history
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  LLM (Provider)  │ ← Abstracted: OpenAI/Anthropic/local
│  + Tool Defs     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Tool Registry   │ ← Typed tools only, validated params
│  • query_kpis    │
│  • analyze_trend │
│  • get_product_performance
│  • recommend_products
│  • explain_backtest
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Tool Executor   │ ← Calls actual service layer, returns structured data
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Evidence Logger │ ← Logs: tool, params, result, latency
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  LLM Explainer   │ ← Generates response with citations
└────────┬────────┘
         │
         ▼
   User Response
```

### AI Safety Rules
1. **No raw SQL** - Only typed tool functions
2. **Org-scoped** - Every tool receives `organization_id` from authenticated context
3. **Validated params** - Zod/Pydantic schemas on all tool inputs
4. **Observability** - All tool calls logged with timing, success/failure
5. **Explainability** - Response includes: tools called, data returned, reasoning
6. **Context-aware** - Tool availability filtered by current module/page

### MVP Tool Definitions

| Tool | Purpose | Parameters | Returns |
|------|---------|------------|---------|
| `query_kpis` | Get KPI values | `metrics: string[]`, `filters: FilterSpec`, `granularity: string` | `{ metric: value, timestamp }[]` |
| `analyze_trend` | Trend analysis | `metric: string`, `period: string`, `comparison: string` | `{ trend, change_pct, drivers }` |
| `get_product_performance` | Product-level metrics | `product_ids?: string[]`, `category?: string`, `filters` | Product performance rows |
| `recommend_products` | Budget-based recs | `budget: number`, `category?: string`, `context?: string` | Ranked product list with reasons |
| `explain_backtest` | Backtest explanation | `run_id: string`, `focus?: string` | Narrative + key metrics + trade samples |

---

## 6. Authentication & Organization Model

### User Model
```
User (Supabase Auth)
  ├── id: UUID
  ├── email: string
  ├── created_at: timestamp
  └── metadata: { full_name, avatar_url }
```

### Organization Model
```
Organization
  ├── id: UUID
  ├── name: string
  ├── slug: string (unique)
  ├── created_at: timestamp
  ├── settings: JSONB (timezone, currency, fiscal_year_start)
  └── owner_id: UUID (FK → User)
```

### Membership Model
```
OrganizationMember
  ├── id: UUID
  ├── organization_id: UUID (FK)
  ├── user_id: UUID (FK)
  ├── role: enum (owner, admin, analyst, viewer)
  ├── joined_at: timestamp
  └── invited_by: UUID (FK → User)
```

### RLS Policy Pattern
```sql
-- All business tables have organization_id
ALTER TABLE business_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON business_table
  FOR ALL USING (
    organization_id = current_setting('app.current_org_id')::uuid
  );

-- Set via middleware on each request
SET LOCAL app.current_org_id = 'org-uuid-from-session';
```

### Context Propagation
1. User logs in → Supabase session
2. User selects/creates organization → `organization_id` stored in session/cookie
3. Every API request → middleware extracts `org_id`, sets Postgres session variable
4. AI tools → receive `org_id` from request context, pass to service layer
5. Database queries → RLS enforces isolation automatically

---

## 7. Technology Choices

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend Framework** | Next.js 14+ (App Router) | SSR, RSC, excellent DX, Vercel deployment |
| **Language** | TypeScript (strict) | Type safety across stack |
| **Styling** | Tailwind CSS + shadcn/ui | Consistent design system, dark mode, accessible |
| **Charts** | Apache ECharts | Powerful, performant, enterprise-grade |
| **State** | TanStack Query + Zustand | Server state + minimal client state |
| **Animation** | Framer Motion | Subtle, professional motion |
| **Backend Framework** | FastAPI | Async, OpenAPI auto-gen, Pydantic validation |
| **Language** | Python 3.11+ | Data science ecosystem, type hints |
| **Database** | PostgreSQL (Supabase) | Managed, Auth, RLS, Realtime, pgvector |
| **Analytics Engine** | DuckDB + Polars | In-process OLAP, zero-copy, fast aggregations |
| **Market Data** | Parquet + Polars | Columnar, compressed, fast scans |
| **Backtesting** | Custom event-driven (NumPy/Polars) | Full control, look-ahead prevention, deterministic |
| **AI Provider** | Abstracted (OpenAI/Anthropic) | Swappable, cost control, local fallback |
| **Caching** | Redis | Sessions, rate limits, query cache |
| **Deployment** | Docker Compose (dev), Kubernetes (prod) | Reproducible, portable |
| **Testing** | Pytest + Playwright | Unit, integration, E2E |

---

## 8. Implementation Phases

### Phase 0: Foundation (Complete ✅)
- [x] Project structure & monorepo setup
- [x] `docs/ARCHITECTURE.md` ✓
- [x] Docker Compose (Postgres, Redis)
- [x] Shared package with types
- [x] Environment configuration

### Phase 1: Supabase Auth + Organizations (Complete ✅)
- [x] Supabase project setup
- [x] Auth integration (signup, login, session)
- [x] Organization CRUD + membership
- [x] RLS policies on all business tables
- [x] Middleware for org context propagation
- [x] Frontend auth context + protected shell
- [x] Organization selection UI
- [x] Auth & org isolation tests

### Phase 2: Core Database Schema + Seed Data (Complete ✅)
- [x] Business domain tables (customers, products, orders, transactions, categories, regions)
- [x] Market domain tables (symbols, ohlcv metadata)
- [x] Intelligence tables (strategies, backtest_runs, alerts, ai_conversations)
- [x] Demo organization with realistic seed data generator
- [x] Migrations via Alembic (002_core_schema.py)

### Phase 3: DataMart + Analytics (Complete ✅)
- [x] CSV ingestion API with validation & delimiter detection
- [x] Column schema mapping UI & wizard
- [x] In-memory DuckDB OLAP analytics engine
- [x] Executive KPI dashboard with ECharts visualizations
- [x] Organization-scoped multi-tenant data security API
- [x] Analytics dashboard with ECharts

### Phase 4: Backtesting Engine
- [ ] Event-driven engine core (chronological, no look-ahead)
- [ ] Bar data loader (Parquet → Polars)
- [ ] Strategy interface + 2 built-in strategies (SMA Cross, RSI Mean Reversion)
- [ ] Commission + slippage models
- [ ] Position + cash tracking
- [ ] Metrics: Return, Sharpe, MaxDD, Win Rate, Trade Count
- [ ] Deterministic test suite proving no look-ahead

### Phase 5: Retail Intelligence
- [ ] Product catalog API
- [ ] Recommendation engine (budget + category + performance)
- [ ] Product comparison tool
- [ ] Retail UI with product browser

### Phase 6: AI Copilot + Tool Registry
- [ ] LLM abstraction layer
- [ ] Tool registry with typed definitions
- [ ] Tool executor with validation
- [ ] Evidence logging
- [ ] Persistent sidebar UI
- [ ] Context injection per module

### Phase 7: Cross-Module Intelligence
- [ ] Alert system (threshold + anomaly)
- [ ] Business health score
- [ ] Command Center dashboard
- [ ] AI cross-module investigation flow

### Phase 8: Command Center Polish
- [ ] Executive dashboard
- [ ] Real-time updates
- [ ] Loading/error/empty states
- [ ] Responsive design

### Phase 9: Testing + Security + Hardening
- [ ] Unit tests (backend >80%, critical paths 100%)
- [ ] Integration tests (API, DB, Auth)
- [ ] E2E tests (Playwright critical flows)
- [ ] Security audit (RLS, input validation, secrets)
- [ ] Performance benchmarks

### Phase 10: Demo Preparation
- [ ] Demo script + data
- [ ] Recording/rehearsal
- [ ] Deployment to preview
- [ ] Documentation

---

## 9. Key Architectural Decisions (ADRs)

### ADR-001: Separate Business vs Market Data Domains
**Decision**: Keep business and market data in separate tables/schemas with different access patterns.
**Rationale**: Different update frequencies, query patterns, and isolation requirements. Forcing unification creates complexity.

### ADR-002: Custom Event-Driven Backtester
**Decision**: Build custom engine rather than use backtrader/zipline.
**Rationale**: Full control over look-ahead prevention, deterministic execution, and transparency for judging.

### ADR-003: AI Tool-Only Architecture
**Decision**: LLM never executes raw SQL; only calls typed application tools.
**Rationale**: Security (no injection), observability, explainability, org isolation enforcement.

### ADR-004: DuckDB for Analytics
**Decision**: Use DuckDB + Polars for analytical queries, PostgreSQL for OLTP.
**Rationale**: PostgreSQL not optimized for OLAP; DuckDB runs in-process, zero-copy with Polars, supports Parquet.

### ADR-005: Organization Context via RLS + Session Variables
**Decision**: Use PostgreSQL RLS with `SET LOCAL app.current_org_id`.
**Rationale**: Enforcement at database level (cannot be bypassed), minimal application code, works with connection pooling.

### ADR-006: Parquet for Market Data
**Decision**: Store OHLCV in partitioned Parquet files.
**Rationale**: Columnar compression, fast scans, Polars/DuckDB native support, cost-effective for large historical data.

---

## 10. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Look-ahead bias in backtesting | Structural prevention (engine only passes `t` data to strategy), deterministic tests |
| Cross-org data leakage | RLS at DB level + integration tests verifying isolation |
| AI hallucination | Tool-only architecture, evidence logging, citations in responses |
| Performance at scale | DuckDB for analytics, Parquet for market data, Redis caching |
| Supabase vendor lock-in | Standard PostgreSQL, minimal Supabase-specific features (Auth, RLS, Realtime only) |
| Scope creep | Strict phase gates, MVP scope defined, advanced features explicitly deferred |

---

## 11. File Structure Summary

```
/Users/tanisbedia/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/            # App Router pages
│   │   │   ├── components/     # Shared UI components
│   │   │   ├── features/       # Feature modules
│   │   │   ├── hooks/          # Custom hooks
│   │   │   ├── lib/            # Utilities, clients
│   │   │   └── types/          # TypeScript types
│   │   ├── package.json
│   │   └── tailwind.config.ts
│   │
│   └── api/                    # FastAPI backend
│       ├── app/
│       │   ├── api/            # API routes
│       │   ├── core/           # Config, security, database
│       │   ├── modules/        # Domain modules
│       │   │   ├── auth/
│       │   │   ├── organizations/
│       │   │   ├── datamart/
│       │   │   ├── analytics/
│       │   │   ├── backtesting/
│       │   │   ├── retail/
│       │   │   └── copilot/
│       │   ├── services/       # Shared services
│       │   └── main.py
│       ├── requirements.txt
│       └── pyproject.toml
│
├── packages/
│   └── shared/                 # Shared types, utilities
│       ├── types/
│       ├── constants/
│       └── utils/
│
├── docs/
│   └── ARCHITECTURE.md
│
├── scripts/                    # Dev/CI scripts
│
├── tests/                      # Shared test utilities
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

*Document Version: 1.1*  
*Created: Phase 0 - Foundation*  
*Updated: Phase 1 Completion*  
*Next Review: Phase 2 Completion*