import io
from typing import Any, Dict, List
import pandas as pd
import pdfplumber


class FileParsingError(Exception):
    """Custom Exception raised when a file stream cannot be parsed."""
    pass


def parse_file_stream(file_name: str, file_bytes: bytes) -> pd.DataFrame:
    """
    Main multi-format parsing entrypoint.
    Accepts binary file bytes and converts Excel, CSV, or PDF statements into a clean Pandas DataFrame.
    """
    extension = file_name.lower().split(".")[-1]

    try:
        if extension in ["xlsx", "xls"]:
            return _parse_excel(file_bytes)
        elif extension == "csv":
            return _parse_csv(file_bytes)
        elif extension == "pdf":
            return _parse_pdf(file_bytes)
        else:
            raise FileParsingError(f"Unsupported file extension: .{extension}")
    except Exception as err:
        raise FileParsingError(f"Failed to parse '{file_name}': {str(err)}") from err


def _parse_excel(file_bytes: bytes) -> pd.DataFrame:
    """Parses binary Excel (.xlsx, .xls) bytes into a DataFrame."""
    buffer = io.BytesIO(file_bytes)
    df = pd.read_excel(buffer, engine="openpyxl" if buffer.getvalue().startswith(b"PK") else None)
    return _clean_dataframe(df)

def _parse_csv(file_bytes: bytes) -> pd.DataFrame:
    """Parses binary CSV bytes into a DataFrame."""
    buffer = io.BytesIO(file_bytes)
    df = pd.read_csv(buffer, encoding="utf-8", on_bad_lines="skip")
    return _clean_dataframe(df)

def _parse_pdf(file_bytes: bytes) -> pd.DataFrame:
    """
    Extracts structured tables from PDF Bank Statements or Invoices into a DataFrame.
    """
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
    data_rows = extracted_rows[1:]

    df = pd.DataFrame(data_rows, columns=headers)
    return _clean_dataframe(df)
def _clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normalizes headers, strips whitespace, and removes empty rows/columns.
    """
    if df.empty:
        return df

    df = df.dropna(how="all").dropna(how="all", axis=1)
    df.columns = [str(col).strip() for col in df.columns]

    for col in df.select_dtypes(include=["object"]).columns:
        df[col] = df[col].astype(str).str.strip()

    return df