"""
backend/tests/test_categorical.py

Pytest tests for Phase 5 categorical relationships module.
"""

import io
import pytest
from fastapi.testclient import TestClient

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app

client = TestClient(app)

def upload(content: bytes, filename: str = "test.csv") -> dict:
    resp = client.post(
        "/api/datasets/upload",
        files={"file": (filename, io.BytesIO(content), "text/csv")},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["categorical"]

def test_strong_cat_cat():
    # Exactly matching categories (perfect association)
    # 10 rows minimum needed to pass the MIN_CATEGORY_SIZE * 2 (which is 10)
    # Department vs Location
    csv = b"""dept,loc
HR,NY
HR,NY
HR,NY
HR,NY
HR,NY
IT,CA
IT,CA
IT,CA
IT,CA
IT,CA
"""
    c = upload(csv)
    assert "dept" in c["cat_columns_analyzed"]
    assert len(c["cat_cat_pairs"]) == 1
    pair = c["cat_cat_pairs"][0]
    assert pair["cramers_v"] > 0.8
    assert pair["strength"] == "Strong"

def test_independent_cat_cat():
    # Distributed evenly
    csv = b"""c1,c2
A,X
A,X
A,X
A,Y
A,Y
A,Y
B,X
B,X
B,X
B,Y
B,Y
B,Y
"""
    c = upload(csv)
    assert len(c["cat_cat_pairs"]) == 1
    pair = c["cat_cat_pairs"][0]
    assert pair["cramers_v"] < 0.2
    assert pair["strength"] == "Negligible" or pair["strength"] == "Weak"

def test_strong_cat_num():
    # IT gets 100k, HR gets 50k
    csv = b"""dept,salary
HR,50000
HR,51000
HR,49000
HR,50500
HR,49500
IT,100000
IT,101000
IT,99000
IT,100500
IT,99500
"""
    c = upload(csv)
    assert len(c["cat_num_pairs"]) == 1
    pair = c["cat_num_pairs"][0]
    assert pair["categorical_feature"] == "dept"
    assert pair["numerical_feature"] == "salary"
    assert pair["eta_squared"] > 0.8
    assert pair["strength"] == "Large"
    
    # Check groups
    groups = {g["category"]: g for g in pair["groups"]}
    assert groups["HR"]["mean"] == 50000
    assert groups["IT"]["mean"] == 100000

def test_high_cardinality_skipped():
    # Generate 25 unique names to trigger MAX_CATEGORIES (20)
    csv = "name,val\n" + "\n".join([f"Name{i},{i}" for i in range(25)])
    c = upload(csv.encode())
    
    assert "name" not in c["cat_columns_analyzed"]
    skipped = [s["name"] for s in c["skipped_columns"]]
    assert "name" in skipped

def test_constant_skipped():
    csv = b"""c1,c2
A,1
A,2
A,3
A,4
A,5
"""
    c = upload(csv)
    assert "c1" not in c["cat_columns_analyzed"]
    skipped = [s["name"] for s in c["skipped_columns"]]
    assert "c1" in skipped

