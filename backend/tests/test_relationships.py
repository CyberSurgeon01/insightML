"""
backend/tests/test_relationships.py

Pytest tests for Phase 4 relationships module.
"""

import io
import pytest
from fastapi.testclient import TestClient

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app
from services.relationships import _get_strength

client = TestClient(app)

def upload(content: bytes, filename: str = "test.csv") -> dict:
    resp = client.post(
        "/api/datasets/upload",
        files={"file": (filename, io.BytesIO(content), "text/csv")},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["relationships"]

def test_perfect_positive():
    csv = b"x,y\n1,2\n2,4\n3,6\n4,8\n5,10\n"
    r = upload(csv)
    assert len(r["pairs"]) == 1
    pair = r["pairs"][0]
    assert pair["feature_a"] == "x"
    assert pair["feature_b"] == "y"
    assert pair["pearson"] == 1.0
    assert pair["strength"] == "Strong"

def test_perfect_negative():
    csv = b"a,b\n1,10\n2,8\n3,6\n4,4\n5,2\n"
    r = upload(csv)
    assert len(r["pairs"]) == 1
    pair = r["pairs"][0]
    assert pair["pearson"] == -1.0
    assert pair["strength"] == "Strong"

def test_weak_relationship():
    # Little to no correlation
    csv = b"a,b\n1,10\n2,100\n3,2\n4,40\n5,9\n"
    r = upload(csv)
    assert len(r["pairs"]) == 1
    pair = r["pairs"][0]
    assert abs(pair["pearson"]) < 0.3
    assert pair["strength"] == "Negligible" or pair["strength"] == "Weak"

def test_nonlinear_relationship():
    # x and x^2 with more points so MI regression detects it
    csv = b"x,y\n-3,9\n-2,4\n-1,1\n0,0\n1,1\n2,4\n3,9\n-4,16\n4,16\n"
    r = upload(csv)
    pair = r["pairs"][0]
    # Pearson should be 0 because it's symmetric around Y axis, but MI should be > 0
    assert pair["pearson"] == 0.0
    assert pair["mutual_information"] > 0

def test_missing_values():
    csv = b"x,y\n1,2\n2,\n3,6\n4,8\n,10\n5,10\n"
    r = upload(csv)
    pair = r["pairs"][0]
    assert pair["valid_rows"] == 4  # (1,2), (3,6), (4,8), (5,12)
    assert pair["pearson"] == 1.0

def test_constant_column_skipped():
    csv = b"a,b,c\n1,2,5\n2,4,5\n3,6,5\n4,8,5\n"
    r = upload(csv)
    # c is constant, should be skipped
    assert "c" not in r["columns_analyzed"]
    skipped = [s["name"] for s in r["skipped_columns"]]
    assert "c" in skipped
    
    reasons = [s["reason"] for s in r["skipped_columns"] if s["name"] == "c"]
    assert "Constant value" in reasons[0]

def test_id_column_skipped():
    # sequential ID
    csv = b"id,val\n1,10\n2,20\n3,30\n4,40\n5,50\n"
    r = upload(csv)
    assert "id" not in r["columns_analyzed"]
    skipped = [s["name"] for s in r["skipped_columns"]]
    assert "id" in skipped
    
def test_fewer_than_two_columns():
    csv = b"a,b\n1,hello\n2,world\n3,test\n"
    r = upload(csv)
    assert len(r["columns_analyzed"]) == 1
    assert len(r["pairs"]) == 0
    assert len(r["correlation_matrix"]["values"]) == 1
    
def test_correlation_matrix_shape():
    csv = b"x,y,z\n1,2,3\n2,4,9\n3,6,12\n4,8,15\n"
    r = upload(csv)
    cols = r["correlation_matrix"]["columns"]
    vals = r["correlation_matrix"]["values"]
    assert len(cols) == 3
    assert len(vals) == 3
    assert len(vals[0]) == 3
    assert vals[0][0] == 1.0
    assert vals[1][1] == 1.0
    assert vals[2][2] == 1.0

def test_strength_helper():
    assert _get_strength(0.8, 0.5) == "Strong"
    assert _get_strength(-0.75, 0.2) == "Strong"
    assert _get_strength(0.3, 0.45) == "Moderate"
    assert _get_strength(0.1, -0.25) == "Weak"
    assert _get_strength(0.05, 0.15) == "Negligible"
