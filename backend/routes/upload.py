"""
Upload route handler stub (Phase 1 scaffolding).
Full implementation in Phase 2.
"""

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from uuid import UUID
from backend.models.schemas import UploadResponse

router = APIRouter(tags=["upload"])

@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    project_id: str = Form(...),
    file_type: str = Form(...)
):
    """
    Accepts daily reports (PDF, CSV, XLSX, TXT), validates metadata,
    stores in Supabase Storage, and creates an EXTRACTIONS row.
    """
    # Stub placeholder for Phase 1
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Upload endpoint is implemented in Phase 2"
    )
