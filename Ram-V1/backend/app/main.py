from contextlib import asynccontextmanager
import uuid
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select

from app.api.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.models.organization import Organization
from app.db.session import AsyncSessionLocal, engine
import app.db.models  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"🚀 Starting {settings.PROJECT_NAME} (v{settings.VERSION})...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✓ Database tables verified and ready!")

        async with AsyncSessionLocal() as db:
            org_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
            stmt = select(Organization).where(Organization.id == org_id)
            result = await db.execute(stmt)
            if not result.scalar_one_or_none():
                demo_org = Organization(
                    id=org_id,
                    name="Apex Manufacturing Ltd.",
                    slug="apex-manufacturing",
                    industry_type="MANUFACTURING",
                    currency="INR",
                    fiscal_year_start=4,
                    is_active=True,
                )
                db.add(demo_org)
                await db.commit()
                print("✓ Auto-seeded Demo Organization in database!")
    except Exception as err:
        print(f"⚠️ Lifespan DB init warning: {err}")

    yield
    print(f"🛑 Shutting down {settings.PROJECT_NAME} cleanly...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Engineered Financial Operating System API",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Robust CORS Configuration: Whitelist + *.onrender.com Regex
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", status_code=status.HTTP_200_OK, tags=["System Health"])
async def health_check():
    return JSONResponse(
        status_code=200,
        content={
            "status": "healthy",
            "project": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
        },
    )


@app.get("/", status_code=status.HTTP_200_OK, include_in_schema=False)
async def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} API Engine"}
