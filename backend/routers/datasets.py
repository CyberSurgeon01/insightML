"""
backend/routers/datasets.py

FastAPI router that handles dataset upload requests.
Thin layer: validates the incoming file object, delegates
all parsing to file_processor, and maps errors to HTTP responses.
"""

import logging

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse

from models.schemas import UploadResponse
from services.file_processor import FileValidationError, process_upload

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/datasets", tags=["datasets"])


@router.post(
    "/upload",
    response_model=UploadResponse,
    summary="Upload a CSV or XLSX dataset",
    description=(
        "Accepts a single CSV or XLSX file (max 50 MB, max 1,000,000 rows). "
        "Returns metadata, a preview of the first 10 rows, and a dataset profile."
    ),
)
async def upload_dataset(
    file: UploadFile = File(..., description="CSV or XLSX file to upload"),
) -> UploadResponse:
    """
    POST /api/datasets/upload

    Multipart form field name: ``file``
    """
    # Read the entire file into memory.
    # We never write it to disk – all processing is done in-memory.
    content = await file.read()

    try:
        result = process_upload(
            filename=file.filename or "upload",
            content=content,
        )
    except FileValidationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    except Exception as exc:
        # Log the full traceback so it shows in the terminal
        logger.exception("Unexpected error processing upload: %s", file.filename)
        raise HTTPException(
            status_code=500,
            detail=f"Internal error while processing the file. Details: {exc}",
        ) from exc

    return UploadResponse(**result)

