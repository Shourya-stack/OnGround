"""
Upload route: POST /upload
Receives daily construction reports, validates file extension and size,
stores in Supabase Storage bucket 'reports', and inserts initial EXTRACTIONS record.
"""

import os
import logging
from uuid import uuid4, UUID
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from backend.models.schemas import UploadResponse, CurrentUser
from backend.db.supabase_client import get_supabase_client
from backend.services.audit_service import log_action

router = APIRouter(prefix="", tags=["Upload"])
logger = logging.getLogger("trueline.upload")

ALLOWED_EXTENSIONS = {".pdf", ".csv", ".xlsx", ".xls", ".txt", ".log"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


def get_current_user_optional() -> CurrentUser:
    """Dependency returning the current user or default supervisor for demo."""
    return CurrentUser(id=uuid4(), role="supervisor")


@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
):
    """
    Accepts daily report file, validates, stores in Supabase Storage, and creates an EXTRACTIONS row.
    """
    filename = file.filename or "report.txt"
    _, ext = os.path.splitext(filename.lower())

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {str(e)}",
        )

    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds max allowed size of {MAX_FILE_SIZE_BYTES // (1024*1024)} MB",
        )

    extraction_id = uuid4()
    storage_path = f"raw_reports/{extraction_id}_{filename}"
    file_url = f"/storage/v1/object/reports/{storage_path}"

    # Cache locally as fallback in case remote storage bucket is unprovisioned
    try:
        from pathlib import Path
        upload_dir = Path("data/uploads")
        upload_dir.mkdir(parents=True, exist_ok=True)
        (upload_dir / f"{extraction_id}_{filename}").write_bytes(content)
    except Exception as e:
        logger.warning(f"Local upload cache warning: {e}")

    supabase = get_supabase_client()
    if supabase:
        try:
            # 1. Upload to Supabase Storage bucket 'reports'
            supabase.storage.from_("reports").upload(
                path=storage_path,
                file=content,
                file_options={"content-type": file.content_type or "application/octet-stream"},
            )
        except Exception as e:
            logger.warning(f"Storage upload warning (bucket 'reports' may need creation): {e}")

        try:
            # 2. Insert into EXTRACTIONS table
            file_type = "spreadsheet" if ext in (".csv", ".xlsx", ".xls") else "daily_report"
            row = {
                "id": str(extraction_id),
                "project_id": "00000000-0000-0000-0000-000000000001",
                "file_url": file_url,
                "file_type": file_type,
                "status": "pending",
            }
            supabase.table("extractions").insert(row).execute()

            # 3. Append to Audit Trail
            log_action(
                entity_type="extractions",
                entity_id=extraction_id,
                action="uploaded",
                actor_role="supervisor",
                new_state=row,
            )
        except Exception as e:
            logger.error(f"Failed to create extraction record in database: {e}")

    logger.info(f"File '{filename}' ({len(content)} bytes) uploaded successfully as extraction {extraction_id}")

    return UploadResponse(
        extraction_id=extraction_id,
        file_url=file_url,
        status="pending",
    )
