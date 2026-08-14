#!/usr/bin/env python3
"""Health check script for Synora API and all dependencies."""

import sys
import asyncio
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings
from app.core.database import engine, duckdb_engine
from app.core.supabase import supabase_client
from app.services.ai_service import ai_orchestrator
import httpx
import redis
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def check_postgresql():
    """Check PostgreSQL connection."""
    try:
        from sqlalchemy import text
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("✅ PostgreSQL: Connected")
        return True
    except Exception as e:
        logger.error(f"❌ PostgreSQL: Failed - {e}")
        return False


async def check_duckdb():
    """Check DuckDB connection."""
    try:
        duckdb_engine.execute("SELECT 1")
        logger.info("✅ DuckDB: Connected")
        return True
    except Exception as e:
        logger.error(f"❌ DuckDB: Failed - {e}")
        return False


async def check_redis():
    """Check Redis connection."""
    try:
        r = redis.from_url(settings.REDIS_URL)
        r.ping()
        logger.info("✅ Redis: Connected")
        return True
    except Exception as e:
        logger.error(f"❌ Redis: Failed - {e}")
        return False


async def check_supabase():
    """Check Supabase connection."""
    try:
        client = supabase_client.get_client()
        if client:
            logger.info("✅ Supabase: Connected")
            return True
        else:
            logger.warning("⚠️  Supabase: Client not initialized (check credentials)")
            return False
    except Exception as e:
        logger.error(f"❌ Supabase: Failed - {e}")
        return False


async def check_ai_providers():
    """Check AI provider configuration."""
    providers_status = []
    
    # Check Gemini
    if settings.GOOGLE_GEMINI_API_KEY:
        logger.info("✅ Google Gemini: Configured")
        providers_status.append(True)
    else:
        logger.warning("⚠️  Google Gemini: Not configured")
        providers_status.append(False)
    
    # Check Grok
    if settings.GROK_API_KEY:
        logger.info("✅ Grok: Configured")
        providers_status.append(True)
    else:
        logger.warning("⚠️  Grok: Not configured")
        providers_status.append(False)
    
    # Check OpenAI
    if settings.OPENAI_API_KEY:
        logger.info("✅ OpenAI: Configured (fallback)")
        providers_status.append(True)
    else:
        logger.warning("⚠️  OpenAI: Not configured")
    
    return any(providers_status)


async def check_api_server():
    """Check if API server is running."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"http://{settings.API_HOST}:{settings.API_PORT}/health")
            if response.status_code == 200:
                logger.info("✅ API Server: Running")
                return True
            else:
                logger.warning(f"⚠️  API Server: Returned status {response.status_code}")
                return False
    except Exception as e:
        logger.warning("⚠️  API Server: Not running (this is OK if starting for first time)")
        return False


async def main():
    """Run all health checks."""
    print("\n" + "="*60)
    print("🏥 SYNORA HEALTH CHECK")
    print("="*60 + "\n")
    
    print("📊 Environment Configuration:")
    print(f"  Environment: {settings.APP_ENV}")
    print(f"  API Port: {settings.API_PORT}")
    print(f"  Debug Mode: {settings.DEBUG}")
    print(f"  Database: {settings.DATABASE_URL[:50]}...")
    print(f"  Redis: {settings.REDIS_URL}")
    print(f"  DuckDB: {settings.DUCKDB_PATH}")
    print()
    
    print("🔍 Running Health Checks...\n")
    
    checks = {
        "PostgreSQL": await check_postgresql(),
        "DuckDB": await check_duckdb(),
        "Redis": await check_redis(),
        "Supabase": await check_supabase(),
        "AI Providers": await check_ai_providers(),
        "API Server": await check_api_server(),
    }
    
    print("\n" + "="*60)
    print("📈 HEALTH CHECK SUMMARY")
    print("="*60)
    
    passed = sum(1 for status in checks.values() if status)
    total = len(checks)
    
    for service, status in checks.items():
        icon = "✅" if status else "❌"
        print(f"  {icon} {service}")
    
    print(f"\n  Score: {passed}/{total} services operational")
    
    if passed == total:
        print("\n  🎉 All systems operational!")
        print("="*60 + "\n")
        return 0
    else:
        print("\n  ⚠️  Some services need attention")
        print("="*60 + "\n")
        return 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
