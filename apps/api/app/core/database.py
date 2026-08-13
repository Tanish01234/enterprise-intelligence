from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.core.base import Base  # noqa: F401 – re-exported for convenience


from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import JSONB


@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "JSON"


# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.APP_ENV == "development",
    poolclass=NullPool if settings.APP_ENV == "test" else None,
    pool_pre_ping=True,
)

# Session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_session() -> AsyncSession:
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database - create tables if they don't exist."""
    # Import models so their tables are registered with Base.metadata
    _import_models()
    async with engine.begin() as conn:
        if "sqlite" in settings.DATABASE_URL:
            from sqlalchemy import text
            await conn.execute(text("ATTACH DATABASE ':memory:' AS auth;"))
            await conn.execute(text("ATTACH DATABASE ':memory:' AS public;"))
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Close database connections."""
    await engine.dispose()


def _import_models() -> None:
    """Import all model modules to register them with Base.metadata.
    Called lazily to avoid circular imports at module load time.
    """
    import app.modules.auth.models  # noqa: F401
    import app.modules.datamart.models  # noqa: F401
    import app.modules.backtesting.models  # noqa: F401
    import app.modules.copilot.models  # noqa: F401


# Dependency for FastAPI routes
from typing import Annotated
from fastapi import Depends

SessionDep = Annotated[AsyncSession, Depends(get_session)]