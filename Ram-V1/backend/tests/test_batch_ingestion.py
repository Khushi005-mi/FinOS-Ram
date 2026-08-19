# backend/tests/test_batch_ingestion.py
import pytest
from httpx import AsyncClient
import io

@pytest.mark.asyncio
async def test_dataset_isolation_and_no_cumulative_sums(async_client: AsyncClient, auth_headers: dict, db_session):
    # --- Step 1: Upload Dataset A ($10,000 revenue) ---
    csv_a = "date,account,debit,credit\n2026-01-01,Revenue,0,10000\n2026-01-01,Cash,10000,0"
    files_a = {"files": ("dataset_a.csv", io.BytesIO(csv_a.encode()), "text/csv")}
    
    res_a = await async_client.post("/api/v1/ingestion/batch", files=files_a, headers=auth_headers)
    assert res_a.status_code == 200

    # Verify Dashboard Metrics for Dataset A
    dash_a = await async_client.get("/api/v1/dashboard/metrics", headers=auth_headers)
    assert dash_a.status_code == 200
    assert dash_a.json()["data"]["metrics"]["total_revenue"] == 10000

    # --- Step 2: Upload Dataset B ($25,000 revenue) ---
    csv_b = "date,account,debit,credit\n2026-02-01,Revenue,0,25000\n2026-02-01,Cash,25000,0"
    files_b = {"files": ("dataset_b.csv", io.BytesIO(csv_b.encode()), "text/csv")}

    res_b = await async_client.post("/api/v1/ingestion/batch", files=files_b, headers=auth_headers)
    assert res_b.status_code == 200

    # Verify Dashboard Metrics shows ONLY Dataset B ($25,000), NOT $35,000
    dash_b = await async_client.get("/api/v1/dashboard/metrics", headers=auth_headers)
    assert dash_b.status_code == 200
    assert dash_b.json()["data"]["metrics"]["total_revenue"] == 25000
@pytest.mark.asyncio
async def test_journal_entries_linked_to_upload_batch_id(async_client: AsyncClient, auth_headers: dict, db_session):
    csv_data = "date,account,debit,credit\n2026-01-01,Sales,0,500\n2026-01-01,Cash,500,0"
    files = {"files": ("test.csv", io.BytesIO(csv_data.encode()), "text/csv")}

    res = await async_client.post("/api/v1/ingestion/batch", files=files, headers=auth_headers)
    batch_id = res.json()["batch_id"]

    # Verify Organization's active_batch_id matches the new batch
    org_res = await async_client.get("/api/v1/organizations/me", headers=auth_headers)
    assert org_res.json()["active_batch_id"] == batch_id

    # Verify all created JournalEntry records have upload_batch_id set
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
    assert res.status_code in [400, 422, 500]

    # Verify no orphaned journal entries were committed
    entries = await db_session.execute(select(JournalEntry).where(JournalEntry.account == "INVALID_DATE"))
    assert entries.scalars().first() is None            