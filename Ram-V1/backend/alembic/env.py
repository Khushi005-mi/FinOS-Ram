import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.core.config import settings
from app.db.base import Base
# Import all ORM models so Base.metadata discovers all database tables!
import app.db.models  # noqa: F401

# Alembic Config Object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name:
    fileConfig(config.config_file_name)

# Set SQLAlchemy URL from our Pydantic Settings
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Set Target Metadata to our ORM Base
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (generates SQL script without DB connection)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        render_as_batch=True, # Supports SQLite alter table operations
    )
    with context.begin_transaction():
        context.run_migrations()

async def run_async_migrations() -> None:
    """In 'online' mode, create an AsyncEngine and associate a connection with context."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode using Async Engine."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()