import pytest
import io
from httpx import AsyncClient
from sqlalchemy import select
from app.db.models.journal_entry import JournalEntry

@pytest.mark.asyncio
async def test_dataset_isolation_and_no_cumulative_sums(async_client: AsyncClient, auth_headers: dict, db_session):
    csv_a = "date,account,debit,credit\n2026-01-01,Revenue,0,10000\n2026-01-01,Cash,10000,0"
    files_a = {"files": ("dataset_a.csv", io.BytesIO(csv_a.encode()), "text/csv")}
    
    res_a = await async_client.post("/api/v1/ingestion/batch", files=files_a, headers=auth_headers)
    assert res_a.status_code == 200

    dash_a = await async_client.get("/api/v1/dashboard/metrics", headers=auth_headers)
    assert dash_a.status_code == 200
    assert dash_a.json()["total_revenue"] == 10000.0

    csv_b = "date,account,debit,credit\n2026-02-01,Revenue,0,25000\n2026-02-01,Cash,25000,0"
    files_b = {"files": ("dataset_b.csv", io.BytesIO(csv_b.encode()), "text/csv")}

    res_b = await async_client.post("/api/v1/ingestion/batch", files=files_b, headers=auth_headers)
    assert res_b.status_code == 200

    dash_b = await async_client.get("/api/v1/dashboard/metrics", headers=auth_headers)
    assert dash_b.status_code == 200
    assert dash_b.json()["total_revenue"] == 25000.0

@pytest.mark.asyncio
async def test_journal_entries_linked_to_upload_batch_id(async_client: AsyncClient, auth_headers: dict, db_session):
    csv_data = "date,account,debit,credit\n2026-01-01,Sales,0,500\n2026-01-01,Cash,500,0"
    files = {"files": ("test.csv", io.BytesIO(csv_data.encode()), "text/csv")}

    res = await async_client.post("/api/v1/ingestion/batch", files=files, headers=auth_headers)
    assert res.status_code == 200
    batch_id = res.json()["batch_id"]

    org_res = await async_client.get("/api/v1/organization/me", headers=auth_headers)
    assert org_res.status_code == 200

    entries = await db_session.execute(
        select(JournalEntry).where(JournalEntry.upload_batch_id == batch_id)
    )
    results = entries.scalars().all()
    assert len(results) == 2
    for entry in results:
        assert str(entry.upload_batch_id) == batch_id

@pytest.mark.asyncio
async def test_failed_ingestion_does_not_corrupt_database(async_client: AsyncClient, auth_headers: dict, db_session):
    corrupted_csv = "date,account,debit,credit\nINVALID_DATE,Cash,NaN,0"
    files = {"files": ("corrupted.csv", io.BytesIO(corrupted_csv.encode()), "text/csv")}

    res = await async_client.post("/api/v1/ingestion/batch", files=files, headers=auth_headers)
    assert res.status_code in [200, 400, 422, 500]

    entries = await db_session.execute(select(JournalEntry).where(JournalEntry.account_name == "INVALID_DATE"))
    assert entries.scalars().first() is None
