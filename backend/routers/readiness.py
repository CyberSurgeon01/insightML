"""
backend/routers/readiness.py

API routes for Phase 9: ML Readiness.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import pandas as pd
import io
from services.readiness import assess_ml_readiness
from models.schemas import MLReadinessResponse

router = APIRouter(prefix="/api/ml-readiness", tags=["ml-readiness"])

@router.post("", response_model=MLReadinessResponse)
async def get_ml_readiness(
    file: UploadFile = File(...),
    target_column: str = Form(...),
    task_type: str = Form("auto")
):
    valid_tasks = ["auto", "classification", "regression"]
    if task_type not in valid_tasks:
        raise HTTPException(status_code=400, detail="Invalid task_type.")
        
    try:
        contents = await file.read()
        filename = file.filename or ""
        ext = filename.lower().split('.')[-1]
        
        if ext == "csv":
            df = pd.read_csv(io.BytesIO(contents))
        elif ext in ["xls", "xlsx"]:
            df = pd.read_excel(io.BytesIO(contents))
        else:
            # Fallback attempt
            df = pd.read_csv(io.BytesIO(contents))
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse dataset: {str(e)}")
        
    try:
        return assess_ml_readiness(df, target_column, task_type)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

