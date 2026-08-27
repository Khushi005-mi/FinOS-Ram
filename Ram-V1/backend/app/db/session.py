from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

# 1. Global Singleton Engine configured for Supabase PgBouncer (statement_cache_size = 0)
engine: AsyncEngine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    connect_args={"statement_cache_size": 0},  # Required for Supabase PgBouncer Pooler
)

# 2. Async Session Factory
AsyncSessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


# 3. FastAPI Database Session Dependency
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Async Generator dependency providing database sessions to API routes.
    Guarantees that database sessions are cleanly closed after request completion.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()