from contextlib import asynccontextmanager
import uuid
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select

from app.api.router import api_router
from app.core.config import settings
from app.core.security import get_password_hash
from app.db.base import Base
from app.db.models.organization import Organization
from app.db.models.user import User
from app.db.session import AsyncSessionLocal, engine
import app.db.models


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"🚀 Starting {settings.PROJECT_NAME} (v{settings.VERSION})...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✓ Database tables verified and ready!")

        async with AsyncSessionLocal() as db:
            org_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
            
            # Seed Demo Org
            org = (await db.execute(select(Organization).where(Organization.id == org_id))).scalar_one_or_none()
            if not org:
                db.add(
                    Organization(
                        id=org_id,
                        name="Apex Manufacturing Ltd.",
                        slug="apex-manufacturing",
                        industry_type="MANUFACTURING",
                        currency="INR",
                        fiscal_year_start=4,
                        is_active=True,
                    )
                )
                await db.commit()

            # Seed Demo User with native bcrypt
            demo_email = "cfo@apexmanufacturing.com"
            user = (await db.execute(select(User).where(User.email == demo_email))).scalar_one_or_none()
            if not user:
                db.add(
                    User(
                        id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
                        organization_id=org_id,
                        email=demo_email,
                        hashed_password=get_password_hash("admin123"),
                        full_name="Executive CFO",
                        role="OWNER",
                        is_active=True,
                    )
                )
                await db.commit()
                print("✓ Auto-seeded Demo User (cfo@apexmanufacturing.com / admin123)!")

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

ALLOWED_ORIGINS = [
    "https://finos-frontend-ui.onrender.com",
    "https://finos-ram.onrender.com",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", status_code=status.HTTP_200_OK, tags=["System Health"])
async def health_check():
    return JSONResponse(
        status_code=200,
        content={"status": "healthy", "project": settings.PROJECT_NAME},
    )


@app.get("/", status_code=status.HTTP_200_OK, include_in_schema=False)
async def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} API Engine"}
