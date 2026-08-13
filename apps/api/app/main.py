from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import init_db, close_db
from app.modules.auth import auth_router
from app.modules.organizations import organizations_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    await close_db()


app = FastAPI(
    title="Enterprise Intelligence API",
    description="Unified analytics & AI assistant platform",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "0.1.0"}


@app.get("/api/v1/info")
async def api_info():
    return {
        "name": "Enterprise Intelligence API",
        "version": "0.1.0",
        "docs_url": "/docs",
    }


from app.modules.datamart.router import router as datamart_router
from app.modules.analytics.router import router as analytics_router


# Include routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(organizations_router, prefix="/api/v1/organizations", tags=["organizations"])
app.include_router(datamart_router, prefix="/api/v1", tags=["datamart"])
app.include_router(analytics_router, prefix="/api/v1", tags=["analytics"])