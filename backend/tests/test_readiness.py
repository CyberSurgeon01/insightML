"""
backend/tests/test_readiness.py

Tests for Phase 9: ML Readiness
"""

import io
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from main import app

client = TestClient(app)

def test_readiness_classification():
    csv = b"id,feat1,target\nUID1,10,A\nUID2,10,B\nUID3,12,B\nUID4,12,B\nUID5,15,A\n"
    resp = client.post(
        "/api/ml-readiness",
        data={"target_column": "target", "task_type": "auto"},
        files={"file": ("test.csv", io.BytesIO(csv), "text/csv")},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["target"]["inferred_task_type"] == "classification"
    assert data["target"]["health_status"] == "Good"
    
    # Feature tests
    features = data["features"]
    assert "feat1" in features["recommended_features"]
    
    excluded = [e["column"] for e in features["excluded_features"]]
    assert "target" in excluded
    assert "id" in excluded # Likely an identifier
    
    # Classification tests
    assert data["classification"] is not None
    assert data["classification"]["rare_class_warning"] is True # A has 2, B has 3. < 5

def test_readiness_regression():
    # Enough unique values to be continuous
    csv_lines = ["feat1,target,leakage"]
    for i in range(20):
        csv_lines.append(f"{i},{i*1.5},{i*1.5}")
    csv = "\n".join(csv_lines).encode()
    
    resp = client.post(
        "/api/ml-readiness",
        data={"target_column": "target", "task_type": "auto"},
        files={"file": ("test.csv", io.BytesIO(csv), "text/csv")},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    
    assert data["target"]["inferred_task_type"] == "regression"
    assert data["regression"] is not None
    
    # Leakage check
    # 'leakage' column is perfectly correlated (r=1.0) with 'target'
    warnings = [w["column"] for w in data["leakage"]]
    assert "leakage" in warnings

def test_missing_target():
    csv = b"feat1,target\n1,1\n2,\n3,\n"
    resp = client.post(
        "/api/ml-readiness",
        data={"target_column": "target", "task_type": "auto"},
        files={"file": ("test.csv", io.BytesIO(csv), "text/csv")},
    )
    data = resp.json()
    assert data["target"]["missing_values"] == 2
    assert "Address 2 missing values" in data["recommendations"][0]["action"]

def test_target_not_found():
    csv = b"feat1,feat2\n1,1\n2,2\n"
    resp = client.post(
        "/api/ml-readiness",
        data={"target_column": "target", "task_type": "auto"},
        files={"file": ("test.csv", io.BytesIO(csv), "text/csv")},
    )
    assert resp.status_code == 400
    assert "not found" in resp.text
