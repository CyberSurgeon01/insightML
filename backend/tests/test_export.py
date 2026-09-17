"""
backend/tests/test_export.py

Tests for Phase 8: Analysis Exports
"""

import io
from fastapi.testclient import TestClient
import sys
import os
import json

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app

client = TestClient(app)

def get_base_response():
    # Helper to generate a baseline UploadResponse
    csv = b"id,val\n1,10\n2,20\n3,30\n"
    resp = client.post(
        "/api/datasets/upload",
        files={"file": ("test.csv", io.BytesIO(csv), "text/csv")},
    )
    return resp.json()

def test_json_export():
    payload = get_base_response()
    resp = client.post("/api/export/json", json=payload)
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/json"
    assert "attachment; filename=" in resp.headers["content-disposition"]
    
    data = resp.json()
    assert "_export_metadata" in data
    assert "insightml_version" in data["_export_metadata"]
    assert "generated_at" in data["_export_metadata"]

def test_csv_export_profile():
    payload = get_base_response()
    resp = client.post("/api/export/csv/profile", json=payload)
    assert resp.status_code == 200, resp.text
    assert resp.headers["content-type"] == "text/csv; charset=utf-8"
    assert "Column Name,Type,Unique Values" in resp.text
    assert "id,categorical" in resp.text or "id,numerical" in resp.text # 'id' type might vary depending on rules

def test_csv_export_invalid():
    payload = get_base_response()
    resp = client.post("/api/export/csv/invalid_type", json=payload)
    assert resp.status_code == 400, resp.text

def test_pdf_export():
    payload = get_base_response()
    resp = client.post("/api/export/pdf", json=payload)
    assert resp.status_code == 200, resp.text
    assert resp.headers["content-type"] == "application/pdf"
    
    # Check if the output actually looks like a PDF signature
    assert resp.content.startswith(b"%PDF-1.")
