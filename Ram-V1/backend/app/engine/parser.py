"""
backend/app/engine/parser.py
Universal Parser Engine: Pre-scans raw text to skip title banners and preserve all data columns.
"""
import io
import re
from typing import Any, Dict, List, Optional
import pandas as pd
import pdfplumber

class FileParsingError(Exception):
    pass

MONTH_PATTERN = re.compile(
    r"^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|"
    r"january|february|march|april|may|june|july|august|september|october|november|december|"
    r"q[1-4]|fy\d{2,4}|\d{4}-\d{2}|\d{2}/\d{4}|\d{4})$",
    re.IGNORECASE,
)

def parse_file_stream(file_name: str, file_bytes: bytes) -> pd.DataFrame:
    extension = file_name.lower().split(".")[-1]
    try:
        if extension in ["xlsx", "xls"]:
            df = _parse_excel(file_bytes)
        elif extension == "csv":
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
            lines = [l for l in text.splitlines() if l.strip()]
            if not lines:
                return pd.DataFrame()

            # Find the header line with the maximum number of column delimiters
            header_skip = 0
            max_delims = 0
            for idx, line in enumerate(lines[:10]):
                delims_count = max(line.count(","), line.count(";"), line.count("\t"))
                if delims_count > max_delims:
                    max_delims = delims_count
                    header_skip = idx

            buffer = io.StringIO("\n".join(lines[header_skip:]))
            return pd.read_csv(buffer, sep=None, engine="python", on_bad_lines="skip")
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

    for i in range(df.shape[1]):
        col_series = df.iloc[:, i]
        if col_series.dtype == "object":
            df.iloc[:, i] = col_series.apply(
                lambda x: None if pd.isna(x) or x is None or str(x).strip().lower() in ["nan", "none", ""] else str(x).strip()
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
