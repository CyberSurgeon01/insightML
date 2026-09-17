"""
backend/services/relationships.py

Dataset relationship analysis service. Calculates Pearson, Spearman, and 
Mutual Information for pairs of numerical columns.

Performance guards:
- Max numerical columns analyzed: 30
- Row sampling for >50k rows
"""

import math
from typing import Any

import numpy as np
import pandas as pd
from scipy import stats
from sklearn.feature_selection import mutual_info_regression

MAX_COLS = 30
SAMPLE_THRESHOLD = 50000

def _get_strength(pearson: float, spearman: float) -> str:
    val = max(abs(pearson), abs(spearman))
    if val >= 0.7:
        return "Strong"
    elif val >= 0.4:
        return "Moderate"
    elif val >= 0.2:
        return "Weak"
    return "Negligible"

def _safe_float(val: Any) -> float:
    if pd.isna(val) or math.isinf(val):
        return 0.0
    return round(float(val), 4)

def analyze_relationships(df: pd.DataFrame) -> dict[str, Any]:
    info_messages = []
    
    # 1. Row sampling
    if len(df) > SAMPLE_THRESHOLD:
        df = df.sample(n=SAMPLE_THRESHOLD, random_state=42)
        info_messages.append(f"Sampled {SAMPLE_THRESHOLD:,} rows for relationship analysis.")

    # 2. Column filtering
    numeric_cols = []
    skipped_columns = []
    
    for col in df.columns:
        if not pd.api.types.is_numeric_dtype(df[col]):
            continue
            
        s = df[col]
        # Skip all null
        if s.isna().all():
            skipped_columns.append({"name": str(col), "reason": "All values are missing"})
            continue
            
        # Skip constant
        if s.nunique(dropna=True) <= 1 or s.std() == 0:
            skipped_columns.append({"name": str(col), "reason": "Constant value"})
            continue
            
        # Skip likely IDs: unique count == total rows AND name suggests ID
        if pd.api.types.is_integer_dtype(s) and s.nunique(dropna=True) == len(s.dropna()):
            name_lower = str(col).lower()
            if name_lower in ("id", "index", "uuid", "guid", "pk") or name_lower.endswith("_id"):
                skipped_columns.append({"name": str(col), "reason": "Likely ID column"})
                continue
            
        numeric_cols.append(str(col))

    # Apply column limit
    if len(numeric_cols) > MAX_COLS:
        skipped_for_limit = numeric_cols[MAX_COLS:]
        numeric_cols = numeric_cols[:MAX_COLS]
        info_messages.append(f"Analyzed top {MAX_COLS} numerical columns to maintain performance.")
        for col in skipped_for_limit:
            skipped_columns.append({"name": col, "reason": "Excluded due to column limit"})

    # Initialize correlation matrix
    n_cols = len(numeric_cols)
    corr_matrix = [[None for _ in range(n_cols)] for _ in range(n_cols)]
    for i in range(n_cols):
        corr_matrix[i][i] = 1.0

    pairs = []
    scatter_samples = {}

    # 3. Analyze pairs
    for i in range(n_cols):
        col_a = numeric_cols[i]
        for j in range(i + 1, n_cols):
            col_b = numeric_cols[j]
            
            # Drop rows where either is null
            pair_df = df[[col_a, col_b]].dropna()
            valid_rows = len(pair_df)
            
            if valid_rows < 3:
                continue
                
            x = pair_df[col_a].values
            y = pair_df[col_b].values
            
            # Standard dev check after dropna to avoid divide-by-zero warnings in scipy
            if np.std(x) == 0 or np.std(y) == 0:
                continue

            # Pearson
            try:
                p_corr, _ = stats.pearsonr(x, y)
                if np.isnan(p_corr): p_corr = 0.0
            except Exception:
                p_corr = 0.0
                
            # Spearman
            try:
                s_corr, _ = stats.spearmanr(x, y)
                if np.isnan(s_corr): s_corr = 0.0
            except Exception:
                s_corr = 0.0
                
            # Mutual info
            try:
                # reshape x for sklearn
                mi = mutual_info_regression(x.reshape(-1, 1), y, random_state=42)[0]
            except Exception:
                mi = 0.0
                
            p_corr_rounded = _safe_float(p_corr)
            corr_matrix[i][j] = p_corr_rounded
            corr_matrix[j][i] = p_corr_rounded
            
            pairs.append({
                "feature_a": col_a,
                "feature_b": col_b,
                "pearson": p_corr_rounded,
                "spearman": _safe_float(s_corr),
                "mutual_information": _safe_float(mi),
                "valid_rows": valid_rows,
                "strength": _get_strength(p_corr, s_corr)
            })
            
            if col_a not in scatter_samples: scatter_samples[col_a] = {}
            if col_b not in scatter_samples: scatter_samples[col_b] = {}
            
            # Sample max 100 points
            if valid_rows > 100:
                indices = np.random.choice(valid_rows, 100, replace=False)
                x_sample = x[indices]
                y_sample = y[indices]
            else:
                x_sample = x
                y_sample = y
                
            sample_data = [{"x": float(a), "y": float(b)} for a, b in zip(x_sample, y_sample)]
            scatter_samples[col_a][col_b] = sample_data
            scatter_samples[col_b][col_a] = [{"x": float(b), "y": float(a)} for a, b in zip(x_sample, y_sample)]

    # 4. Sorting & Top 5
    # Sort by absolute pearson (or spearman if pearson is missing), descending
    pairs.sort(key=lambda p: max(abs(p["pearson"]), abs(p["spearman"])), reverse=True)
    top_relationships = pairs[:5]

    return {
        "columns_analyzed": numeric_cols,
        "skipped_columns": skipped_columns,
        "pairs": pairs,
        "top_relationships": top_relationships,
        "correlation_matrix": {
            "columns": numeric_cols,
            "values": corr_matrix
        },
        "scatter_samples": scatter_samples,
        "info_messages": info_messages
    }
