from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # App
    APP_ENV: str = "development"
    LOG_LEVEL: str = "debug"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000

    # Database
    DATABASE_URL: str
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "enterprise_intelligence"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Supabase
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str

    # Auth
    JWT_SECRET: str
    JWT_EXPIRY: int = 3600
    JWT_ALGORITHM: str = "HS256"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # AI
    LLM_PROVIDER: str = "openai"
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-3-haiku-20240307"

    # Market Data
    MARKET_DATA_PATH: str = "/data/market"

    # Feature Flags
    ENABLE_BACKTESTING: bool = True
    ENABLE_AI_COPILOT: bool = True
    ENABLE_RETAIL_INTEL: bool = True
    ENABLE_ALERTS: bool = False
    ENABLE_FORECASTING: bool = False

    # Demo
    DEMO_ORG_NAME: str = "Demo Retail Co."
    DEMO_ORG_SLUG: str = "demo-retail-co"
    SEED_DATA_ENABLED: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()