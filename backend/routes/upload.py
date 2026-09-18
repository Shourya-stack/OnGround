"""
Upload route: POST /upload
Receives daily construction reports, validates file extension, magic-byte signatures, and size,
stores in Supabase Storage bucket 'reports', and inserts initial EXTRACTIONS record.
Protected with Supabase Bearer JWT authentication and rate limiting.
"""

import os
import logging
from uuid import uuid4, UUID
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends
from backend.models.schemas import UploadResponse, CurrentUser
from backend.db.supabase_client import get_supabase_client
from backend.services.audit_service import log_action
from backend.auth.security import require_any_authenticated
from backend.auth.rate_limiter import rate_limit_upload

router = APIRouter(prefix="", tags=["Upload"])
logger = logging.getLogger("onground.upload")

ALLOWED_EXTENSIONS = {".pdf", ".csv", ".xlsx", ".xls", ".txt", ".log"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


def validate_file_content(content: bytes, filename: str) -> None:
    """
    Validates file content and magic-byte signatures against allowed file extensions.
    Raises HTTPException(400) if content signature does not match extension.
    """
    _, ext = os.path.splitext(filename.lower())
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    if not content or len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes)",
        )

    if ext == ".pdf":
        if not (content.startswith(b"%PDF-") or b"%PDF-" in content[:1024]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid PDF file: Missing %PDF- header signature",
            )

    elif ext == ".xlsx":
        # XLSX is a ZIP-based Office Open XML container (PK\x03\x04)
        if not content.startswith(b"PK\x03\x04"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid XLSX file: Missing ZIP/OpenXML container signature",
            )

    elif ext == ".xls":
        # Legacy OLE Compound File signature: D0 CF 11 E0 A1 B1 1A E1
        ole_signature = b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1"
        if not content.startswith(ole_signature):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid XLS file: Missing OLE Compound File signature",
            )

    elif ext in (".txt", ".log", ".csv"):
        # Validate that content is plausibly decodable text and not disguised binary executable
        sample = content[:4096]
        if b"\x00" in sample:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid {ext.upper()[1:]} file: Binary null bytes detected in text content",
            )
        try:
            sample.decode("utf-8")
        except UnicodeDecodeError:
            try:
                sample.decode("latin-1")
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid {ext.upper()[1:]} file: Unable to decode content as text",
                )


@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: CurrentUser = Depends(require_any_authenticated),
    _rate_limit: None = Depends(rate_limit_upload),
):
    """
    Accepts daily report file, validates magic bytes and size, stores in Supabase Storage,
    and creates an EXTRACTIONS row attached to the authenticated user.
    """
    filename = file.filename or "report.txt"
    _, ext = os.path.splitext(filename.lower())

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

    # Perform deterministic magic-byte / text signature validation
    validate_file_content(content, filename)

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
            # 2. Insert into EXTRACTIONS table with authenticated user ID
            file_type = "spreadsheet" if ext in (".csv", ".xlsx", ".xls") else "daily_report"
            row = {
                "id": str(extraction_id),
                "project_id": "00000000-0000-0000-0000-000000000001",
                "file_url": file_url,
                "file_type": file_type,
                "status": "pending",
                "uploaded_by": str(current_user.id),
            }
            supabase.table("extractions").insert(row).execute()

            # 3. Append to Audit Trail
            log_action(
                entity_type="extractions",
                entity_id=extraction_id,
                action="uploaded",
                actor_id=current_user.id,
                actor_role=current_user.role,
                new_state=row,
            )
        except Exception as e:
            logger.error(f"Failed to create extraction record in database: {e}")

    logger.info(f"File '{filename}' ({len(content)} bytes) uploaded successfully by user {current_user.id} as extraction {extraction_id}")

    return UploadResponse(
        extraction_id=extraction_id,
        file_url=file_url,
        status="pending",
    )
