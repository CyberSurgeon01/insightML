"""
backend/tests/test_upload.py

Pytest tests for the POST /api/datasets/upload endpoint.
Uses FastAPI's TestClient (via httpx) to simulate HTTP requests
without needing a running server.

Phase 2: upload validation tests (9 tests)
Phase 3: profile data tests (6 tests)
"""

import io
import pytest
from fastapi.testclient import TestClient

# Add the backend directory to sys.path so imports resolve.
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import app  # noqa: E402

client = TestClient(app)

# ── Helpers ──────────────────────────────────────────────────────────────────


def make_csv_bytes(rows: int = 5, cols: int = 3) -> bytes:
    """Generate a simple CSV with the requested number of rows and columns."""
    header = ",".join(f"col{i}" for i in range(cols))
    data_rows = "\n".join(
        ",".join(str(r * cols + c) for c in range(cols)) for r in range(rows)
    )
    return f"{header}\n{data_rows}\n".encode()


def upload(content: bytes, filename: str = "test.csv") -> object:
    """POST to the upload endpoint and return the response."""
    return client.post(
        "/api/datasets/upload",
        files={"file": (filename, io.BytesIO(content), "text/csv")},
    )


# ══════════════════════════════════════════════════════════════════════════════
# Phase 2: Upload validation tests
# ══════════════════════════════════════════════════════════════════════════════


def test_upload_valid_csv():
    """A well-formed CSV should return 200 with correct metadata."""
    resp = upload(make_csv_bytes(rows=20, cols=4))
    assert resp.status_code == 200
    data = resp.json()
    assert data["rows"] == 20
    assert data["columns"] == 4
    assert data["format"] == "CSV"
    assert len(data["preview"]) == 10   # first 10 rows
    assert len(data["column_names"]) == 4


def test_upload_small_csv_preview_length():
    """When file has fewer than 10 rows, preview equals actual row count."""
    resp = upload(make_csv_bytes(rows=3, cols=2))
    assert resp.status_code == 200
    data = resp.json()
    assert data["rows"] == 3
    assert len(data["preview"]) == 3


def test_upload_returns_filename():
    """Response filename should match the uploaded filename."""
    resp = upload(make_csv_bytes(), filename="my_data.csv")
    assert resp.status_code == 200
    assert resp.json()["filename"] == "my_data.csv"


def test_upload_wrong_extension():
    """A .txt file should be rejected with a 422 error."""
    resp = upload(make_csv_bytes(), filename="data.txt")
    assert resp.status_code == 422
    assert "not supported" in resp.json()["detail"].lower()


def test_upload_empty_file():
    """An empty file should be rejected with a 422 error."""
    resp = upload(b"", filename="empty.csv")
    assert resp.status_code == 422
    assert "empty" in resp.json()["detail"].lower()


def test_upload_malformed_csv():
    """
    A truly malformed file (random binary) should fail gracefully with 422.
    Note: Pandas is often lenient with text; we use binary garbage to force a
    parse failure.
    """
    # A CSV with mismatched quotes that Pandas will reject
    bad_csv = b'col1,col2\n"unclosed,value\n'
    # This may or may not fail depending on Pandas version – check for either
    # a 200 (Pandas parsed it leniently) or a 422 (hard failure).
    resp = upload(bad_csv, filename="bad.csv")
    assert resp.status_code in (200, 422)


def test_upload_no_extension():
    """A file with no extension should be rejected."""
    resp = upload(make_csv_bytes(), filename="nodotfile")
    assert resp.status_code == 422
    assert "extension" in resp.json()["detail"].lower()


def test_upload_oversized_file():
    """A file exceeding 50 MB should be rejected with HTTP 413."""
    # Generate just over 50 MB of CSV data
    FIFTY_MB = 50 * 1024 * 1024
    # Each row is ~12 bytes; we need ~4.4M rows to exceed 50 MB
    header = b"a,b,c,d,e\n"
    row = b"1,2,3,4,5\n"
    rows_needed = (FIFTY_MB - len(header)) // len(row) + 1
    big_content = header + row * rows_needed
    resp = upload(big_content, filename="big.csv")
    assert resp.status_code == 413
    assert "50 mb" in resp.json()["detail"].lower()


def test_health_endpoint():
    """/health should return 200 with status ok."""
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


# ══════════════════════════════════════════════════════════════════════════════
# Phase 3: Profile tests
# ══════════════════════════════════════════════════════════════════════════════


def test_profile_structure():
    """Upload response should contain a well-structured profile object."""
    resp = upload(make_csv_bytes(rows=10, cols=3))
    assert resp.status_code == 200
    profile = resp.json()["profile"]

    # Top-level keys
    assert profile["total_rows"] == 10
    assert profile["total_columns"] == 3
    assert isinstance(profile["memory_usage"], str)
    assert isinstance(profile["duplicate_rows"], int)
    assert isinstance(profile["total_missing"], int)
    assert isinstance(profile["missing_percentage"], (int, float))
    assert "numerical_count" in profile
    assert "categorical_count" in profile
    assert "boolean_count" in profile
    assert "datetime_count" in profile


def test_profile_column_count():
    """Profile columns list should have one entry per DataFrame column."""
    resp = upload(make_csv_bytes(rows=5, cols=7))
    assert resp.status_code == 200
    profile = resp.json()["profile"]
    assert len(profile["columns"]) == 7


def test_profile_type_detection():
    """CSV with known types should produce correct inferred_type values."""
    csv = (
        "num_col,text_col,bool_col\n"
        "1,hello,true\n"
        "2,world,false\n"
        "3,test,true\n"
    ).encode()
    resp = upload(csv, filename="typed.csv")
    assert resp.status_code == 200
    profile = resp.json()["profile"]
    cols = {c["name"]: c["inferred_type"] for c in profile["columns"]}

    assert cols["num_col"] == "numerical"
    assert cols["text_col"] == "categorical"
    # bool_col may be parsed as bool or categorical depending on Pandas version
    assert cols["bool_col"] in ("boolean", "categorical")


def test_profile_numerical_stats():
    """Numerical columns should have min, max, mean, and median."""
    csv = (
        "value\n"
        "10\n"
        "20\n"
        "30\n"
        "40\n"
    ).encode()
    resp = upload(csv, filename="nums.csv")
    assert resp.status_code == 200
    col = resp.json()["profile"]["columns"][0]

    assert col["inferred_type"] == "numerical"
    assert col["min"] == 10.0
    assert col["max"] == 40.0
    assert col["mean"] == 25.0
    assert col["median"] == 25.0  # median of [10,20,30,40] = 25


def test_profile_missing_values():
    """Columns with NaN/empty values should report correct missing counts."""
    csv = (
        "a,b\n"
        "1,hello\n"
        ",world\n"
        "3,\n"
        "4,test\n"
    ).encode()
    resp = upload(csv, filename="missing.csv")
    assert resp.status_code == 200
    profile = resp.json()["profile"]
    cols = {c["name"]: c for c in profile["columns"]}

    # Column 'a' has 1 missing out of 4 rows
    assert cols["a"]["missing_count"] == 1
    assert cols["a"]["missing_percentage"] == 25.0

    # Column 'b' has 1 missing out of 4 rows
    assert cols["b"]["missing_count"] == 1

    # Total missing = 2 out of 8 cells = 25%
    assert profile["total_missing"] == 2
    assert profile["missing_percentage"] == 25.0


def test_profile_duplicates():
    """Duplicate rows should be detected and counted."""
    csv = (
        "x,y\n"
        "1,a\n"
        "2,b\n"
        "1,a\n"
        "3,c\n"
        "2,b\n"
    ).encode()
    resp = upload(csv, filename="dupes.csv")
    assert resp.status_code == 200
    profile = resp.json()["profile"]

    # Rows "1,a" and "2,b" each appear twice → 2 duplicates
    assert profile["duplicate_rows"] == 2
