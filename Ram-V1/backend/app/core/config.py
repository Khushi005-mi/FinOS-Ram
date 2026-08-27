import os 
from typing import List 
from pydantic_settings import BaseSettings
from pydantic import Field
class Settings(BaseSettings):
    """
    Type Safe environment variables validation for finos backend."""
    PROJECT_NAME: str = "FinOS Financial Operating System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment mode
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=True, env="DEBUG")

    # Security & CORS
    SECRET_KEY: str = Field(
        default="09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7",
        env="SECRET_KEY",
    )
    SUPABASE_JWT_SECRET: str = Field(
        default="placeholder-jwt-secret-key-for-local-development",
        env="SUPABASE_JWT_SECRET",
    )
    
    # Allowed CORS Origins for Next.js Frontend
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "https://finos-ram.onrender.com",
        "https://finosv1-backend-api.onrender.com",
    ]

    # PostgreSQL Database Connection URL (Asyncpg)
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres.ytdngeeuunkimldmjonu:Kahahailaptop@aws-0-ap-south-1.pooler.supabase.com:6543/postgres",
        env="DATABASE_URL",
    )

    class Config:
        case_sensitive = True
        env_file = ".env"


# Singleton Settings Instance
settings = Settings()