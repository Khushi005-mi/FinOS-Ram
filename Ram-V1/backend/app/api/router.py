from fastapi import APIRouter

from app.api.v1.analytics import router as analytics_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.ingestion import router as ingestion_router
from app.api.v1.organization import router as organization_router
from app.api.v1.reports import router as reports_router

api_router = APIRouter()

api_router.include_router(ingestion_router)
api_router.include_router(dashboard_router)
api_router.include_router(reports_router)
api_router.include_router(analytics_router)
api_router.include_router(organization_router)