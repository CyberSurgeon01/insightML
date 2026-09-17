# InsightML

A startup-style ML data exploration tool. Upload a CSV or XLSX dataset and get instant structural insights.

> **Phase 3 – Dataset Profiler** · Next.js frontend · FastAPI backend

---

## Features

### Phase 2 — Dataset Upload
- Drag-and-drop or browse to upload CSV / XLSX files
- Browser-side validation (extension + 50 MB limit)
- Server-side validation (format, size, row limit, malformed files)
- Preview the first 10 rows in an expandable table
- Success card showing Rows / Columns / Size / Format

### Phase 3 — Dataset Profiler
- **Summary cards:** rows, columns, memory usage, missing values, duplicate rows
- **Type breakdown:** counts of numerical, categorical, boolean, and datetime columns
- **Column details table** with per-column:
  - Inferred type (with colored badge)
  - Missing count and percentage
  - Unique value count
  - Min, Max, Mean, Median (numerical columns only)
- Conservative type detection — no forced string-to-date parsing

### Phase 4 — Numerical Relationship Engine
- **Top Relationships:** highlights the strongest correlations in the dataset.
- **Correlation Matrix:** CSS-based interactive heatmap of Pearson correlation coefficients.
- **Relationship Table:** sortable table with Pearson, Spearman, and Mutual Information scores.
- **Performance Guards:** 
  - Analyzes a maximum of 30 numerical columns.
  - Deterministically samples 50,000 rows for datasets larger than this threshold.
  - Automatically skips all-null, constant-value, and likely ID columns.

### Phase 5 — Categorical Relationship Analysis
- **Cramér's V (Cat ↔ Cat):** Identifies associations between categorical variables with bias correction.
- **ANOVA & Eta-squared (Cat ↔ Num):** Measures effect size of categorical variables on numerical outcomes.
- **Interactive Explorer:** Select a category and a numeric feature to see group-level statistics and a responsive CSS bar chart.
- **Performance Limits:** Caps at 15 distinct categories per variable, samples down to 50,000 rows, and requires at least 5 rows per category group to guarantee stable statistics.

---

## Project Structure

```
InsightML/
  frontend/          # Next.js 15, TypeScript, App Router, Tailwind CSS
  backend/           # FastAPI + Pandas
  core/              # Python analysis modules (future phases)
  sample_data/       # Sample CSV for testing
  README.md
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18 or later |
| npm | 9 or later |
| Python | 3.10 or later |
| pip | latest |

---

## Backend Setup

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a virtual environment (recommended)
python3 -m venv .venv
source .venv/bin/activate        # macOS / Linux
# .venv\Scripts\activate         # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start the development server
uvicorn main:app --reload --port 8000
```

The API will be available at:
- **Base URL:** `http://localhost:8000`
- **Interactive docs (Swagger UI):** `http://localhost:8000/docs`
- **Health check:** `http://localhost:8000/health`
- **Upload endpoint:** `POST http://localhost:8000/api/datasets/upload`

---

## Frontend Setup

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install Node dependencies
npm install

# 3. Start the Next.js development server
npm run dev
```

Open **`http://localhost:3000`** in your browser.

> The frontend proxies all `/api/*` requests to `http://localhost:8000` via the
> Next.js rewrite in `next.config.js`, so both services must be running.

---

## Running Tests

```bash
# From the backend directory (with venv activated)
cd backend
pytest tests/ -v
```

Expected output: **24 tests passing** — 9 upload validation tests (Phase 2) + 6 profile tests (Phase 3) + 9 relationship tests (Phase 4).

---

## Quick Test with curl

```bash
# Upload the sample CSV and pretty-print the response (includes profile data)
curl -s -X POST http://localhost:8000/api/datasets/upload \
  -F "file=@../sample_data/sample.csv" | python3 -m json.tool
```

---

## Supported File Formats

| Format | Extension | Notes |
|--------|-----------|-------|
| CSV | `.csv` | Any delimiter auto-detected by Pandas |
| Excel | `.xlsx` | First worksheet only |

**Limits:** max 50 MB · max 1,000,000 rows

---

## Phase Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| 1 | ✅ Archived | Streamlit prototype (`app.py`, `ui/`) |
| 2 | ✅ Complete | Dataset upload, preview, stat card |
| 3 | ✅ Complete | Dataset profiler with column details |
| 4 | ✅ Complete | Correlation & relationship explorer |
| 5 | ✅ Complete | Categorical Relationship Analysis |
