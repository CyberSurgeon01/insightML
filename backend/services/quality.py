"""
backend/services/quality.py

Data Quality Warnings and Recommendations Service.
Identifies missing values, duplicates, constants, high-cardinality, outliers, and formatting issues.
"""

import uuid
from typing import Any
import pandas as pd
import numpy as np

SAMPLE_THRESHOLD = 50000

def _safe_float(val: Any) -> float:
    if pd.isna(val) or np.isinf(val):
        return 0.0
    return round(float(val), 4)

def analyze_quality(df: pd.DataFrame) -> dict[str, Any]:
    warnings = []
    outliers = []
    
    total_rows = len(df)
    
    # Early exit if empty
    if total_rows == 0:
        return {
            "total_warnings": 0, "critical_count": 0, "warning_count": 0, "info_count": 0,
            "total_duplicate_rows": 0, "total_missing_cells": 0, "warnings": [], "outliers": []
        }
        
    sampled_df = df
    if total_rows > SAMPLE_THRESHOLD:
        sampled_df = df.sample(n=SAMPLE_THRESHOLD, random_state=42)
        n_rows = SAMPLE_THRESHOLD
        sampled = True
    else:
        n_rows = total_rows
        sampled = False

    def add_warning(sev: str, cat: str, cols: list[str], title: str, exp: str, count: int, pct: float, rec: str):
        warnings.append({
            "warning_id": str(uuid.uuid4()),
            "severity": sev,
            "category": cat,
            "affected_columns": cols,
            "issue_title": title,
            "explanation": exp + (" (Calculated from a 50,000 row sample)" if sampled else ""),
            "count": count,
            "percentage": _safe_float(pct),
            "recommendation": rec
        })

    # 1. Dataset-level Missing Cells
    total_cells = total_rows * len(df.columns)
    missing_cells = int(df.isna().sum().sum())
    missing_cells_pct = (missing_cells / total_cells) * 100 if total_cells > 0 else 0
    
    if missing_cells_pct > 5:
        add_warning(
            "Warning", "Missing", [], "High Dataset Sparsity",
            "More than 5% of all cells in the dataset are missing.",
            missing_cells, missing_cells_pct,
            "Investigate the data collection process or consider imputation strategies."
        )

    # 2. Duplicate Rows
    dupes = int(df.duplicated().sum())
    if dupes > 0:
        dupes_pct = (dupes / total_rows) * 100
        add_warning(
            "Warning", "Duplicates", [], "Duplicate Rows Detected",
            "Perfectly identical rows exist in the dataset.",
            dupes, dupes_pct,
            "Verify if duplicates are expected (e.g. valid repeated transactions) or if they should be dropped."
        )

    # Column-level checks
    for col in sampled_df.columns:
        s = sampled_df[col]
        
        # Column Missing Values
        missing = int(s.isna().sum())
        missing_pct = (missing / n_rows) * 100
        
        if missing_pct == 100:
            add_warning("Critical", "Missing", [str(col)], "Completely Empty Column",
                        "The column contains absolutely no data.",
                        missing, missing_pct, "Drop this column as it provides no information.")
            continue  # skip other checks for this column
        elif missing_pct > 20:
            add_warning("Warning", "Missing", [str(col)], "High Missing Values",
                        f"Over 20% of values are missing.",
                        missing, missing_pct, "Consider dropping this column or using robust imputation techniques.")
        elif missing_pct > 0:
            add_warning("Info", "Missing", [str(col)], "Some Missing Values",
                        f"A small portion of the data is missing.",
                        missing, missing_pct, "Impute missing values using mean/median/mode or a predictive model.")

        # Valid rows count
        valid_s = s.dropna()
        n_valid = len(valid_s)
        
        if n_valid == 0:
            continue
            
        n_unique = valid_s.nunique()

        # Constant & Near-constant
        if n_unique == 1:
            add_warning("Info", "Distribution", [str(col)], "Constant Column",
                        "Every valid row has the exact same value.",
                        n_valid, 100.0, "This column has no variance and can likely be dropped before modeling.")
            continue
            
        top_val_count = valid_s.value_counts().iloc[0]
        top_pct = (top_val_count / n_valid) * 100
        
        if top_pct > 95:
            add_warning("Warning", "Distribution", [str(col)], "Near-Constant Column",
                        "A single value dominates more than 95% of the data.",
                        top_val_count, top_pct, "Check if this lack of variance is intentional. It may cause model bias.")

        # Numeric Checks
        if pd.api.types.is_numeric_dtype(s):
            # IQR Outliers
            if n_unique > 2:
                q1 = s.quantile(0.25)
                q3 = s.quantile(0.75)
                iqr = q3 - q1
                if iqr > 0:
                    lower_bound = q1 - 1.5 * iqr
                    upper_bound = q3 + 1.5 * iqr
                    outlier_mask = (valid_s < lower_bound) | (valid_s > upper_bound)
                    outlier_count = int(outlier_mask.sum())
                    
                    if outlier_count > 0:
                        outlier_pct = (outlier_count / n_valid) * 100
                        outliers.append({
                            "column": str(col),
                            "outlier_count": outlier_count,
                            "outlier_percentage": _safe_float(outlier_pct),
                            "lower_bound": _safe_float(lower_bound),
                            "upper_bound": _safe_float(upper_bound)
                        })
                        add_warning("Warning", "Outliers", [str(col)], "Numerical Outliers",
                                    f"Detected {outlier_count} values falling outside the standard 1.5x IQR range.",
                                    outlier_count, outlier_pct, "Investigate if these are data entry errors or valid extreme events.")
                        
        # Categorical/String Checks
        else:
            # High cardinality / ID
            if n_unique == n_valid:
                add_warning("Info", "Distribution", [str(col)], "All Unique Values",
                            "Every value in this column is distinct.",
                            n_unique, 100.0, "If this is an ID or Name column, exclude it before training predictive models.")
            elif n_unique > n_valid * 0.9 and n_valid > 100:
                add_warning("Info", "Distribution", [str(col)], "Extremely High Cardinality",
                            "Over 90% of the values are unique.",
                            n_unique, (n_unique / n_valid) * 100, "Likely an ID, free-text, or unique identifier. Not suitable for standard categorical encoding.")
            else:
                # Category imbalance (one category > 80% but < 95%)
                if 80 < top_pct <= 95:
                    add_warning("Info", "Distribution", [str(col)], "Categorical Imbalance",
                                "One category dominates the column.",
                                top_val_count, top_pct, "Watch out for class imbalance issues if this is a target variable.")
                                
                # Rare categories (count < 5)
                value_counts = valid_s.value_counts()
                rare_cats = value_counts[value_counts < 5]
                if len(rare_cats) > 0:
                    rare_count = len(rare_cats)
                    rare_sum = int(rare_cats.sum())
                    add_warning("Info", "Distribution", [str(col)], "Rare Categories",
                                f"{rare_count} categories appear fewer than 5 times.",
                                rare_sum, (rare_sum / n_valid) * 100, "Consider grouping rare categories into an 'Other' bucket.")

            # Whitespace variance
            if pd.api.types.is_string_dtype(s):
                stripped = valid_s.astype(str).str.strip()
                if stripped.nunique() < n_unique:
                    # e.g., "Cat " and "Cat" became the same
                    diff = n_unique - stripped.nunique()
                    add_warning("Warning", "Format", [str(col)], "Whitespace Variants",
                                "Some categories differ only by leading or trailing whitespace.",
                                diff, (diff / n_unique) * 100, "Strip whitespace from strings to consolidate identical categories.")

            # Mixed Types (roughly)
            # In pandas, object dtype can hold int/float/str.
            if s.dtype == 'object':
                types = valid_s.apply(type).nunique()
                if types > 1:
                    add_warning("Warning", "Format", [str(col)], "Mixed Data Types",
                                "Column contains multiple data types (e.g., both numbers and text).",
                                types, 0.0, "Force a single consistent data type to prevent processing errors.")

    return {
        "total_warnings": len(warnings),
        "critical_count": sum(1 for w in warnings if w["severity"] == "Critical"),
        "warning_count": sum(1 for w in warnings if w["severity"] == "Warning"),
        "info_count": sum(1 for w in warnings if w["severity"] == "Info"),
        "total_duplicate_rows": dupes,
        "total_missing_cells": missing_cells,
        "warnings": warnings,
        "outliers": outliers
    }
