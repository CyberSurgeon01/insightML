"""
backend/routers/baseline.py

API routes for Phase 10: Baseline Model Training.
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import pandas as pd
import io
import json
from services.baseline import train_baseline
from models.schemas import BaselineModelResponse

router = APIRouter(prefix="/api/models/baseline", tags=["baseline"])

@router.post("", response_model=BaselineModelResponse)
async def create_baseline_model(
    file: UploadFile = File(...),
    target_column: str = Form(...),
    task_type: str = Form(...),
    features: str = Form(...),
    leakage_confirmed: bool = Form(False)
):
    try:
        feature_list = json.loads(features)
        if not isinstance(feature_list, list):
            raise ValueError("Features must be a JSON list of strings.")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid features format.")
        
    valid_tasks = ["classification", "regression"]
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
            df = pd.read_csv(io.BytesIO(contents))
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse dataset: {str(e)}")
        
    try:
        return train_baseline(df, target_column, task_type, feature_list)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model training failed: {str(e)}")
