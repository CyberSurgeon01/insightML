"""
backend/tests/test_quality.py

Tests for Phase 6: Data Quality
"""

import io
from fastapi.testclient import TestClient

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app

client = TestClient(app)

def upload(content: bytes) -> dict:
    resp = client.post(
        "/api/datasets/upload",
        files={"file": ("test.csv", io.BytesIO(content), "text/csv")},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["quality"]

def get_titles(q: dict) -> list[str]:
    return [w["issue_title"] for w in q["warnings"]]

def test_missing_cells_and_columns():
    # 5 rows, 2 columns. 4/10 cells missing = 40% (Dataset level Warning)
    # c2 is 100% missing (Column level Critical)
    csv = b"c1,c2\n1,\n2,\n3,\n,\n,\n"
    q = upload(csv)
    
    assert q["total_missing_cells"] == 7 # wait, c1 has 2 missing, c2 has 5. Total = 7
    titles = get_titles(q)
    assert "High Dataset Sparsity" in titles
    assert "Completely Empty Column" in titles
    
    w_empty = next(w for w in q["warnings"] if w["issue_title"] == "Completely Empty Column")
    assert w_empty["severity"] == "Critical"
    assert "c2" in w_empty["affected_columns"]
    
def test_duplicates():
    csv = b"a,b\n1,1\n1,1\n2,2\n3,3\n3,3\n"
    q = upload(csv)
    assert q["total_duplicate_rows"] == 2
    titles = get_titles(q)
    assert "Duplicate Rows Detected" in titles

def test_constant_and_near_constant():
    csv = b"const,near\nA,A\nA,A\nA,A\nA,A\nA,A\nA,A\nA,A\nA,A\nA,A\nA,A\nA,A\nA,A\nA,A\nA,A\nA,A\nA,A\nA,A\nA,A\nA,A\nA,A\nA,B\n"
    q = upload(csv)
    titles = get_titles(q)
    assert "Constant Column" in titles
    assert "Near-Constant Column" in titles

def test_numerical_outliers():
    # IQR: Q1=10, Q3=10, IQR=0... wait, need variance.
    # 10, 10, 10, 10, 10, 10, 10, 10, 10, 100
    csv = b"num\n10\n11\n12\n10\n11\n12\n10\n11\n12\n100\n"
    q = upload(csv)
    titles = get_titles(q)
    assert "Numerical Outliers" in titles
    assert len(q["outliers"]) == 1
    assert q["outliers"][0]["outlier_count"] == 1
    
def test_whitespace_variants():
    csv = b"cat\nApple\nApple \n Apple \nBanana\n"
    q = upload(csv)
    titles = get_titles(q)
    assert "Whitespace Variants" in titles

def test_id_and_imbalance():
    csv = "id,cat\n"
    for i in range(10):
        c = "A" if i < 9 else "B"
        csv += f"ID{i},{c}\n"
        
    q = upload(csv.encode())
    titles = get_titles(q)
    assert "All Unique Values" in titles
    assert "Categorical Imbalance" in titles
    assert "Categorical Imbalance" in titles
