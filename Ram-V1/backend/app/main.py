from contextlib import asynccontextmanager
import logging
import time
import uuid
import os
from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy import select, text

from app.api.router import api_router
from app.core.config import settings
from app.core.logging import setup_logging, request_id_ctx
from app.db.models.organization import Organization
from app.db.session import AsyncSessionLocal

# Initialize structured JSON telemetry
setup_logging()
logger = logging.getLogger("finos.core")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing FinOS Enterprise Core Gateway...")
    try:
        async with AsyncSessionLocal() as db:
            # Automated Zero-Drift Production Schema Sync
            schema_statements = [
                "CREATE TABLE IF NOT EXISTS audit_logs (id UUID PRIMARY KEY, organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, user_id UUID REFERENCES users(id) ON DELETE SET NULL, event_type VARCHAR(100) NOT NULL, description VARCHAR(1000) NOT NULL, metadata_payload JSONB DEFAULT '{}'::jsonb, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL)",
                "CREATE INDEX IF NOT EXISTS ix_audit_logs_org_id ON audit_logs (organization_id)",

                "ALTER TABLE upload_batches ADD COLUMN IF NOT EXISTS file_checksum_sha256 VARCHAR(64)",
                "ALTER TABLE upload_batches ADD COLUMN IF NOT EXISTS calculation_version VARCHAR(50) DEFAULT 'v1.0-deterministic'",
                "ALTER TABLE upload_batches ADD COLUMN IF NOT EXISTS error_message VARCHAR(1000)",
                "ALTER TABLE organizations ADD COLUMN IF NOT EXISTS active_batch_id VARCHAR(36)",
                "ALTER TABLE organizations ADD COLUMN IF NOT EXISTS industry_type VARCHAR(50) DEFAULT 'GENERAL_SMB'",
                "ALTER TABLE organizations ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD'",
                "ALTER TABLE organizations ADD COLUMN IF NOT EXISTS fiscal_year_start INTEGER DEFAULT 1",
                "ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE",
                "ALTER TABLE users ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP",
                "ALTER TABLE users ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP",
                "ALTER TABLE upload_batches ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP",
                "ALTER TABLE upload_batches ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP",
                "ALTER TABLE organizations ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP",
                "ALTER TABLE organizations ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP",
                "ALTER TABLE journal_entries ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP"
            ]
            for stmt in schema_statements:
                await db.execute(text(stmt))
            await db.commit()
            logger.info("FinOS Enterprise Schema self-healing verified.")

            # Seed default master enterprise tenant if not exists
            org_id = uuid.UUID("11111111-1111-1111-1111-111111111111")
            stmt = select(Organization).where(Organization.id == org_id)
            res = await db.execute(stmt)
            if not res.scalar_one_or_none():
                db.add(
                    Organization(
                        id=org_id,
                        name="FinOS Global Enterprises",
                        slug="finos-global",
                        industry_type="TECHNOLOGY",
                        currency="USD",
                        fiscal_year_start=1,
                        is_active=True,
                    )
                )
                await db.commit()
                logger.info("FinOS master enterprise tenant verified.")
    except Exception as err:
        logger.error(f"Lifespan startup warning: {err}", exc_info=True)
    yield
    logger.info("Shutting down FinOS Enterprise Core Gateway...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Engineered Financial Operating System API",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# 1. Structured Telemetry & Tracing Middleware
@app.middleware("http")
async def telemetry_middleware(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    request_id_ctx.set(req_id)
    
    start_time = time.time()
    response: Response = await call_next(request)
    duration_ms = round((time.time() - start_time) * 1000, 2)
    
    response.headers["X-Request-ID"] = req_id
    response.headers["X-Process-Time-Ms"] = str(duration_ms)
    
    logger.info(
        f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms)"
    )
    return response

# 2. Hardened Production CORS (Single Authority)
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://finos-frontend-ui.onrender.com",
    "https://finos-ram.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.onrender\.com|https://.*\.vercel\.app|http://localhost:3000",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "Content-Disposition"],
)

# 3. Global Exception Handlers (Ensuring CORS & Correlation IDs on Errors)
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    req_id = request_id_ctx.get()
    return JSONResponse(
        status_code=exc.status_code,
        headers=getattr(exc, "headers", None),
        content={
            "success": False,
            "data": None,
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": exc.detail,
            },
            "request_id": req_id,
        },
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    req_id = request_id_ctx.get()
    origin = request.headers.get("origin", "")
    headers = {}
    if origin in ALLOWED_ORIGINS or ".onrender.com" in origin or "localhost" in origin:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        headers=headers,
        content={
            "success": False,
            "data": None,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An internal error occurred during ledger transaction.",
            },
            "request_id": req_id,
        },
    )

# 4. Root Redirect to Interactive Documentation
@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")

# 5. Probes: Liveness & Deep PostgreSQL 16 Readiness
@app.get("/healthz", status_code=status.HTTP_200_OK, tags=["SRE Health Probes"])
async def liveness_probe():
    return {"status": "alive", "project": settings.PROJECT_NAME}

@app.get("/readyz", tags=["SRE Health Probes"])
async def readiness_probe():
    start_time = time.time()
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1;"))
        latency_ms = round((time.time() - start_time) * 1000, 2)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": "ready",
                "database": "connected",
                "engine": "PostgreSQL 16",
                "latency_ms": latency_ms,
            },
        )
    except Exception as exc:
        logger.error(f"Readiness check failed: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "not_ready",
                "database": "disconnected",
                "error": str(exc),
            },
        )

app.include_router(api_router, prefix=settings.API_V1_STR)
