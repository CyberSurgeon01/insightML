"""
backend/routers/export.py

API routes for downloading analysis reports.
Accepts the UploadResponse payload and returns generated files.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import io
from models.schemas import UploadResponse
from services.export import generate_json_export, generate_csv_export, generate_pdf_export
import urllib.parse

router = APIRouter(prefix="/api/export", tags=["export"])

def sanitize_filename(name: str) -> str:
    # basic sanitization to prevent header injection or weird characters
    safe_name = "".join([c if c.isalnum() or c in " .-_" else "_" for c in name])
    return urllib.parse.quote(safe_name)

@router.post("/json")
async def export_json(data: UploadResponse):
    try:
        json_str = generate_json_export(data)
        safe_name = sanitize_filename(data.filename or "dataset")
        return StreamingResponse(
            io.StringIO(json_str),
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="insightml_{safe_name}.json"'}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/csv/{export_type}")
async def export_csv(export_type: str, data: UploadResponse):
    valid_types = ["profile", "numerical", "categorical", "quality", "insights"]
    if export_type not in valid_types:
        raise HTTPException(status_code=400, detail="Invalid CSV export type.")
    
    try:
        csv_str = generate_csv_export(data, export_type)
        safe_name = sanitize_filename(data.filename or "dataset")
        return StreamingResponse(
            io.StringIO(csv_str),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="insightml_{export_type}_{safe_name}.csv"'}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/pdf")
async def export_pdf(data: UploadResponse):
    pdf_bytes = generate_pdf_export(data)
    safe_name = sanitize_filename(data.filename or "dataset")
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="insightml_report_{safe_name}.pdf"'}
    )
