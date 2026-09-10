"""
backend/app/engine/parser.py
Universal Hardened Parser Engine:
- Magic-byte file signature validation to detect disguised binaries
- Formula injection sanitization (protects against CSV injection)
- Multi-encoding CSV decoding with delimiter sniffing
- Tabular extraction for Excel and PDF statements
"""
import io
import re
from typing import Any, Dict, List
import pandas as pd
import pdfplumber

class FileParsingError(Exception):
    pass

MONTH_PATTERN = re.compile(
    r"^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|"
    r"january|february|march|april|may|june|july|august|september|october|november|december|"
    r"q[1-4]|fy\d{2,4}|\d{4}-\d{2}|\d{2}/\d{4}|\d{4})([\s_-]*\d{2,4})?$",
    re.IGNORECASE,
)

DISALLOWED_MAGIC_SIGNATURES = [
    b"MZ",
    b"\x7fELF",
    b"\xca\xfe\xba\xbe",
    b"PK\x05\x06",
]


def _validate_magic_bytes(file_bytes: bytes, extension: str) -> None:
    if not file_bytes:
        raise FileParsingError("Uploaded file is empty (0 bytes).")

    for sig in DISALLOWED_MAGIC_SIGNATURES:
        if file_bytes.startswith(sig):
            raise FileParsingError("Security Violation: Disallowed binary file signature detected.")

    if extension == "pdf":
        if not file_bytes.startswith(b"%PDF-"):
            raise FileParsingError("Invalid PDF document signature.")
    elif extension in ["xlsx"]:
        if not file_bytes.startswith(b"PK\x03\x04"):
            raise FileParsingError("Invalid XLSX document signature (missing OpenXML container).")
    elif extension == "csv":
        if bytes([0]) in file_bytes[:1024]:
            raise FileParsingError("Corrupted or binary file disguised as CSV.")


def parse_file_stream(file_name: str, file_bytes: bytes) -> pd.DataFrame:
    extension = file_name.lower().split(".")[-1] if "." in file_name else ""
    _validate_magic_bytes(file_bytes, extension)

    try:
        if extension in ["xlsx", "xls"]:
            df = _parse_excel(file_bytes)
        elif extension in ["csv", "tsv", "txt"]:
            df = _parse_csv(file_bytes)
        elif extension == "pdf":
            df = _parse_pdf(file_bytes)
        else:
            raise FileParsingError(f"Unsupported file extension: .{extension}")

        df = _clean_dataframe(df)
        df = _detect_and_unpivot_wide_table(df)
        return df
    except Exception as err:
        if isinstance(err, FileParsingError):
            raise err
        raise FileParsingError(f"Failed to parse '{file_name}': {str(err)}") from err


def _parse_excel(file_bytes: bytes) -> pd.DataFrame:
    buffer = io.BytesIO(file_bytes)
    return pd.read_excel(buffer, engine="openpyxl" if buffer.getvalue().startswith(b"PK") else None)


def _parse_csv(file_bytes: bytes) -> pd.DataFrame:
    for encoding in ["utf-8-sig", "utf-8", "latin1"]:
        try:
            text = file_bytes.decode(encoding)
            raw_lines = text.splitlines()
            
            # 1. Filter out metadata banner comments (#, *, //) and blank lines
            cleaned_lines = []
            for l in raw_lines:
                s = l.strip()
                if not s or s.startswith(("#", "*", "//")):
                    continue
                cleaned_lines.append(s)
                
            if not cleaned_lines:
                return pd.DataFrame()

            # 2. Identify the true header row (first row with >= 2 delimiters and alphabetic characters)
            header_idx = 0
            for idx, line in enumerate(cleaned_lines[:10]):
                delim_count = max(line.count(","), line.count(";"), line.count("\t"))
                if delim_count >= 2 and any(c.isalpha() for c in line):
                    header_idx = idx
                    break

            buffer = io.StringIO("\n".join(cleaned_lines[header_idx:]))
            df = pd.read_csv(buffer, sep=None, engine="python", on_bad_lines="skip")
            
            # Clean column whitespace
            df.columns = [str(c).strip() for c in df.columns]
            return df
        except Exception:
            continue
    raise FileParsingError("Unable to decode CSV with supported encodings.")


def _parse_pdf(file_bytes: bytes) -> pd.DataFrame:
    buffer = io.BytesIO(file_bytes)
    extracted_rows: List[List[Any]] = []
    with pdfplumber.open(buffer) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    if any(cell is not None and str(cell).strip() != "" for cell in row):
                        extracted_rows.append(row)

    if not extracted_rows:
        raise FileParsingError("No readable tabular data found in PDF file.")

    headers = [str(cell).strip() if cell else f"Col_{i}" for i, cell in enumerate(extracted_rows[0])]
    return pd.DataFrame(extracted_rows[1:], columns=headers)


def _sanitize_formula(val: Any) -> Any:
    if isinstance(val, str) and val and val[0] in ["=", "+", "-", "@"]:
        return "'" + val
    return val


def _clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df

    df = df.dropna(how="all").dropna(how="all", axis=1)
    if df.empty:
        return df

    col_counts: Dict[str, int] = {}
    deduped_cols: List[str] = []
    for col in df.columns:
        c_str = str(col).strip() if pd.notna(col) and str(col).strip() != "" else "unnamed"
        if c_str in col_counts:
            col_counts[c_str] += 1
            deduped_cols.append(f"{c_str}_{col_counts[c_str]}")
        else:
            col_counts[c_str] = 0
            deduped_cols.append(c_str)
    df.columns = deduped_cols

    for col in df.columns:
        df[col] = df[col].apply(
            lambda x: None if pd.isna(x) or x is None or str(x).strip().lower() in ["nan", "none", "null", ""] else _sanitize_formula(str(x).strip())
        )
    return df


def _detect_and_unpivot_wide_table(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty or len(df.columns) < 3:
        return df

    date_columns: List[str] = []
    id_columns: List[str] = []

    for col in df.columns:
        col_clean = str(col).strip().lower()
        if MONTH_PATTERN.search(col_clean) and not any(k in col_clean for k in ["total", "ytd", "summary", "average"]):
            date_columns.append(col)
        else:
            id_columns.append(col)

    if len(date_columns) >= 2 and len(id_columns) >= 1:
        melted_df = pd.melt(
            df,
            id_vars=id_columns,
            value_vars=date_columns,
            var_name="transaction_date",
            value_name="amount",
        )
        return melted_df.dropna(subset=["amount"]).reset_index(drop=True)

    return df
