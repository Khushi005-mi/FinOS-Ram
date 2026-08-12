import asyncio
from datetime import date
from decimal import Decimal

from sqlalchemy import select
from app.db.models.journal_entry import JournalEntry
from app.db.models.organization import Organization
from app.db.session import AsyncSessionLocal


async def seed_database():
    """
    Populates sample tenant organization and 6 months of multi-source ledger entries into database.
    Configured with INR (Indian Rupees, ₹) currency.
    """
    async with AsyncSessionLocal() as db:
        print("🌱 Seeding FinOS Database...")

        # 1. Create or fetch Demo Organization (String UUID for cross-DB compatibility)
        org_id = "00000000-0000-0000-0000-000000000001"
        
        stmt = select(Organization).where(Organization.id == org_id)
        result = await db.execute(stmt)
        org = result.scalar_one_or_none()

        if not org:
            org = Organization(
                id=org_id,
                name="Apex Manufacturing Ltd.",
                slug="apex-manufacturing",
                industry_type="MANUFACTURING",
                currency="INR",  # Base Currency set to INR (Indian Rupees)
                fiscal_year_start=4,  # April 1st (Indian Fiscal Year Start)
                is_active=True,
            )
            db.add(org)
            await db.commit()
            print("✓ Created Organization: Apex Manufacturing Ltd. (Currency: INR)")
        else:
            org.currency = "INR"
            org.fiscal_year_start = 4
            await db.commit()
            print("✓ Updated Organization Currency to INR (₹)")

        # 2. Sample 6 Months of Transaction Ledger Entries (in INR amounts)
        sample_entries = [
            # Jan
            {"date": date(2024, 1, 15), "code": "4000", "name": "Product Manufacturing Revenue", "cat": "REVENUE", "debit": 0, "credit": 1100000, "ref": "INV-101", "src": "GENERAL_LEDGER"},
            {"date": date(2024, 1, 15), "code": "5000", "name": "Direct Raw Material Inventory", "cat": "COGS", "debit": 400000, "credit": 0, "ref": "INV-101", "src": "RAW_MATERIALS_COGS"},
            {"date": date(2024, 1, 18), "code": "5100", "name": "Direct Factory Labor Wages", "cat": "COGS", "debit": 180000, "credit": 0, "ref": "PAY-101", "src": "PAYROLL"},
            {"date": date(2024, 1, 20), "code": "5200", "name": "Factory Power & Utility Overhead", "cat": "COGS", "debit": 70000, "credit": 0, "ref": "UTL-101", "src": "GENERAL_LEDGER"},

            # Feb
            {"date": date(2024, 2, 15), "code": "4000", "name": "Product Manufacturing Revenue", "cat": "REVENUE", "debit": 0, "credit": 1250000, "ref": "INV-102", "src": "GENERAL_LEDGER"},
            {"date": date(2024, 2, 15), "code": "5000", "name": "Direct Raw Material Inventory", "cat": "COGS", "debit": 440000, "credit": 0, "ref": "INV-102", "src": "RAW_MATERIALS_COGS"},
            {"date": date(2024, 2, 18), "code": "5100", "name": "Direct Factory Labor Wages", "cat": "COGS", "debit": 200000, "credit": 0, "ref": "PAY-102", "src": "PAYROLL"},
            {"date": date(2024, 2, 20), "code": "5200", "name": "Factory Power & Utility Overhead", "cat": "COGS", "debit": 80000, "credit": 0, "ref": "UTL-102", "src": "GENERAL_LEDGER"},

            # Mar
            {"date": date(2024, 3, 15), "code": "4000", "name": "Product Manufacturing Revenue", "cat": "REVENUE", "debit": 0, "credit": 1400000, "ref": "INV-103", "src": "GENERAL_LEDGER"},
            {"date": date(2024, 3, 15), "code": "5000", "name": "Direct Raw Material Inventory", "cat": "COGS", "debit": 500000, "credit": 0, "ref": "INV-103", "src": "RAW_MATERIALS_COGS"},
            {"date": date(2024, 3, 18), "code": "5100", "name": "Direct Factory Labor Wages", "cat": "COGS", "debit": 220000, "credit": 0, "ref": "PAY-103", "src": "PAYROLL"},
            {"date": date(2024, 3, 20), "code": "5200", "name": "Factory Power & Utility Overhead", "cat": "COGS", "debit": 90000, "credit": 0, "ref": "UTL-103", "src": "GENERAL_LEDGER"},

            # Apr - Jun (Additional Revenue)
            {"date": date(2024, 4, 15), "code": "4000", "name": "Product Manufacturing Revenue", "cat": "REVENUE", "debit": 0, "credit": 1550000, "ref": "INV-104", "src": "GENERAL_LEDGER"},
            {"date": date(2024, 5, 15), "code": "4000", "name": "Product Manufacturing Revenue", "cat": "REVENUE", "debit": 0, "credit": 1700000, "ref": "INV-105", "src": "GENERAL_LEDGER"},
            {"date": date(2024, 6, 15), "code": "4000", "name": "Product Manufacturing Revenue", "cat": "REVENUE", "debit": 0, "credit": 1850000, "ref": "INV-106", "src": "GENERAL_LEDGER"},
        ]

        # 3. Bulk Insert Journal Entries
        entries_to_add = []
        for item in sample_entries:
            entry = JournalEntry(
                organization_id=org_id,
                source_type=item["src"],
                account_code=item["code"],
                account_name=item["name"],
                account_category=item["cat"],
                debit=Decimal(str(item["debit"])),
                credit=Decimal(str(item["credit"])),
                transaction_date=item["date"],
                reference_id=item["ref"],
            )
            entries_to_add.append(entry)

        db.add_all(entries_to_add)
        await db.commit()
        print(f"✓ Successfully seeded {len(entries_to_add)} INR journal entries into database!")


if __name__ == "__main__":
    asyncio.run(seed_database())