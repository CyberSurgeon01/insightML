"""
backend/services/readiness.py

Phase 9: Evaluates a dataset for ML readiness based on a chosen target column.
Does not train a model, only checks distributions, leakage, and data quality issues.
"""

import pandas as pd
import numpy as np
from models.schemas import (
    MLReadinessResponse,
    TargetAssessment,
    ClassificationDetails,
    RegressionDetails,
    FeatureReadiness,
    LeakageWarning,
    Recommendation
)

def assess_ml_readiness(df: pd.DataFrame, target: str, task_type: str = "auto") -> MLReadinessResponse:
    if target not in df.columns:
        raise ValueError(f"Target column '{target}' not found in dataset.")

    # Convert to appropriate dtype early if needed
    s = df[target]
    total_val = len(s)
    missing_val = s.isna().sum()
    valid_s = s.dropna()
    unique_val = valid_s.nunique()
    dtype_str = str(s.dtype)
    
    # 1. Inferred Task Type
    inferred_type = "classification"
    if pd.api.types.is_numeric_dtype(s):
        if unique_val > 15 and (unique_val / len(valid_s) > 0.05 if len(valid_s) > 0 else True):
            inferred_type = "regression"
            
    final_task_type = inferred_type if task_type == "auto" else task_type
    
    # 2. Target Assessment
    health_status = "Good"
    blocking = []
    if missing_val == total_val:
        health_status = "Critical"
        blocking.append("Target column is completely empty.")
    elif unique_val < 2:
        health_status = "Critical"
        blocking.append("Target must have at least 2 unique values to model.")
    elif missing_val / total_val > 0.2:
        health_status = "Warning"
        blocking.append(f"Target has a high missing rate ({missing_val / total_val:.1%}).")
        
    target_assessment = TargetAssessment(
        target_name=target,
        inferred_task_type=inferred_type,
        user_selected_task_type=task_type,
        total_values=int(total_val),
        missing_values=int(missing_val),
        unique_values=int(unique_val),
        data_type=dtype_str,
        health_status=health_status,
        blocking_issues=blocking
    )
    
    # Recommendations list
    recs = []
    if missing_val > 0:
        recs.append(Recommendation(priority="High", action=f"Address {missing_val} missing values in the target column. Models cannot be trained on rows with missing targets."))
        
    # 3. Task-Specific Details
    cls_details = None
    reg_details = None
    
    if final_task_type == "classification" and unique_val >= 2:
        counts = valid_s.value_counts()
        total_valid = len(valid_s)
        percentages = (counts / total_valid).to_dict()
        maj_pct = float(percentages[counts.index[0]])
        min_count = int(counts.iloc[-1])
        
        imbalance = maj_pct > 0.8
        rare = min_count < 5
        
        if imbalance:
            recs.append(Recommendation(priority="Medium", action="Class imbalance detected. Consider stratified sampling or class weights."))
        if rare:
            recs.append(Recommendation(priority="High", action="Some classes have fewer than 5 examples. Group rare classes or collect more data."))
            
        cls_details = ClassificationDetails(
            class_counts={str(k): int(v) for k, v in counts.to_dict().items()},
            class_percentages={str(k): float(v) for k, v in percentages.items()},
            majority_class_percentage=maj_pct,
            minority_class_count=min_count,
            imbalance_warning=imbalance,
            rare_class_warning=rare,
            enough_samples=not rare
        )
        
    elif final_task_type == "regression" and unique_val >= 2:
        numeric_s = pd.to_numeric(valid_s, errors="coerce").dropna()
        if len(numeric_s) < 2:
            target_assessment.health_status = "Critical"
            target_assessment.blocking_issues.append("Target column could not be parsed as numerical for regression.")
            reg_details = RegressionDetails(
                count=0, missing_values=int(missing_val), minimum=0.0, maximum=0.0,
                mean=0.0, median=0.0, std_dev=0.0, skewness=None,
                outlier_summary="Cannot calculate", enough_variation=False
            )
        else:
            q1 = numeric_s.quantile(0.25)
            q3 = numeric_s.quantile(0.75)
            iqr = q3 - q1
            outliers = numeric_s[(numeric_s < q1 - 1.5 * iqr) | (numeric_s > q3 + 1.5 * iqr)]
            
            skewness = float(numeric_s.skew()) if len(numeric_s) > 2 else None
            
            # Target histogram
            hist_data = []
            try:
                import numpy as np
                counts, bin_edges = np.histogram(numeric_s.dropna(), bins=10)
                for i in range(len(counts)):
                    hist_data.append({
                        "bin_start": float(bin_edges[i]),
                        "bin_end": float(bin_edges[i+1]),
                        "count": int(counts[i])
                    })
            except Exception:
                pass
                
            reg_details = RegressionDetails(
                count=len(numeric_s),
                missing_values=int(total_val - len(numeric_s)),
                minimum=float(numeric_s.min()),
                maximum=float(numeric_s.max()),
                mean=float(numeric_s.mean()),
                median=float(numeric_s.median()),
                std_dev=float(numeric_s.std()),
                skewness=skewness,
                outlier_summary=f"{len(outliers)} rows ({len(outliers)/len(numeric_s):.1%}) are potential outliers.",
                enough_variation=bool(numeric_s.std() > 0),
                target_histogram=hist_data
            )
            
            if skewness and abs(skewness) > 1.0:
                recs.append(Recommendation(priority="Low", action="Target is heavily skewed. Consider log-transforming if using linear models."))

    # 4 & 5. Feature Readiness & Leakage
    rec_features = []
    excl_features = []
    risks = []
    leakage = []
    
    # Fast numerical conversion for leakage checks
    is_target_numeric = pd.api.types.is_numeric_dtype(s)
    
    for c in df.columns:
        if c == target:
            excl_features.append({"column": c, "reason": "Target column cannot be a feature."})
            continue
            
        col_s = df[c]
        c_missing = col_s.isna().sum()
        c_unique = col_s.nunique()
        
        # Leakage 1: Exact duplicates
        # Compare if they have exactly the same values where both are not null
        if c_missing == missing_val and c_unique == unique_val:
            try:
                # Basic equality check on valid rows
                if df[c].equals(df[target]):
                    leakage.append(LeakageWarning(column=c, reason="Exact duplicate of the target column."))
                    risks.append(c)
                    excl_features.append({"column": c, "reason": "Possible Leakage: Exact duplicate of target."})
                    continue
            except:
                pass

        if c_unique <= 1:
            excl_features.append({"column": c, "reason": "Constant or empty column offers no predictive power."})
            continue
            
        if c_missing / total_val > 0.5:
            excl_features.append({"column": c, "reason": "Too many missing values (>50%)."})
            continue
            
        # ID check heuristic
        if pd.api.types.is_string_dtype(col_s) or pd.api.types.is_object_dtype(col_s):
            # If every string is unique and it's full of data
            if c_unique == len(col_s.dropna()):
                excl_features.append({"column": c, "reason": "Likely an identifier (100% unique string values)."})
                continue
                
        # Leakage 2: High numerical correlation
        if final_task_type == "regression" and is_target_numeric and pd.api.types.is_numeric_dtype(col_s):
            try:
                corr = float(valid_s.corr(col_s))
                if abs(corr) > 0.98:
                    leakage.append(LeakageWarning(column=c, reason=f"Extremely high correlation ({corr:.2f}) with target."))
                    risks.append(c)
            except:
                pass
                
        rec_features.append(c)

    if leakage:
        recs.append(Recommendation(priority="High", action="Review possible leakage features manually. They might contain the target's answer."))

    if not rec_features:
        recs.append(Recommendation(priority="High", action="No valid features remain. Ensure your dataset has predictive columns."))
    else:
        recs.append(Recommendation(priority="Medium", action=f"Proceed with {len(rec_features)} recommended features. Apply encoding for categoricals and scaling if required."))

    feature_readiness = FeatureReadiness(
        recommended_features=rec_features,
        excluded_features=excl_features,
        potential_risk_columns=risks
    )

    return MLReadinessResponse(
        target=target_assessment,
        classification=cls_details,
        regression=reg_details,
        features=feature_readiness,
        leakage=leakage,
        recommendations=recs
    )
