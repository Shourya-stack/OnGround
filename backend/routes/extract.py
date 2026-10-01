"""
Extraction route: POST /extract/{extraction_id}

Orchestrates file retrieval, AI extraction parsing, deterministic confidence
calculation, and persists results in EXTRACTED_ACTIVITIES and AUDIT_TRAIL.
Protected with Supabase Bearer JWT authentication and rate limiting.

IMPORTANT: this endpoint no longer fabricates data. Earlier revisions fell back to
`data/sample_report_electrical.txt` (or an inline hardcoded report) whenever the
extraction id was unknown or no file could be found, and returned HTTP 200
"complete" with invented activities. Unknown ids now return 404 and missing
content returns 422.
"""

import logging
from pathlib import Path
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, status, Body, Depends

from backend.models.schemas import ExtractionResponse, CurrentUser
from backend.db.supabase_client import get_supabase_client
from backend.db.errors import PersistenceError, execute_read, execute_write
from backend.services.extraction_service import ExtractionService
from backend.services.audit_service import log_action
from backend.services.notification_service import notify_extraction_complete
from backend.auth.security import require_any_authenticated, verify_user_project_access
from backend.auth.rate_limiter import rate_limit_extraction
from backend.utils.files import safe_upload_filename

router = APIRouter(prefix="", tags=["Extraction"])
logger = logging.getLogger("onground.extract")

UPLOAD_DIR = Path("data/uploads")


@router.post("/extract/{extraction_id}", response_model=ExtractionResponse)
async def extract_activities(
    extraction_id: UUID,
    raw_text: Optional[str] = Body(None, embed=True),
    current_user: CurrentUser = Depends(require_any_authenticated),
    _rate_limit: None = Depends(rate_limit_extraction),
):
    """
    Trigger the extraction pipeline for a given extraction id.

    If `raw_text` is supplied it is used directly; otherwise the stored file is
    retrieved from the local upload cache or Supabase Storage.
    State transitions: pending -> processing -> complete / failed.
    Enforces resource ownership / project membership (SEC-04).
    """
    supabase = get_supabase_client()
    filename = "report.txt"
    file_bytes = b""
    extraction_record = None
    project_id: Optional[UUID] = None

    def _mark_failed(reason: str) -> None:
        """Best-effort status transition to 'failed'. Never masks the original error."""
        if not supabase:
            return
        try:
            supabase.table("extractions").update(
                {"status": "failed", "error_message": reason[:500]}
            ).eq("id", str(extraction_id)).execute()
        except Exception as mark_err:  # noqa: BLE001
            logger.error(
                "Secondary failure: could not persist extraction status 'failed': %s",
                mark_err,
            )

    # -------------------------------------------------------------------------
    # 1. Load the extraction record and enforce authorization (SEC-04)
    # -------------------------------------------------------------------------
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured; extraction cannot be processed.",
        )

    try:
        rows = execute_read(
            supabase.table("extractions").select("*").eq("id", str(extraction_id)),
            table="extractions",
            operation="extract.load",
        )
    except PersistenceError as exc:
        logger.error("Could not load extraction %s: %s", extraction_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Extraction record '{extraction_id}' not found",
        )

    extraction_record = rows[0]

    raw_project_id = extraction_record.get("project_id")
    if not raw_project_id:
        # project_id is NOT NULL in the schema; a missing value is corrupt data,
        # not an authorization question.
        logger.error("Extraction %s has no project_id (data integrity issue)", extraction_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Extraction record is missing its project association.",
        )
    project_id = UUID(str(raw_project_id))

    uploaded_by = extraction_record.get("uploaded_by")
    is_owner = bool(uploaded_by) and str(uploaded_by) == str(current_user.id)
    has_proj_access = verify_user_project_access(current_user.id, project_id)

    if not is_owner and not has_proj_access:
        logger.warning(
            "Unauthorized extraction access attempt: User %s requested extraction %s "
            "owned by %s (project: %s)",
            current_user.id,
            extraction_id,
            uploaded_by,
            project_id,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: User does not own extraction job and is not an authorized project member",
        )

    # -------------------------------------------------------------------------
    # 2. Mark as processing
    # -------------------------------------------------------------------------
    try:
        execute_write(
            supabase.table("extractions")
            .update({"status": "processing", "error_message": None})
            .eq("id", str(extraction_id)),
            table="extractions",
            operation="extract.mark_processing",
        )
    except PersistenceError as exc:
        logger.error("Could not mark extraction %s as processing: %s", extraction_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    # -------------------------------------------------------------------------
    # 3. Resolve report content
    # -------------------------------------------------------------------------
    if raw_text:
        file_bytes = raw_text.encode("utf-8")
        filename = "direct_input.txt"
    else:
        stored_name = extraction_record.get("file_name")
        cached = UPLOAD_DIR / safe_upload_filename(extraction_id, stored_name or "report.txt")

        if cached.exists():
            file_bytes = cached.read_bytes()
            filename = stored_name or cached.name
        else:
            try:
                file_url = extraction_record.get("file_url") or ""
                prefix = "/storage/v1/object/reports/"
                if file_url.startswith(prefix):
                    storage_path = file_url[len(prefix):]
                elif "reports/" in file_url:
                    storage_path = file_url.split("reports/", 1)[1]
                else:
                    storage_path = file_url

                if not storage_path:
                    raise ValueError("extraction record has no file_url")

                filename = stored_name or storage_path.split("/")[-1]
                file_bytes = supabase.storage.from_("reports").download(storage_path)
            except Exception as exc:  # noqa: BLE001
                logger.error("Failed to download file from Supabase Storage: %s", exc)
                _mark_failed(f"storage download failed: {exc}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Failed to retrieve report file from storage",
                ) from exc

    if not file_bytes:
        _mark_failed("no report content available")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "No report content available for this extraction. "
                "Upload a file or supply raw_text."
            ),
        )

    # -------------------------------------------------------------------------
    # 4. Run the extraction pipeline
    # -------------------------------------------------------------------------
    try:
        service = ExtractionService()
        extracted_activities = service.process_file_content(file_bytes, filename, extraction_id)
    except Exception as exc:  # noqa: BLE001
        logger.error("Extraction processing failed: %s", exc)
        _mark_failed(f"extraction failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Extraction processing failed",
        ) from exc

    # -------------------------------------------------------------------------
    # 5. Persist results
    # -------------------------------------------------------------------------
    saved_activities = []
    if extracted_activities:
        try:
            db_payload = [act.model_dump(mode="json") for act in extracted_activities]
            saved_activities = execute_write(
                supabase.table("extracted_activities").insert(db_payload),
                table="extracted_activities",
                operation="extract.persist_activities",
            )

            execute_write(
                supabase.table("extractions")
                .update({"status": "complete", "error_message": None})
                .eq("id", str(extraction_id)),
                table="extractions",
                operation="extract.mark_complete",
            )
        except PersistenceError as exc:
            logger.error("Failed to persist extracted activities: %s", exc)
            _mark_failed(f"persist failed: {exc.message}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=exc.public_detail,
            ) from exc
    else:
        # Zero activities is a legitimate outcome, not a failure.
        try:
            execute_write(
                supabase.table("extractions")
                .update({"status": "complete", "error_message": None})
                .eq("id", str(extraction_id)),
                table="extractions",
                operation="extract.mark_complete_empty",
            )
        except PersistenceError as exc:
            logger.error("Failed to finalize empty extraction: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=exc.public_detail,
            ) from exc

    audit_row = log_action(
        entity_type="extractions",
        entity_id=extraction_id,
        action="extracted",
        project_id=project_id,
        actor_id=current_user.id,
        actor_role=current_user.role,
        new_state={"count": len(saved_activities)},
    )

    notify_extraction_complete(
        project_id=project_id,
        extraction_id=extraction_id,
        activities_count=len(saved_activities),
    )

    return ExtractionResponse(
        extraction_id=extraction_id,
        activities_count=len(saved_activities),
        activities=saved_activities,
        status="complete",
        audit_warning=None if audit_row else "Audit trail entry could not be recorded.",
    )
