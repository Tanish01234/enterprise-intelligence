# Enterprise Intelligence Platform

Unified analytics & AI assistant platform combining Backtesting, DataMart Analytics, and Retail Intelligence.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation.

## Quick Start

### Prerequisites

- Node.js 20+ (using pnpm)
- Python 3.11+
- Docker & Docker Compose
- Supabase account (or local PostgreSQL)

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
# Required: DATABASE_URL, JWT_SECRET, OPENAI_API_KEY (or ANTHROPIC_API_KEY)
```

### Start Infrastructure

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Verify services are healthy
docker-compose ps
```

### Backend (FastAPI)

```bash
cd apps/api

# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --port 8000
```

### Frontend (Next.js)

```bash
cd apps/web

# Copy environment template
cp .env.example .env.local
# Edit .env.local with your Supabase URL and Anon Key

# Install dependencies
pnpm install

# Run development server
pnpm dev
```

#### Frontend Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `NEXT_PUBLIC_API_URL` | Backend API URL (default: `http://localhost:8000`) |

#### Auth Routes

| Route | Purpose |
|-------|--------|
| `/login` | Sign in with email/password |
| `/signup` | Create a new account |
| `/dashboard` | Protected dashboard (requires auth) |
| `/auth/callback` | Supabase auth callback (email confirmation, OAuth) |

### Shared Package

```bash
cd packages/shared
pnpm install
pnpm build
```

## Project Structure

```
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # FastAPI backend
├── packages/
│   └── shared/       # Shared TypeScript types
├── docs/
│   └── ARCHITECTURE.md
├── scripts/
├── tests/
├── docker-compose.yml
├── .env.example
└── README.md
```

## Development Phases

| Phase | Focus | Status |
|-------|-------|--------|
| 0 | Foundation & Architecture | ✅ |
| 1 | Supabase Auth + Organizations | ✅ |
| 2 | Core Database Schema + Seed Data | ✅ |
| 3 | DataMart + Analytics | ✅ |
| 4 | Backtesting Engine | ⏳ |
| 5 | Retail Intelligence | ⏳ |
| 6 | AI Copilot + Tool Registry | ⏳ |
| 7 | Cross-Module Intelligence | ⏳ |
| 8 | Command Center | ⏳ |
| 9 | Testing + Security + Hardening | ⏳ |
| 10 | Demo Preparation | ⏳ |

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, ECharts
- **Backend**: FastAPI, Python 3.11+, SQLAlchemy, Pydantic
- **Database**: PostgreSQL (Supabase), DuckDB, Redis
- **Market Data**: Parquet + Polars
- **AI**: Abstracted LLM provider (OpenAI/Anthropic), Tool calling
- **Deployment**: Docker Compose

## Key Principles

1. **No Look-Ahead Bias** - Backtester enforces chronological execution structurally
2. **AI Tool-Only** - LLM never executes raw SQL; only typed application tools
3. **Org Isolation** - Row Level Security at database level
4. **Explainable AI** - Every response cites tools called and data returned
5. **Two Data Domains** - Business (org-scoped) vs Market (platform-shared) kept separate

## License

MIT