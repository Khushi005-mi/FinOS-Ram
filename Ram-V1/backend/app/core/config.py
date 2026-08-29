from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    PROJECT_NAME: str = "FinOS Financial Operating System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "production"
    DEBUG: bool = False

    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "https://finos-ram.onrender.com",
        "https://finos-frontend-ui.onrender.com",
    ]
    CORS_ORIGIN_REGEX: str = r"https://.*\.onrender\.com"

    # PostgreSQL Database Connection URL (Asyncpg)
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres.ytdngeeuunkimldmjonu:Kahahailaptop@aws-0-ap-south-1.pooler.supabase.com:6543/postgres",
        env="DATABASE_URL",
    )

    # JWT Authentication Security
    SECRET_KEY: str = Field(
        default="SUPER_SECRET_PRODUCTION_KEY_FINOS_2026_CHANGE_IN_PROD_998877665544332211",
        env="SECRET_KEY",
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 Days


settings = Settings()
