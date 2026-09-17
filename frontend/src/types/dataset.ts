/**
 * src/types/dataset.ts
 *
 * TypeScript types that mirror the Pydantic schemas in backend/models/schemas.py.
 * Keep these in sync whenever the backend response shape changes.
 */

// ── Profile types (Phase 3) ─────────────────────────────────────────────────

/** Profile for a single column */
export interface ColumnProfile {
  /** Column header name */
  name: string;

  /** One of: "numerical", "categorical", "boolean", "datetime" */
  inferred_type: string;

  /** Number of missing (NaN/null) values */
  missing_count: number;

  /** Percentage of values missing (0–100) */
  missing_percentage: number;

  /** Number of distinct non-null values */
  unique_count: number;

  /** Minimum value (numerical columns only) */
  min: number | null;

  /** Maximum value (numerical columns only) */
  max: number | null;

  /** Mean value (numerical columns only) */
  mean: number | null;

  /** Median value (numerical columns only) */
  median: number | null;
}

/** Full dataset profile */
export interface DatasetProfile {
  total_rows: number;
  total_columns: number;
  memory_usage: string;
  numerical_count: number;
  categorical_count: number;
  boolean_count: number;
  datetime_count: number;
  duplicate_rows: number;
  total_missing: number;
  missing_percentage: number;
  columns: ColumnProfile[];
}

// ── Relationships types (Phase 4) ───────────────────────────────────────────

export interface SkippedColumn {
  name: string;
  reason: string;
}

export interface RelationshipPair {
  feature_a: string;
  feature_b: string;
  pearson: number;
  spearman: number;
  mutual_information: number;
  valid_rows: number;
  strength: string;
}

export interface CorrelationMatrix {
  columns: string[];
  values: (number | null)[][];
}

export interface RelationshipResult {
  columns_analyzed: string[];
  skipped_columns: SkippedColumn[];
  pairs: RelationshipPair[];
  top_relationships: RelationshipPair[];
  correlation_matrix: CorrelationMatrix;
  info_messages: string[];
}


// ── Categorical models (Phase 5) ──────────────────────────────────────────

export interface CatCatPair {
  feature_a: string;
  feature_b: string;
  cramers_v: number;
  p_value: number;
  valid_rows: number;
  strength: string;
}

export interface GroupStat {
  category: string;
  count: number;
  mean: number;
  median: number;
  min: number;
  max: number;
}

export interface CatNumPair {
  categorical_feature: string;
  numerical_feature: string;
  eta_squared: number;
  p_value: number;
  valid_rows: number;
  strength: string;
  groups: GroupStat[];
}

export interface CategoricalResult {
  cat_columns_analyzed: string[];
  num_columns_analyzed: string[];
  skipped_columns: SkippedColumn[];
  cat_cat_pairs: CatCatPair[];
  cat_num_pairs: CatNumPair[];
  top_cat_cat: CatCatPair[];
  info_messages: string[];
}


// ── Quality models (Phase 6) ────────────────────────────────────────────────

export interface QualityWarning {
  warning_id: string;
  severity: "Critical" | "Warning" | "Info";
  category: string;
  affected_columns: string[];
  issue_title: string;
  explanation: string;
  count: number;
  percentage: number;
  recommendation: string;
}

export interface OutlierDetail {
  column: string;
  outlier_count: number;
  outlier_percentage: number;
  lower_bound: number;
  upper_bound: number;
}

export interface QualityResult {
  total_warnings: number;
  critical_count: number;
  warning_count: number;
  info_count: number;
  total_duplicate_rows: number;
  total_missing_cells: number;
  warnings: QualityWarning[];
  outliers: OutlierDetail[];
}


// ── Insights models (Phase 7) ───────────────────────────────────────────────

export interface InsightEvidence {
  metrics: Record<string, any>;
  affected_columns: string[];
}

export interface Insight {
  insight_id: string;
  priority: "High" | "Medium" | "Low";
  category: "Data Quality" | "Numerical Relationship" | "Categorical Relationship" | "Distribution" | "Recommendation";
  title: string;
  summary: string;
  evidence: InsightEvidence;
  recommended_action: string;
  source_section: string;
}

export interface InsightResult {
  insights: Insight[];
}


// ── ML Readiness models (Phase 9) ───────────────────────────────────────────

export interface TargetAssessment {
  target_name: string;
  inferred_task_type: string;
  user_selected_task_type: string;
  total_values: number;
  missing_values: number;
  unique_values: number;
  data_type: string;
  health_status: string;
  blocking_issues: string[];
}

export interface ClassificationDetails {
  class_counts: Record<string, number>;
  class_percentages: Record<string, number>;
  majority_class_percentage: number;
  minority_class_count: number;
  imbalance_warning: boolean;
  rare_class_warning: boolean;
  enough_samples: boolean;
}

export interface RegressionDetails {
  count: number;
  missing_values: number;
  minimum: number;
  maximum: number;
  mean: number;
  median: number;
  std_dev: number;
  skewness: number | null;
  outlier_summary: string;
  enough_variation: boolean;
}

export interface FeatureReadiness {
  recommended_features: string[];
  excluded_features: Array<{ column: string; reason: string }>;
  potential_risk_columns: string[];
}

export interface LeakageWarning {
  column: string;
  reason: string;
}

export interface Recommendation {
  priority: string;
  action: string;
}

export interface MLReadinessResponse {
  target: TargetAssessment;
  classification: ClassificationDetails | null;
  regression: RegressionDetails | null;
  features: FeatureReadiness;
  leakage: LeakageWarning[];
  recommendations: Recommendation[];
}

// ── Phase 10 Baseline Models ────────────────────────────────────────────────

export interface MetricComparison {
  metric_name: string;
  baseline_score: number;
  dummy_score: number;
  is_better: boolean;
}

export interface ClassificationMetrics {
  accuracy: MetricComparison;
  precision: MetricComparison;
  recall: MetricComparison;
  f1: MetricComparison;
  roc_auc: MetricComparison | null;
  confusion_matrix: number[][];
  classes: string[];
  class_report: any;
}

export interface RegressionMetrics {
  r2: MetricComparison;
  mae: MetricComparison;
  rmse: MetricComparison;
  actual_vs_predicted: Array<{ actual: number; predicted: number }>;
}

export interface BaselineModelResponse {
  task_type: string;
  model_name: string;
  dummy_model_name: string;
  training_rows: number;
  test_rows: number;
  excluded_rows: number;
  selected_features: string[];
  preprocessing_summary: string[];
  classification_metrics: ClassificationMetrics | null;
  regression_metrics: RegressionMetrics | null;
  outperformed_dummy: boolean;
  caveat: string;
}

// ── Upload response ─────────────────────────────────────────────────────────

/** The JSON response returned by POST /api/datasets/upload */
export interface UploadResponse {
  /** Original filename e.g. "sales_data.csv" */
  filename: string;

  /** "CSV" or "XLSX" */
  format: string;

  /** File size in bytes */
  file_size_bytes: number;

  /** Total number of data rows */
  rows: number;

  /** Total number of columns */
  columns: number;

  /** Ordered list of column header names */
  column_names: string[];

  /** First 10 rows as an array of {columnName: value} objects */
  preview: Record<string, unknown>[];

  /** Full dataset profile (Phase 3) */
  profile: DatasetProfile;

  /** Pairwise numerical relationships (Phase 4) */
  relationships?: RelationshipResult;

  /** Categorical relationships (Phase 5) */
  categorical?: CategoricalResult;

  /** Data Quality Warnings (Phase 6) */
  quality?: QualityResult;

  /** Smart Insights (Phase 7) */
  insights?: InsightResult;
}

/** Possible UI states for the upload flow */
export type UploadState = "idle" | "loading" | "success" | "error";
