"""
backend/services/profiler.py

Dataset profiling service — analyses a Pandas DataFrame and produces
a structured profile with type breakdown, missing values, duplicates,
and per-column statistics.

This module is called by file_processor.process_upload() after the
DataFrame has been parsed and validated.
"""

import math
from typing import Any

import numpy as np
import pandas as pd


# ── Type mapping ──────────────────────────────────────────────────────────────

def _infer_column_type(series: pd.Series) -> str:
    """
    Map a Pandas dtype to one of our four display types.

    Strategy:
      - int/float/unsigned → "numerical"
      - bool               → "boolean"
      - datetime64/timedelta → "datetime"
      - everything else    → "categorical"

    We do NOT attempt to parse string columns as dates. This avoids
    misclassifying free-text, IDs, or codes that happen to look date-like.
    """
    dtype = series.dtype

    if pd.api.types.is_bool_dtype(dtype):
        # Check bool BEFORE numeric — numpy bool_ is technically numeric
        return "boolean"
    if pd.api.types.is_numeric_dtype(dtype):
        return "numerical"
    if pd.api.types.is_datetime64_any_dtype(dtype):
        return "datetime"
    if hasattr(pd.api.types, "is_timedelta64_dtype") and pd.api.types.is_timedelta64_dtype(dtype):
        return "datetime"

    return "categorical"


# ── Helpers ──────────────────────────────────────────────────────────────────

def _safe_round(value: Any, decimals: int = 4) -> float | None:
    """Round a numeric value, returning None for NaN/Inf/None."""
    if value is None:
        return None
    try:
        f = float(value)
        if math.isnan(f) or math.isinf(f):
            return None
        return round(f, decimals)
    except (TypeError, ValueError):
        return None


def _fmt_memory(n_bytes: int) -> str:
    """Format a byte count as a human-readable string."""
    for unit in ("B", "KB", "MB", "GB"):
        if n_bytes < 1024:
            return f"{n_bytes:.1f} {unit}" if unit != "B" else f"{n_bytes} B"
        n_bytes = n_bytes / 1024
    return f"{n_bytes:.1f} TB"


# ── Per-column profiling ─────────────────────────────────────────────────────

def _profile_column(series: pd.Series) -> dict[str, Any]:
    """
    Build a profile dict for a single column.

    Returns:
        {
            name, inferred_type, missing_count, missing_percentage,
            unique_count, min, max, mean, median  (last four numerical only)
        }
    """
    col_type = _infer_column_type(series)
    total = len(series)
    missing = int(series.isna().sum())
    missing_pct = round((missing / total) * 100, 2) if total > 0 else 0.0

    # unique_count: count non-null unique values
    try:
        unique = int(series.nunique(dropna=True))
    except Exception:
        unique = 0

    result: dict[str, Any] = {
        "name": str(series.name),
        "inferred_type": col_type,
        "missing_count": missing,
        "missing_percentage": missing_pct,
        "unique_count": unique,
        "min": None,
        "max": None,
        "mean": None,
        "median": None,
    }

    # Numerical stats — only for numerical columns with at least one non-null
    if col_type == "numerical" and missing < total:
        result["min"] = _safe_round(series.min())
        result["max"] = _safe_round(series.max())
        result["mean"] = _safe_round(series.mean())
        result["median"] = _safe_round(series.median())

    return result


# ── Main entry point ─────────────────────────────────────────────────────────

def profile_dataset(df: pd.DataFrame) -> dict[str, Any]:
    """
    Produce a full profile for the given DataFrame.

    Args:
        df: A validated, non-empty Pandas DataFrame.

    Returns:
        A dict matching the DatasetProfile Pydantic schema.
    """
    total_rows = len(df)
    total_cols = len(df.columns)

    # Memory usage (deep=True gives true string memory, not just pointers)
    memory_bytes = int(df.memory_usage(deep=True).sum())
    memory_usage = _fmt_memory(memory_bytes)

    # Profile every column
    column_profiles = [_profile_column(df[col]) for col in df.columns]

    # Type counts
    type_counts = {"numerical": 0, "categorical": 0, "boolean": 0, "datetime": 0}
    for cp in column_profiles:
        col_type = cp["inferred_type"]
        if col_type in type_counts:
            type_counts[col_type] += 1

    # Duplicate rows
    try:
        duplicate_rows = int(df.duplicated().sum())
    except Exception:
        duplicate_rows = 0

    # Missing values (total across all cells)
    total_cells = total_rows * total_cols
    total_missing = int(df.isna().sum().sum())
    missing_pct = round((total_missing / total_cells) * 100, 2) if total_cells > 0 else 0.0

    return {
        "total_rows": total_rows,
        "total_columns": total_cols,
        "memory_usage": memory_usage,
        "numerical_count": type_counts["numerical"],
        "categorical_count": type_counts["categorical"],
        "boolean_count": type_counts["boolean"],
        "datetime_count": type_counts["datetime"],
        "duplicate_rows": duplicate_rows,
        "total_missing": total_missing,
        "missing_percentage": missing_pct,
        "columns": column_profiles,
    }

