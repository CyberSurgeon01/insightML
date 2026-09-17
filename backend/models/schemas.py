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


# ── Categorical models (Phase 5) ─────────────────────────────────────────────

class CatCatPair(BaseModel):
    feature_a: str
    feature_b: str
    cramers_v: float
    p_value: float
    valid_rows: int
    strength: str

class GroupStat(BaseModel):
    category: str
    count: int
    mean: float
    median: float
    min: float
    max: float

class CatNumPair(BaseModel):
    categorical_feature: str
    numerical_feature: str
    eta_squared: float
    p_value: float
    valid_rows: int
    strength: str
    groups: list[GroupStat]

class CategoricalResult(BaseModel):
    cat_columns_analyzed: list[str]
    num_columns_analyzed: list[str]
    skipped_columns: list[SkippedColumn]
    cat_cat_pairs: list[CatCatPair]
    cat_num_pairs: list[CatNumPair]
    top_cat_cat: list[CatCatPair]
    info_messages: list[str]


# ── Quality models (Phase 6) ─────────────────────────────────────────────────

class QualityWarning(BaseModel):
    warning_id: str
    severity: str  # Critical, Warning, Info
    category: str  # Missing, Duplicates, Distribution, Format, Outliers
    affected_columns: list[str]
    issue_title: str
    explanation: str
    count: int
    percentage: float
    recommendation: str

class OutlierDetail(BaseModel):
    column: str
    outlier_count: int
    outlier_percentage: float
    lower_bound: float
    upper_bound: float

class QualityResult(BaseModel):
    total_warnings: int
    critical_count: int
    warning_count: int
    info_count: int
    total_duplicate_rows: int
    total_missing_cells: int
    warnings: list[QualityWarning]
    outliers: list[OutlierDetail]


# ── Insights models (Phase 7) ────────────────────────────────────────────────

class InsightEvidence(BaseModel):
    metrics: dict[str, Any]
    affected_columns: list[str]

class Insight(BaseModel):
    insight_id: str
    priority: str  # High, Medium, Low
    category: str  # Data Quality, Numerical Relationship, Categorical Relationship, Distribution, Recommendation
    title: str
    summary: str
    evidence: InsightEvidence
    recommended_action: str
    source_section: str  # quality, relationships, categorical, profile

class InsightResult(BaseModel):
    insights: list[Insight]


# ── ML Readiness models (Phase 9) ────────────────────────────────────────────

class TargetAssessment(BaseModel):
    target_name: str
    inferred_task_type: str
    user_selected_task_type: str
    total_values: int
    missing_values: int
    unique_values: int
    data_type: str
    health_status: str
    blocking_issues: list[str]

class ClassificationDetails(BaseModel):
    class_counts: dict[str, int]
    class_percentages: dict[str, float]
    majority_class_percentage: float
    minority_class_count: int
    imbalance_warning: bool
    rare_class_warning: bool
    enough_samples: bool

class RegressionDetails(BaseModel):
    count: int
    missing_values: int
    minimum: float
    maximum: float
    mean: float
    median: float
    std_dev: float
    skewness: float | None = None
    outlier_summary: str
    enough_variation: bool

class FeatureReadiness(BaseModel):
    recommended_features: list[str]
    excluded_features: list[dict[str, str]]  # list of {"column": "name", "reason": "why"}
    potential_risk_columns: list[str]

class LeakageWarning(BaseModel):
    column: str
    reason: str

class Recommendation(BaseModel):
    priority: str
    action: str

class MLReadinessResponse(BaseModel):
    target: TargetAssessment
    classification: ClassificationDetails | None = None
    regression: RegressionDetails | None = None
    features: FeatureReadiness
    leakage: list[LeakageWarning]
    recommendations: list[Recommendation]


# ── Phase 10 Baseline Model ──────────────────────────────────────────────────

class MetricComparison(BaseModel):
    metric_name: str
    baseline_score: float
    dummy_score: float
    is_better: bool

class ClassificationMetrics(BaseModel):
    accuracy: MetricComparison
    precision: MetricComparison
    recall: MetricComparison
    f1: MetricComparison
    roc_auc: MetricComparison | None = None
    confusion_matrix: list[list[int]] # 2D array
    classes: list[str]
    class_report: dict # Classification report dict

class RegressionMetrics(BaseModel):
    r2: MetricComparison
    mae: MetricComparison
    rmse: MetricComparison
    actual_vs_predicted: list[dict[str, float]] # [{"actual": 1.0, "predicted": 1.1}, ...]

class BaselineModelResponse(BaseModel):
    task_type: str
    model_name: str
    dummy_model_name: str
    training_rows: int
    test_rows: int
    excluded_rows: int
    selected_features: list[str]
    preprocessing_summary: list[str]
    classification_metrics: ClassificationMetrics | None = None
    regression_metrics: RegressionMetrics | None = None
    outperformed_dummy: bool
    caveat: str



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

    categorical: CategoricalResult | None = None
    """Categorical relationships (Cramer's V, ANOVA)."""

    quality: QualityResult | None = None
    """Data quality warnings and recommendations."""

    insights: InsightResult | None = None
    """Generated smart insights (Phase 7)."""
