import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession
from app.main import app
from app.db.session import AsyncSessionLocal
from app.core.security import get_password_hash, create_access_token
from app.db.models.user import User
from app.db.models.organization import Organization
import uuid


@pytest_asyncio.fixture(scope="function")
async def async_client() -> AsyncClient:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture(scope="function")
async def auth_headers(db_session: AsyncSession) -> dict:
    org_id = uuid.uuid4()
    user_id = uuid.uuid4()
    email = f"test_{uuid.uuid4().hex[:8]}@finos.com"

    org = Organization(
        id=org_id,
        name=f"Test Org {uuid.uuid4().hex[:4]}",
        slug=f"test-org-{str(org_id)[:8]}",
        industry_type="FINANCE",
        currency="INR",
        fiscal_year_start=4,
        is_active=True
    )
    db_session.add(org)

    user = User(
        id=user_id,
        organization_id=org_id,
        email=email,
        hashed_password=get_password_hash("SecurePassword123!"),
        full_name="Test Auditor",
        role="ADMIN",
        is_active=True
    )
    db_session.add(user)
    await db_session.commit()

    token = create_access_token(
        subject=str(user_id),
        organization_id=str(org_id),
        role="ADMIN",
        email=email
    )

    return {"Authorization": f"Bearer {token}"}
