from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from typing import AsyncGenerator
import duckdb
from contextlib import asynccontextmanager

from app.core.config import settings

# PostgreSQL Engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,
)

# Async Session Factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base Model
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting async database sessions."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# DuckDB Connection
class DuckDBConnection:
    """DuckDB connection manager for analytics."""
    
    def __init__(self):
        self.conn = None
    
    def connect(self):
        """Create DuckDB connection."""
        if not self.conn:
            self.conn = duckdb.connect(settings.DUCKDB_PATH)
            # Configure DuckDB for performance
            self.conn.execute("SET threads TO 4")
            self.conn.execute("SET memory_limit='2GB'")
        return self.conn
    
    def close(self):
        """Close DuckDB connection."""
        if self.conn:
            self.conn.close()
            self.conn = None
    
    def execute(self, query: str, params=None):
        """Execute query."""
        conn = self.connect()
        if params:
            return conn.execute(query, params)
        return conn.execute(query)
    
    def fetch_df(self, query: str, params=None):
        """Execute query and return pandas DataFrame."""
        result = self.execute(query, params)
        return result.df()


# Global DuckDB instance
duckdb_conn = DuckDBConnection()


def get_duckdb():
    """Dependency for getting DuckDB connection."""
    return duckdb_conn


async def init_db():
    """Initialize database."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Close database connections."""
    await engine.dispose()
    duckdb_conn.close()
