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
}

/** Possible UI states for the upload flow */
export type UploadState = "idle" | "loading" | "success" | "error";
