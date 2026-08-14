async def run_async_migrations() -> None:
    """In 'online' mode, create an AsyncEngine and associate a connection with context."""
    configuration = config.get_section(config.config_ini_section, {})
    
    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        connect_args={"statement_cache_size": 0},  # Required for Supabase PgBouncer
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()