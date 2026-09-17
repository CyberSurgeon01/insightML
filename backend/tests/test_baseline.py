"""
backend/tests/test_baseline.py

Tests for Phase 10: Baseline Model Training.
"""

import io
import json
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from main import app

client = TestClient(app)

def test_baseline_classification():
    csv_lines = ["feat1,feat2,target"]
    for i in range(100):
        # class 0 vs 1
        t = "A" if i % 2 == 0 else "B"
        csv_lines.append(f"{i},{i%3},{t}")
    csv = "\n".join(csv_lines).encode()
    
    features = json.dumps(["feat1", "feat2"])
    
    resp = client.post(
        "/api/models/baseline",
        data={
            "target_column": "target",
            "task_type": "classification",
            "features": features,
            "leakage_confirmed": True
        },
        files={"file": ("test.csv", io.BytesIO(csv), "text/csv")},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    
    assert data["task_type"] == "classification"
    assert data["training_rows"] == 80
    assert data["test_rows"] == 20
    assert data["classification_metrics"] is not None
    assert "accuracy" in data["classification_metrics"]
    assert len(data["classification_metrics"]["confusion_matrix"]) == 2

def test_baseline_regression():
    csv_lines = ["feat1,feat2,target"]
    for i in range(100):
        csv_lines.append(f"{i},{i*2},{i*1.5}")
    csv = "\n".join(csv_lines).encode()
    
    features = json.dumps(["feat1", "feat2"])
    
    resp = client.post(
        "/api/models/baseline",
        data={
            "target_column": "target",
            "task_type": "regression",
            "features": features,
            "leakage_confirmed": True
        },
        files={"file": ("test.csv", io.BytesIO(csv), "text/csv")},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    
    assert data["task_type"] == "regression"
    assert data["regression_metrics"] is not None
    assert "rmse" in data["regression_metrics"]
    
def test_missing_target_dropped():
    csv_lines = ["feat1,feat2,target"]
    for i in range(50):
        csv_lines.append(f"{i},{i*2},{i*1.5}")
    # Add 5 rows with missing targets
    for i in range(5):
        csv_lines.append(f"{i},{i*2},")
    csv = "\n".join(csv_lines).encode()
    
    features = json.dumps(["feat1", "feat2"])
    
    resp = client.post(
        "/api/models/baseline",
        data={
            "target_column": "target",
            "task_type": "regression",
            "features": features,
            "leakage_confirmed": True
        },
        files={"file": ("test.csv", io.BytesIO(csv), "text/csv")},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    
    assert data["excluded_rows"] == 5
    assert data["training_rows"] + data["test_rows"] == 50
