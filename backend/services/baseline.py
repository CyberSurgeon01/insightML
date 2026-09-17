"""
backend/services/baseline.py

Phase 10: Baseline Model Training and Evaluation.
Trains a basic model against a dummy model to establish a performance floor.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.dummy import DummyClassifier, DummyRegressor
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, confusion_matrix,
    roc_auc_score, classification_report,
    mean_absolute_error, mean_squared_error, r2_score
)

from models.schemas import (
    BaselineModelResponse,
    ClassificationMetrics,
    RegressionMetrics,
    MetricComparison
)

def train_baseline(df: pd.DataFrame, target: str, task_type: str, features: list[str]) -> BaselineModelResponse:
    # 1. Clean data and apply limits
    if target not in df.columns:
        raise ValueError("Target column not found.")
        
    initial_rows = len(df)
    
    # Fast drop NA targets
    df = df.dropna(subset=[target]).copy()
    excluded_rows = initial_rows - len(df)
    
    if len(df) < 10:
        raise ValueError("Insufficient data to train a model (need at least 10 rows).")
        
    # Cap dataset size for quick baseline (100k rows)
    if len(df) > 100000:
        df = df.sample(100000, random_state=42)
        
    # Keep only target and selected features
    available_features = [f for f in features if f in df.columns and f != target]
    if not available_features:
        raise ValueError("No valid features provided for modeling.")
        
    X = df[available_features]
    y = df[target]
    
    # 2. Identify numeric vs categorical
    numeric_features = []
    categorical_features = []
    
    for c in X.columns:
        if pd.api.types.is_numeric_dtype(X[c]):
            numeric_features.append(c)
        else:
            categorical_features.append(c)
            
    # 3. Create Preprocessing Pipeline
    transformers = []
    prep_summary = []
    
    if numeric_features:
        num_transformer = Pipeline(steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler())
        ])
        transformers.append(("num", num_transformer, numeric_features))
        prep_summary.append(f"Numeric ({len(numeric_features)}): median imputation, standard scaling.")
        
    if categorical_features:
        # Avoid exploding one-hot encoder on high cardinality if they slipped through
        # But we assume phase 9 readiness filtered them.
        cat_transformer = Pipeline(steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False, max_categories=50))
        ])
        transformers.append(("cat", cat_transformer, categorical_features))
        prep_summary.append(f"Categorical ({len(categorical_features)}): mode imputation, one-hot encoding (max 50 cats).")
        
    preprocessor = ColumnTransformer(transformers=transformers)
    
    # 4. Stratification & Split
    stratify = None
    if task_type == "classification":
        # Check if we can stratify (all classes must have >= 2 samples)
        class_counts = y.value_counts()
        if all(class_counts >= 2):
            stratify = y

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=stratify
    )
    
    # 5. Fit Models & Evaluate
    if task_type == "classification":
        dummy = DummyClassifier(strategy="most_frequent", random_state=42)
        model = LogisticRegression(max_iter=1000, random_state=42, n_jobs=-1)
        
        # Pipelines
        dummy_pipe = Pipeline(steps=[("preprocessor", preprocessor), ("classifier", dummy)])
        model_pipe = Pipeline(steps=[("preprocessor", preprocessor), ("classifier", model)])
        
        dummy_pipe.fit(X_train, y_train)
        model_pipe.fit(X_train, y_train)
        
        y_pred = model_pipe.predict(X_test)
        y_pred_dummy = dummy_pipe.predict(X_test)
        
        classes = list(np.unique(y_train)) # list of original class names
        
        # Weighted metrics
        acc = accuracy_score(y_test, y_pred)
        dummy_acc = accuracy_score(y_test, y_pred_dummy)
        
        prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
        dummy_prec = precision_score(y_test, y_pred_dummy, average="weighted", zero_division=0)
        
        rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
        dummy_rec = recall_score(y_test, y_pred_dummy, average="weighted", zero_division=0)
        
        f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
        dummy_f1 = f1_score(y_test, y_pred_dummy, average="weighted", zero_division=0)
        
        # ROC AUC
        roc_auc_metric = None
        if len(classes) == 2:
            try:
                y_prob = model_pipe.predict_proba(X_test)[:, 1]
                y_prob_dummy = dummy_pipe.predict_proba(X_test)[:, 1]
                
                # convert y_test to binary based on the positive class (classes[1])
                pos_class = classes[1]
                y_test_bin = (y_test == pos_class).astype(int)
                
                roc = roc_auc_score(y_test_bin, y_prob)
                d_roc = roc_auc_score(y_test_bin, y_prob_dummy)
                
                roc_auc_metric = MetricComparison(
                    metric_name="ROC AUC",
                    baseline_score=float(roc),
                    dummy_score=float(d_roc),
                    is_better=bool(roc > d_roc)
                )
            except Exception:
                pass
                
        cm = confusion_matrix(y_test, y_pred, labels=classes)
        cr = classification_report(y_test, y_pred, labels=classes, output_dict=True, zero_division=0)
        
        outperformed = bool(f1 > dummy_f1 and acc > dummy_acc)
        
        cls_metrics = ClassificationMetrics(
            accuracy=MetricComparison(metric_name="Accuracy", baseline_score=float(acc), dummy_score=float(dummy_acc), is_better=bool(acc > dummy_acc)),
            precision=MetricComparison(metric_name="Precision (Weighted)", baseline_score=float(prec), dummy_score=float(dummy_prec), is_better=bool(prec > dummy_prec)),
            recall=MetricComparison(metric_name="Recall (Weighted)", baseline_score=float(rec), dummy_score=float(dummy_rec), is_better=bool(rec > dummy_rec)),
            f1=MetricComparison(metric_name="F1 Score (Weighted)", baseline_score=float(f1), dummy_score=float(dummy_f1), is_better=bool(f1 > dummy_f1)),
            roc_auc=roc_auc_metric,
            confusion_matrix=cm.tolist(),
            classes=[str(c) for c in classes],
            class_report=cr
        )
        
        return BaselineModelResponse(
            task_type="classification",
            model_name="Logistic Regression",
            dummy_model_name="Dummy Classifier (Most Frequent)",
            training_rows=len(X_train),
            test_rows=len(X_test),
            excluded_rows=excluded_rows,
            selected_features=available_features,
            preprocessing_summary=prep_summary,
            classification_metrics=cls_metrics,
            regression_metrics=None,
            outperformed_dummy=outperformed,
            caveat="These results are an initial baseline on a held-out test split. Further validation is required before real-world use."
        )

    elif task_type == "regression":
        y_train_num = pd.to_numeric(y_train, errors="coerce").fillna(0)
        y_test_num = pd.to_numeric(y_test, errors="coerce").fillna(0)
        
        dummy = DummyRegressor(strategy="mean")
        model = Ridge(random_state=42)
        
        dummy_pipe = Pipeline(steps=[("preprocessor", preprocessor), ("regressor", dummy)])
        model_pipe = Pipeline(steps=[("preprocessor", preprocessor), ("regressor", model)])
        
        dummy_pipe.fit(X_train, y_train_num)
        model_pipe.fit(X_train, y_train_num)
        
        y_pred = model_pipe.predict(X_test)
        y_pred_dummy = dummy_pipe.predict(X_test)
        
        mae = mean_absolute_error(y_test_num, y_pred)
        dummy_mae = mean_absolute_error(y_test_num, y_pred_dummy)
        
        rmse = float(np.sqrt(mean_squared_error(y_test_num, y_pred)))
        dummy_rmse = float(np.sqrt(mean_squared_error(y_test_num, y_pred_dummy)))
        
        r2 = r2_score(y_test_num, y_pred)
        dummy_r2 = r2_score(y_test_num, y_pred_dummy)
        
        # Sub-sample scatter plot points (max 200 points) to save payload size
        num_points = min(200, len(y_test_num))
        indices = np.random.choice(len(y_test_num), num_points, replace=False)
        y_test_sample = np.array(y_test_num)[indices]
        y_pred_sample = y_pred[indices]
        
        actual_vs_predicted = [
            {"actual": float(a), "predicted": float(p)}
            for a, p in zip(y_test_sample, y_pred_sample)
        ]
        
        outperformed = bool(r2 > dummy_r2 and mae < dummy_mae)
        
        reg_metrics = RegressionMetrics(
            r2=MetricComparison(metric_name="R² Score", baseline_score=float(r2), dummy_score=float(dummy_r2), is_better=bool(r2 > dummy_r2)),
            mae=MetricComparison(metric_name="Mean Absolute Error", baseline_score=float(mae), dummy_score=float(dummy_mae), is_better=bool(mae < dummy_mae)),
            rmse=MetricComparison(metric_name="RMSE", baseline_score=float(rmse), dummy_score=float(dummy_rmse), is_better=bool(rmse < dummy_rmse)),
            actual_vs_predicted=actual_vs_predicted
        )
        
        return BaselineModelResponse(
            task_type="regression",
            model_name="Ridge Regression",
            dummy_model_name="Dummy Regressor (Mean)",
            training_rows=len(X_train),
            test_rows=len(X_test),
            excluded_rows=excluded_rows,
            selected_features=available_features,
            preprocessing_summary=prep_summary,
            classification_metrics=None,
            regression_metrics=reg_metrics,
            outperformed_dummy=outperformed,
            caveat="These results are an initial baseline on a held-out test split. Further validation is required before real-world use."
        )
    else:
        raise ValueError(f"Unknown task type: {task_type}")

