"""
backend/services/categorical.py

Categorical Relationship Analysis Service.
Computes bias-corrected Cramér's V for cat-cat pairs and One-Way ANOVA / Eta-squared for cat-num pairs.
"""

import math
from typing import Any

import numpy as np
import pandas as pd
from scipy import stats

MAX_CAT_COLS = 15
MAX_NUM_COLS = 15
SAMPLE_THRESHOLD = 50000
MAX_CATEGORIES = 20
MIN_CATEGORY_SIZE = 5

def _get_cramers_v_strength(v: float) -> str:
    if v >= 0.5: return "Strong"
    if v >= 0.3: return "Moderate"
    if v >= 0.1: return "Weak"
    return "Negligible"

def _get_eta_squared_strength(eta2: float) -> str:
    if eta2 >= 0.14: return "Large"
    if eta2 >= 0.06: return "Medium"
    if eta2 >= 0.01: return "Small"
    return "Negligible"

def _safe_float(val: Any) -> float:
    if pd.isna(val) or math.isinf(val):
        return 0.0
    return round(float(val), 4)

def analyze_categorical(df: pd.DataFrame) -> dict[str, Any]:
    info_messages = []
    
    # 1. Row sampling
    if len(df) > SAMPLE_THRESHOLD:
        df = df.sample(n=SAMPLE_THRESHOLD, random_state=42)
        info_messages.append(f"Sampled {SAMPLE_THRESHOLD:,} rows for categorical analysis.")

    # 2. Column filtering
    cat_cols = []
    num_cols = []
    skipped_columns = []
    
    for col in df.columns:
        s = df[col]
        # Skip all null
        if s.isna().all():
            continue # handeled in relationships / profiler generally, but safe to skip
            
        # Is Numeric?
        if pd.api.types.is_numeric_dtype(s):
            # Skip constant
            if s.std() == 0 or s.nunique(dropna=True) <= 1:
                continue
            # Skip ID
            if pd.api.types.is_integer_dtype(s) and s.nunique(dropna=True) == len(s.dropna()):
                name_lower = str(col).lower()
                if name_lower in ("id", "index", "uuid", "guid", "pk") or name_lower.endswith("_id"):
                    continue
            num_cols.append(str(col))
        else:
            # Categorical/Text/Boolean
            # Skip constant
            if s.nunique(dropna=True) <= 1:
                skipped_columns.append({"name": str(col), "reason": "Constant value"})
                continue
            # Skip High Cardinality
            if s.nunique(dropna=True) > MAX_CATEGORIES:
                skipped_columns.append({"name": str(col), "reason": f"Too many unique categories (> {MAX_CATEGORIES})"})
                continue
            # Skip ID-like string (all unique)
            if s.nunique(dropna=True) == len(s.dropna()):
                skipped_columns.append({"name": str(col), "reason": "Likely ID/Unique string column"})
                continue
                
            cat_cols.append(str(col))

    # Apply limits
    if len(cat_cols) > MAX_CAT_COLS:
        for col in cat_cols[MAX_CAT_COLS:]:
            skipped_columns.append({"name": col, "reason": "Excluded due to categorical column limit"})
        cat_cols = cat_cols[:MAX_CAT_COLS]
        info_messages.append(f"Analyzed top {MAX_CAT_COLS} categorical columns to maintain performance.")
        
    if len(num_cols) > MAX_NUM_COLS:
        num_cols = num_cols[:MAX_NUM_COLS]
        info_messages.append(f"Analyzed top {MAX_NUM_COLS} numerical columns for cat-num analysis.")

    cat_cat_pairs = []
    cat_num_pairs = []

    # 3. Cat-Cat Analysis (Cramer's V)
    for i in range(len(cat_cols)):
        for j in range(i + 1, len(cat_cols)):
            col_a = cat_cols[i]
            col_b = cat_cols[j]
            
            pair_df = df[[col_a, col_b]].dropna()
            n = len(pair_df)
            
            if n < MIN_CATEGORY_SIZE * 2:
                continue
                
            # Create contingency table
            crosstab = pd.crosstab(pair_df[col_a], pair_df[col_b])
            
            # If cross tab degenerates to 1x1, skip
            if crosstab.shape[0] < 2 or crosstab.shape[1] < 2:
                continue
                
            try:
                chi2, p, _, _ = stats.chi2_contingency(crosstab)
                # Bias correction for Cramer's V
                r, c = crosstab.shape
                phi2 = chi2 / n
                phi2corr = max(0.0, phi2 - ((k_c_c(r, n)) * (k_c_c(c, n))))
                rcorr = r - ((r - 1) ** 2) / (n - 1)
                ccorr = c - ((c - 1) ** 2) / (n - 1)
                
                v = np.sqrt(phi2corr / min((rcorr - 1), (ccorr - 1)))
                
                cat_cat_pairs.append({
                    "feature_a": col_a,
                    "feature_b": col_b,
                    "cramers_v": _safe_float(v),
                    "p_value": _safe_float(p),
                    "valid_rows": n,
                    "strength": _get_cramers_v_strength(v)
                })
            except Exception:
                pass

    # 4. Cat-Num Analysis (ANOVA + Eta Squared)
    for cat in cat_cols:
        for num in num_cols:
            pair_df = df[[cat, num]].dropna()
            
            # Filter categories with insufficient data
            counts = pair_df[cat].value_counts()
            valid_cats = counts[counts >= MIN_CATEGORY_SIZE].index
            pair_df = pair_df[pair_df[cat].isin(valid_cats)]
            
            n = len(pair_df)
            k = pair_df[cat].nunique()
            
            if k < 2 or n < MIN_CATEGORY_SIZE * 2:
                continue
                
            # Group stats
            groups = []
            group_arrays = []
            
            for cat_val, grp in pair_df.groupby(cat):
                vals = grp[num].values
                group_arrays.append(vals)
                groups.append({
                    "category": str(cat_val),
                    "count": len(vals),
                    "mean": _safe_float(np.mean(vals)),
                    "median": _safe_float(np.median(vals)),
                    "min": _safe_float(np.min(vals)),
                    "max": _safe_float(np.max(vals))
                })
                
            try:
                f_stat, p = stats.f_oneway(*group_arrays)
                
                # Calculate Eta Squared
                overall_mean = pair_df[num].mean()
                ss_total = np.sum((pair_df[num] - overall_mean)**2)
                
                ss_between = 0
                for vals in group_arrays:
                    ss_between += len(vals) * (np.mean(vals) - overall_mean)**2
                    
                eta2 = ss_between / ss_total if ss_total > 0 else 0.0
                
                cat_num_pairs.append({
                    "categorical_feature": cat,
                    "numerical_feature": num,
                    "eta_squared": _safe_float(eta2),
                    "p_value": _safe_float(p),
                    "valid_rows": n,
                    "strength": _get_eta_squared_strength(eta2),
                    "groups": groups
                })
            except Exception:
                pass

    # Sort Cat-Cat
    cat_cat_pairs.sort(key=lambda x: x["cramers_v"], reverse=True)
    top_cat_cat = cat_cat_pairs[:5]
    
    # Sort Cat-Num by eta_squared
    cat_num_pairs.sort(key=lambda x: x["eta_squared"], reverse=True)

    return {
        "cat_columns_analyzed": cat_cols,
        "num_columns_analyzed": num_cols,
        "skipped_columns": skipped_columns,
        "cat_cat_pairs": cat_cat_pairs,
        "cat_num_pairs": cat_num_pairs,
        "top_cat_cat": top_cat_cat,
        "info_messages": info_messages
    }

def k_c_c(dim: int, n: int) -> float:
    # Helper for cramers v bias correction
    return ((dim - 1) ** 2) / (n - 1) if n > 1 else 0

