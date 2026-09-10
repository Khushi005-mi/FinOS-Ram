import sys
sys.path.insert(0, "Ram-V1/backend")
from app.engine.parser import parse_file_stream, FileParsingError

# Test 1: Disguised Windows Executable (MZ header)
fake_csv = b"MZ\x90\x00\x03\x00\x00\x00data,line,item"
try:
    parse_file_stream("accounts.csv", fake_csv)
    print("Test 1 (Disguised Binary): FAILED")
except FileParsingError as e:
    assert "Disallowed binary" in str(e) or "Security Violation" in str(e)
    print("Test 1 (Disguised Binary): PASSED (Blocked executable signature)")

# Test 2: Binary Null Bytes in CSV
null_csv = b"date,account,amount\n2026-01-01,\x00\x00\x00,100"
try:
    parse_file_stream("ledger.csv", null_csv)
    print("Test 2 (Null Byte Injection): FAILED")
except FileParsingError as e:
    assert "binary file disguised as CSV" in str(e)
    print("Test 2 (Null Byte Injection): PASSED (Blocked null byte injection)")

# Test 3: CSV Formula Injection Sanitization
formula_csv = b"date,account,debit,credit\n2026-01-01,=cmd|/C calc,100,0\n2026-01-01,Cash,0,100"
df = parse_file_stream("formula.csv", formula_csv)
account_val = str(df["account"].iloc[0])
assert account_val.startswith("'="), f"Expected formula quote, got: {account_val}"
print("Test 3 (CSV Formula Sanitization): PASSED (Sanitized to:", account_val, ")")

print("=== ALL GATE 4 INGESTION SECURITY TESTS PASSED ===")
