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

### Phase 6 — Data Quality Warnings
- **Automated Scanning:** Detects duplicates, extreme sparsity, constant/empty columns, imbalanced categories, and numerical outliers.
- **Categorical Formatting Checks:** Identifies whitespace variants and mixed types.
- **Outlier Detection:** Utilizes standard IQR boundaries.
- **Non-destructive:** InsightML automatically analyzes and reports these issues; it **never** alters, cleans, or deletes uploaded data.

### Phase 7 — Smart Insights and Recommendations
- **Rule-Based Engine:** Deterministically synthesizes results from Profile, Relationships, and Quality checks.
- **Prioritization:** Ranks critical quality issues over general correlations.
- **Evidence-Backed:** Avoids AI hallucinations by directly linking each insight to exact statistical metrics (e.g., Pearson correlations, Cramér's V).
- **Jump Links:** Interactive anchor links allow users to navigate directly from the TL;DR insights to the corresponding deeper analytical charts.

### Phase 8 — Exportable Analysis Reports
- **Stateless Exports:** Instantly generate downloadable files directly from the browser context without storing user data on a server database.
- **Formats:** Supports full JSON raw payloads, flattened CSVs for any specific analysis module, and a stylized Executive PDF powered by `fpdf2`.

### Phase 9 — Target Selection & ML Readiness
- **Task Auto-Detection:** Recommends Classification vs. Regression based on unique values and target properties.
- **Model-Free Assessment:** Evaluates target health (missing data, minimum unique values) without training weights.
- **Leakage Prevention:** Checks for exact target duplicates and highly correlated numerical columns.
- **Feature Exclusion:** Identifies and filters likely ID columns, constants, and mostly-empty columns.
- **Class Imbalance Warnings:** Detects rare classes or severe class imbalances for classification tasks.

### Phase 10 — Baseline Model Training & Evaluation
- **Stateless Pipeline:** Models are trained entirely in memory and safely destroyed immediately after evaluation.
- **Scikit-Learn Integration:** Real train/test splitting (80/20 with stratification), median/mode imputation, scaling, and one-hot encoding.
- **Dummy Comparisons:** Rigorously scores Baseline models (Logistic Regression / Ridge) against Dummy baselines to prove authentic predictive lift.
- **Safety Limits:** Implements maximum row sub-sampling on extremely large files and max cardinality limits for fast browser feedback.

### Phase 11 — Interactive Task-Oriented Dashboard
- **Workspace Redesign:** Removed the infinite-scroll single page and replaced it with a multi-view Dashboard.
- **Client-Side State Persistence:** Clicking through the sidebar views (`Overview`, `Profile`, `Relationships`, etc.) uses URL state and retains all backend computation perfectly without re-uploading the file.
- **Improved UX:** Bounded scrolling for extremely large tables, collapsible mobile navigation drawer, and polished KPI cards.

### Phase 12 — Visual Explorer
- **Interactive Dashboards:** Embedded responsive, accessible charts natively into each dashboard view using `recharts`.
- **Zero-Latency Interactions:** The backend pre-calculates deterministic scatter plot samples (max 100 points) and distribution histograms in the initial upload response, allowing users to cross-filter and explore pairs instantaneously without file re-uploads.
- **Visual Explorers:** Added a Column Distribution Explorer (histograms/bar charts) and a Heatmap Pair Explorer (scatter plots) that activate by clicking on dataset profiles or correlation matrix cells.

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
| 6 | ✅ Complete | Data Quality Warnings & Recommendations |
| 7 | ✅ Complete | Smart Insights and Recommendations |
| 8 | ✅ Complete | Exportable Analysis Reports |
| 9 | ✅ Complete | Target Selection & ML Readiness |
| 10 | ✅ Complete | Baseline Model Training and Evaluation |
| 11 | ✅ Complete | Modern Dashboard Refactor |
| 12 | ✅ Complete | Visual Explorer |
