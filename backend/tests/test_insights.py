"""
backend/tests/test_insights.py

Tests for Phase 7: Smart Insights
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
    return resp.json()["insights"]["insights"]

def test_strong_numerical_insight():
    csv = b"x,y\n1,2\n2,4\n3,6\n4,8\n5,10\n"
    insights = upload(csv)
    
    titles = [i["title"] for i in insights]
    assert "Strong Numerical Correlation" in titles
    
    # Priority sorting check
    for i in insights:
        if i["title"] == "Strong Numerical Correlation":
            assert i["priority"] == "High"
            assert "x" in i["evidence"]["affected_columns"]

def test_clean_bonus_insight():
    # A totally clean random dataset
    csv = b"x,y\n1,5\n2,3\n3,8\n4,1\n5,9\n"
    insights = upload(csv)
    
    titles = [i["title"] for i in insights]
    assert "Dataset Appears Structurally Clean" in titles
    
def test_missing_data_insight():
    csv = b"a,b\n1,1\n2,\n3,\n4,\n5,1\n"
    insights = upload(csv)
    
    titles = [i["title"] for i in insights]
    assert "High Proportion of Missing Data" in titles
    
def test_id_insight():
    csv = "id,val\n" + "\n".join([f"UID{i},{i%2}" for i in range(20)])
    insights = upload(csv.encode())
    
    titles = [i["title"] for i in insights]
    assert "Likely Identifier Column" in titles

