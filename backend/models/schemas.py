"""
backend/models/schemas.py

Pydantic models that define the shape of API responses.
These ensure the JSON returned to the frontend is always typed and documented.
"""

from typing import Any
from pydantic import BaseModel


# ── Profile models (Phase 3) ─────────────────────────────────────────────────


class ColumnProfile(BaseModel):
    """Profile for a single column in the dataset."""

    name: str
    """Column header name."""

    inferred_type: str
    """One of: 'numerical', 'categorical', 'boolean', 'datetime'."""

    missing_count: int
    """Number of missing (NaN/null) values in this column."""

    missing_percentage: float
    """Percentage of values that are missing (0.0–100.0)."""

    unique_count: int
    """Number of distinct non-null values."""

    min: float | None = None
    """Minimum value (numerical columns only)."""

    max: float | None = None
    """Maximum value (numerical columns only)."""

    mean: float | None = None
    """Mean value (numerical columns only)."""

    median: float | None = None
    """Median value (numerical columns only)."""


class DatasetProfile(BaseModel):
    """Full profile of the uploaded dataset."""

    total_rows: int
    """Total number of data rows."""

    total_columns: int
    """Total number of columns."""

    memory_usage: str
    """Human-readable memory footprint, e.g. '1.2 MB'."""

    numerical_count: int
    """Number of numerical columns."""

    categorical_count: int
    """Number of categorical (text/string) columns."""

    boolean_count: int
    """Number of boolean columns."""

    datetime_count: int
    """Number of datetime columns."""

    duplicate_rows: int
    """Number of fully duplicated rows."""

    total_missing: int
    """Total number of missing cells across all columns."""

    missing_percentage: float
    """Percentage of all cells that are missing (0.0–100.0)."""

    columns: list[ColumnProfile]
    """Per-column profile details."""


# ── Relationship models (Phase 4) ────────────────────────────────────────────

class SkippedColumn(BaseModel):
    name: str
    reason: str

class RelationshipPair(BaseModel):
    feature_a: str
    feature_b: str
    pearson: float
    spearman: float
    mutual_information: float
    valid_rows: int
    strength: str

class CorrelationMatrix(BaseModel):
    columns: list[str]
    values: list[list[float | None]]

class RelationshipResult(BaseModel):
    columns_analyzed: list[str]
    skipped_columns: list[SkippedColumn]
    pairs: list[RelationshipPair]
    top_relationships: list[RelationshipPair]
    correlation_matrix: CorrelationMatrix
    info_messages: list[str]


# ── Upload response ──────────────────────────────────────────────────────────


class UploadResponse(BaseModel):
    """
    Returned after a successful file upload.
    Includes metadata, a preview of the first 10 rows, and a dataset profile.
    """

    filename: str
    """Original name of the uploaded file."""

    format: str
    """File format: 'CSV' or 'XLSX'."""

    file_size_bytes: int
    """Size of the uploaded file in bytes."""

    rows: int
    """Total number of data rows in the dataset."""

    columns: int
    """Total number of columns in the dataset."""

    preview: list[dict[str, Any]]
    """First 10 rows as a list of {column: value} dicts."""

    column_names: list[str]
    """Ordered list of column header names."""

    profile: DatasetProfile
    """Full dataset profile with type breakdown and per-column stats."""

    relationships: RelationshipResult | None = None
    """Pairwise numerical relationships (Pearson, Spearman, MI)."""
