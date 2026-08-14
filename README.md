# 🚀 Synora - Enterprise Intelligence Platform

Modern enterprise SaaS platform for data analytics and AI-powered insights.

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL (optional, SQLite for local dev)

### 1. Install Dependencies

**Frontend:**
```bash
cd apps/web
npm install
```

**Backend:**
```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

**Frontend** (`apps/web/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

**Backend** (`apps/api/.env`):
```env
DATABASE_URL=sqlite:///./data/synora.db
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
GEMINI_API_KEY=your_gemini_key
```

### 3. Run Development Servers

**Terminal 1 - Backend:**
```bash
cd apps/api
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd apps/web
npm run dev
```

**Access:**
- Frontend: http://localhost:3001
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🎯 Features

### ✅ Enterprise Authentication (FULLY IMPLEMENTED)
- ✅ Real Supabase JWT authentication
- ✅ Complete signup/signin/signout flow
- ✅ Protected routes with middleware
- ✅ Token management (access + refresh)
- ✅ Organization setup
- ✅ Workspace management
- ✅ Multi-workspace support

**📖 See:** `AUTHENTICATION_IMPLEMENTATION.md` for complete details

### ✅ Dashboard & Analytics
- Real-time KPI cards
- Interactive charts
- Revenue tracking
- User activity monitoring

### ✅ AI-Powered
- Natural language queries
- Smart insights
- Data analysis
- Report generation

### ✅ Data Management
- Multiple data sources
- CSV/Excel upload
- Database connections
- Real-time processing

## 📂 Project Structure

```
synora/
├── apps/
│   ├── web/              # Next.js frontend
│   │   └── src/
│   │       ├── app/      # App router pages
│   │       ├── components/
│   │       └── lib/
│   │
│   └── api/              # FastAPI backend
│       └── app/
│           ├── api/      # API routes
│           ├── core/     # Config & database
│           ├── models/   # Database models
│           └── services/ # Business logic
│
├── packages/             # Shared packages
└── scripts/             # Utility scripts
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Recharts** - Data visualization

### Backend
- **FastAPI** - Python web framework
- **SQLAlchemy** - ORM
- **Alembic** - Database migrations
- **Supabase** - Authentication & storage
- **Google Gemini** - AI integration

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd apps/web
npm run build
vercel deploy
```

### Backend (Railway/Render)
```bash
cd apps/api
# Set environment variables in platform
# Deploy via Git or CLI
```

## 📱 User Flow

```
Landing Page
    ↓
Sign Up / Sign In
    ↓
Organization Setup
    ↓
Workspace Setup
    ↓
Dashboard
    ↓
Analytics / AI Queries / Reports
```

## 🔐 Authentication

Protected routes via middleware:
- Not authenticated → `/auth/signin`
- No organization → `/onboarding/organization`
- No workspace → `/onboarding/workspace`
- Authenticated → `/app/*` routes

## 📊 Key Pages

- `/` - Landing page
- `/auth/signin` - Sign in
- `/auth/signup` - Sign up
- `/app/dashboard` - Main dashboard
- `/app/analytics` - Analytics
- `/app/queries` - AI queries
- `/app/datasets` - Data sources
- `/app/reports` - Reports
- `/app/team` - Team management
- `/app/settings` - Settings

## 🎨 Design System

### Colors
- **Black:** #000000 (Primary)
- **Gray-50:** #FAFAFA (Background)
- **Gray-200:** #E5E5E5 (Borders)
- **Gray-600:** #737373 (Text secondary)

### Layout
- Sidebar: 256px (compact for laptops)
- Top navbar: 56px
- Content padding: 16-24px
- Responsive breakpoints: 768px, 1024px, 1440px

## 🧪 Testing

```bash
# Frontend
cd apps/web
npm run lint
npm run type-check

# Backend
cd apps/api
pytest
```

## 📝 API Endpoints

- `GET /health` - Health check
- `POST /api/v1/auth/signup` - User registration
- `POST /api/v1/auth/signin` - User login
- `GET /api/v1/users/me` - Current user
- `POST /api/v1/datasets/upload` - Upload dataset
- `POST /api/v1/ai/query` - AI query

See full API docs at `/docs` when backend is running.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- GitHub Issues: [Create issue]
- Email: support@synora.com
- Docs: [Documentation]

---

**Built with ❤️ for enterprise teams**

*Last updated: August 14, 2026*
