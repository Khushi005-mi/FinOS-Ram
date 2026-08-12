from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application Lifespan Event Handler.
    Runs startup logic when the server boots, and cleanup logic when it shuts down.
    """
    print(f"🚀 Starting {settings.PROJECT_NAME} (v{settings.VERSION})...")
    print(f"🔧 Environment: {settings.ENVIRONMENT} | Debug: {settings.DEBUG}")

    yield  # Server runs and handles HTTP requests here

    print(f"🛑 Shutting down {settings.PROJECT_NAME} cleanly...")


# 1. Instantiate the FastAPI Application (Uvicorn looks for this variable named 'app')
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Engineered Financial Operating System API for Automated Analysis and Decision Guidance",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan,
)

# 2. Configure Cross-Origin Resource Sharing (CORS) Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Mount Centralized API Router Registry (/api/v1)
app.include_router(api_router, prefix=settings.API_V1_STR)


# 4. System Health Check Endpoint
@app.get(
    "/health",
    status_code=status.HTTP_200_OK,
    tags=["System Health"],
    summary="System Health & Status Verification Check",
)
async def health_check():
    """
    System Health Check Endpoint.
    Used by Render/AWS load balancers to verify the server is active and healthy.
    """
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