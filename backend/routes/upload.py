"""
Upload route: POST /upload
Receives daily construction reports, validates file extension, magic-byte signatures, and size,
stores in Supabase Storage bucket 'reports', and inserts initial EXTRACTIONS record.
Protected with Supabase Bearer JWT authentication and rate limiting.
"""

import os
import logging
from pathlib import Path
from typing import Optional
from uuid import uuid4, UUID

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Depends

from backend.models.schemas import UploadResponse, CurrentUser
from backend.db.supabase_client import get_supabase_client
from backend.db.errors import PersistenceError, execute_write
from backend.services.audit_service import log_action
from backend.auth.security import require_any_authenticated, require_project_access
from backend.auth.rate_limiter import rate_limit_upload
from backend.utils.files import (
    sanitize_filename,
    safe_upload_filename,
    safe_storage_path,
    resolve_within,
)

router = APIRouter(prefix="", tags=["Upload"])
logger = logging.getLogger("onground.upload")

ALLOWED_EXTENSIONS = {".pdf", ".csv", ".xlsx", ".xls", ".txt", ".log"}
ALLOWED_FILE_TYPES = {"daily_report", "spreadsheet", "voice_transcript"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
CHUNK_SIZE_BYTES = 64 * 1024            # streamed read granularity
UPLOAD_DIR = Path("data/uploads")


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
    project_id: UUID = Form(..., description="Target project. Required — uploads are project-scoped."),
    file_type: Optional[str] = Form(None, description="daily_report | spreadsheet | voice_transcript"),
    current_user: CurrentUser = Depends(require_any_authenticated),
    _rate_limit: None = Depends(rate_limit_upload),
):
    """
    Accept a daily report, validate it, store it, and create an EXTRACTIONS row.

    The target project is supplied by the caller and authorized against
    project_memberships. An earlier revision hardcoded
    project_id='00000000-0000-0000-0000-000000000001', so every upload from every
    user landed in the same project regardless of the UI context.
    """
    # Authorize the target project before reading any bytes.
    require_project_access(current_user, project_id)

    filename = file.filename or "report.txt"
    _, ext = os.path.splitext(filename.lower())

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    # Read in bounded chunks so an oversized upload cannot exhaust memory before
    # the size check runs. The previous code did `await file.read()` (entire body)
    # and only then compared against MAX_FILE_SIZE_BYTES.
    chunks: list[bytes] = []
    total = 0
    try:
        while True:
            chunk = await file.read(CHUNK_SIZE_BYTES)
            if not chunk:
                break
            total += len(chunk)
            if total > MAX_FILE_SIZE_BYTES:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=(
                        f"File exceeds max allowed size of "
                        f"{MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB"
                    ),
                )
            chunks.append(chunk)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {str(e)}",
        )

    content = b"".join(chunks)

    # Perform deterministic magic-byte / text signature validation
    validate_file_content(content, filename)

    extraction_id = uuid4()

    # Filenames are untrusted: sanitize before building any path or storage key.
    safe_name = sanitize_filename(filename)
    storage_path = safe_storage_path("raw_reports", extraction_id, filename)
    file_url = f"/storage/v1/object/reports/{storage_path}"

    resolved_file_type = file_type or (
        "spreadsheet" if ext in (".csv", ".xlsx", ".xls") else "daily_report"
    )
    if resolved_file_type not in ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"file_type must be one of {sorted(ALLOWED_FILE_TYPES)}",
        )

    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured; upload cannot be recorded.",
        )

    # Cache locally so extraction can proceed even if the storage bucket is
    # unprovisioned. Path is verified to stay inside data/uploads.
    try:
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        cache_path = resolve_within(UPLOAD_DIR, safe_upload_filename(extraction_id, filename))
        cache_path.write_bytes(content)
    except ValueError as e:
        logger.error(f"Rejected unsafe upload path: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file name.",
        )
    except Exception as e:
        logger.warning(f"Local upload cache warning: {e}")

    storage_warning: Optional[str] = None
    try:
        supabase.storage.from_("reports").upload(
            path=storage_path,
            file=content,
            file_options={"content-type": file.content_type or "application/octet-stream"},
        )
    except Exception as e:
        # Non-fatal: the local cache still allows extraction to run, but the
        # caller is told rather than left guessing.
        storage_warning = "Remote storage upload failed; file retained in local cache only."
        logger.warning(f"Storage upload failed (bucket 'reports' may need creation): {e}")

    row = {
        "id": str(extraction_id),
        "project_id": str(project_id),
        "file_url": file_url,
        "file_name": safe_name,
        "display_name": safe_name,
        "file_size_bytes": len(content),
        "file_extension": ext,
        "file_type": resolved_file_type,
        "status": "pending",
        "uploaded_by": str(current_user.id),
    }

    try:
        execute_write(
            supabase.table("extractions").insert(row),
            table="extractions",
            operation="upload.create_extraction",
        )
    except PersistenceError as exc:
        logger.error(f"Failed to create extraction record: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    audit_row = log_action(
        entity_type="extractions",
        entity_id=extraction_id,
        action="uploaded",
        project_id=project_id,
        actor_id=current_user.id,
        actor_role=current_user.role,
        new_state=row,
    )

    logger.info(
        f"File '{safe_name}' ({len(content)} bytes) uploaded by user {current_user.id} "
        f"to project {project_id} as extraction {extraction_id}"
    )

    warnings = [w for w in (storage_warning,) if w]
    if not audit_row:
        warnings.append("Audit trail entry could not be recorded.")

    return UploadResponse(
        extraction_id=extraction_id,
        project_id=project_id,
        file_url=file_url,
        file_name=safe_name,
        file_size_bytes=len(content),
        status="pending",
        audit_warning=" ".join(warnings) if warnings else None,
    )
