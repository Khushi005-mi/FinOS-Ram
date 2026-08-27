from contextlib import asynccontextmanager
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
    """
    Application Lifespan Event Handler.
    Runs startup logic on boot: auto-creates missing SQL tables and auto-seeds default organization.
    """
    print(f"🚀 Starting {settings.PROJECT_NAME} (v{settings.VERSION})...")
    print(f"🔧 Environment: {settings.ENVIRONMENT} | Debug: {settings.DEBUG}")

    # 1. Auto-create all missing SQL tables on boot
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✓ Database tables verified and ready!")

        # 2. Auto-seed default tenant organization if missing
        async with AsyncSessionLocal() as db:
            org_id = "00000000-0000-0000-0000-000000000001"
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

    yield  # Server handles HTTP requests here

    print(f"🛑 Shutting down {settings.PROJECT_NAME} cleanly...")


# 1. Instantiate FastAPI Application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Engineered Financial Operating System API for Automated Analysis and Decision Guidance",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan,
)

# 2. Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Mount Router Registry (/api/v1)
app.include_router(api_router, prefix=settings.API_V1_STR)


# 4. System Health Check Endpoint
@app.get(
    "/health",
    status_code=status.HTTP_200_OK,
    tags=["System Health"],
    summary="System Health & Status Verification Check",
)
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


# 5. Root Welcome Endpoint
@app.get(
    "/",
    status_code=status.HTTP_200_OK,
    tags=["Root"],
    include_in_schema=False,
)
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API Engine",
        "documentation": "/docs" if settings.DEBUG else "Disabled in Production",
    }