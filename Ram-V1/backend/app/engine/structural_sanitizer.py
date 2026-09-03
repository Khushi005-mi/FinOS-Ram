"""
backend/app/engine/structural_sanitizer.py

STATION 2: Structural Sanitization Engine
Uses the Stage 1 DatasetTopologyProfile to crop the raw matrix to its exact data bounding box,
strip header/footer noise, deduplicate column names, and eliminate non-printable null bytes.
"""
from typing import Any, Dict, List, Optional, Tuple
import pandas as pd
import numpy as np

from app.engine.data_understanding import DatasetTopologyProfile, DataUnderstandingEngine


class StructuralSanitizerEngine:
    @classmethod
    def sanitize_matrix(
        cls, 
        df_raw: pd.DataFrame, 
        profile: Optional[DatasetTopologyProfile] = None
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Executes structural de-noising and table cropping based on the understanding profile.
        Returns: (sanitized_df, sanitization_receipt)
        """
        if df_raw.empty:
            return df_raw, {"original_rows": 0, "cleaned_rows": 0, "banner_rows_stripped": 0, "trailing_rows_stripped": 0}

        # 1. Generate profile if not provided
        if not profile:
            profile = DataUnderstandingEngine.analyze_raw_matrix(df_raw)

        original_row_count = len(df_raw)

        # 2. Extract and align table using detected header row
        working_df = DataUnderstandingEngine._align_table_headers(df_raw, profile.header_row_index)

        # 3. Crop table to data boundaries (dropping trailing summaries and footers)
        start_row = profile.data_start_row
        end_row = min(profile.data_end_row, len(working_df))
        cropped_df = working_df.iloc[start_row:end_row].copy().reset_index(drop=True)

        # 4. Deduplicate and clean column names
        cleaned_df = cls._sanitize_headers(cropped_df)

        # 5. Clean cell whitespace, converting stringified null tokens
        cleaned_df = cls._clean_cells(cleaned_df)

        # 6. Drop any completely empty spacer rows inside the table body
        final_df = cleaned_df.dropna(how="all").reset_index(drop=True)

        sanitization_receipt = {
            "original_rows": original_row_count,
            "cleaned_rows": len(final_df),
            "header_row_promoted": profile.header_row_index,
            "banner_rows_stripped": len(profile.metadata_banner_rows),
            "trailing_rows_stripped": max(0, original_row_count - profile.header_row_index - 1 - len(final_df)),
            "topology": profile.topology_type,
        }

        return final_df, sanitization_receipt

    @classmethod
    def _sanitize_headers(cls, df: pd.DataFrame) -> pd.DataFrame:
        """Deduplicates column names and replaces blank headers with deterministic names."""
        col_counts: Dict[str, int] = {}
        sanitized: List[str] = []

        for idx, col in enumerate(df.columns):
            c_str = str(col).strip()
            if not c_str or c_str.lower().startswith("unnamed:") or c_str.lower() in ["nan", "none"]:
                c_str = f"col_{idx+1}"

            if c_str in col_counts:
                col_counts[c_str] += 1
                sanitized.append(f"{c_str}_{col_counts[c_str]}")
            else:
                col_counts[c_str] = 0
                sanitized.append(c_str)

        df.columns = sanitized
        return df

    @classmethod
    def _clean_cells(cls, df: pd.DataFrame) -> pd.DataFrame:
        """Strips cell whitespace and replaces junk null strings with real None."""
        for i in range(df.shape[1]):
            series = df.iloc[:, i]
            if series.dtype == "object":
                df.iloc[:, i] = series.apply(
                    lambda x: None if pd.isna(x) or x is None or str(x).strip().lower() in ["nan", "none", "null", "—", "-", "n/a", "nil"] else str(x).strip()
                )
        return df
