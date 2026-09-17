"""
backend/services/file_processor.py

Core logic for reading and validating uploaded CSV and XLSX files.
All heavy lifting with Pandas happens here, keeping the router clean.
"""

import io
import math
from typing import Any

import pandas as pd

from services.profiler import profile_dataset
from services.relationships import analyze_relationships

# ── Limits ──────────────────────────────────────────────────────────────────
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024   # 50 MB
MAX_ROWS = 1_000_000
ALLOWED_EXTENSIONS = {".csv", ".xlsx"}

# ── Custom exceptions ────────────────────────────────────────────────────────


class FileValidationError(Exception):
    """Raised when an uploaded file fails a validation check."""

    def __init__(self, message: str, status_code: int = 422) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(message)


# ── Main entry point ─────────────────────────────────────────────────────────


def process_upload(
    filename: str,
    content: bytes,
) -> dict[str, Any]:
    """
    Validate and parse an uploaded file.

    Args:
        filename:  Original filename as provided by the client.
        content:   Raw bytes of the uploaded file.

    Returns:
        A dict ready to be serialised as an UploadResponse.

    Raises:
        FileValidationError: if any validation rule is violated.
    """
    # 1. Validate extension
    ext = _get_extension(filename)

    # 2. Validate size (in bytes, before parsing)
    file_size = len(content)
    if file_size == 0:
        raise FileValidationError("The uploaded file is empty.", status_code=422)
    if file_size > MAX_FILE_SIZE_BYTES:
        raise FileValidationError(
            f"File exceeds the 50 MB limit "
            f"({_fmt_bytes(file_size)} uploaded).",
            status_code=413,
        )

    # 3. Parse with Pandas
    df = _parse_file(content, ext)

    # 4. Validate row count
    if len(df) > MAX_ROWS:
        raise FileValidationError(
            f"Dataset has {len(df):,} rows, which exceeds the "
            f"1,000,000-row limit.",
            status_code=422,
        )

    # 5. Build preview (first 10 rows, NaN → None for JSON safety)
    preview_df = df.head(10)
    preview = _df_to_json_safe(preview_df)

    # 6. Profile the dataset (Phase 3)
    profile = profile_dataset(df)

    # 7. Analyze relationships (Phase 4)
    relationships = analyze_relationships(df)

    return {
        "filename": filename,
        "format": ext.lstrip(".").upper(),
        "file_size_bytes": file_size,
        "rows": len(df),
        "columns": len(df.columns),
        "column_names": list(df.columns.astype(str)),
        "preview": preview,
        "profile": profile,
        "relationships": relationships,
    }


# ── Helpers ──────────────────────────────────────────────────────────────────


def _get_extension(filename: str) -> str:
    """Return the lowercase file extension (e.g. '.csv') or raise."""
    dot_idx = filename.rfind(".")
    if dot_idx == -1:
        raise FileValidationError(
            "File has no extension. Only .csv and .xlsx files are supported."
        )
    ext = filename[dot_idx:].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise FileValidationError(
            f"'{ext}' files are not supported. "
            "Please upload a .csv or .xlsx file."
        )
    return ext


def _parse_file(content: bytes, ext: str) -> pd.DataFrame:
    """Parse bytes into a DataFrame; raise a clear error if malformed."""
    buf = io.BytesIO(content)
    try:
        if ext == ".csv":
            df = pd.read_csv(buf)
        else:  # .xlsx
            df = pd.read_excel(buf, sheet_name=0, engine="openpyxl")
    except Exception as exc:
        raise FileValidationError(
            f"Could not parse the file. "
            f"Make sure it is a valid {'CSV' if ext == '.csv' else 'XLSX'} file. "
            f"Details: {exc}"
        ) from exc

    if df.empty:
        raise FileValidationError(
            "The file was parsed successfully but contains no data rows."
        )

    return df


def _df_to_json_safe(df: pd.DataFrame) -> list[dict[str, Any]]:
    """Convert a DataFrame to a list of dicts, replacing NaN/Inf with None."""
    records = df.to_dict(orient="records")
    cleaned: list[dict[str, Any]] = []
    for row in records:
        clean_row: dict[str, Any] = {}
        for k, v in row.items():
            col = str(k)
            if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
                clean_row[col] = None
            else:
                clean_row[col] = v
        cleaned.append(clean_row)
    return cleaned


def _fmt_bytes(n: int) -> str:
    """Human-readable byte size string."""
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.1f} {unit}"
        n //= 1024
    return f"{n:.1f} TB"

