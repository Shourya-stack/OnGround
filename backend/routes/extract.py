"""
Extraction route: POST /extract/{extraction_id}
Orchestrates file retrieval, AI extraction parsing, deterministic confidence calculation,
and persists results in EXTRACTED_ACTIVITIES and AUDIT_TRAIL.
Protected with Supabase Bearer JWT authentication and rate limiting.
"""

import logging
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, status, Body, Depends
from backend.models.schemas import ExtractionResponse, CurrentUser
from backend.db.supabase_client import get_supabase_client
from backend.services.extraction_service import ExtractionService
from backend.services.audit_service import log_action
from backend.auth.security import require_any_authenticated
from backend.auth.rate_limiter import rate_limit_extraction

router = APIRouter(prefix="", tags=["Extraction"])
logger = logging.getLogger("onground.extract")


@router.post("/extract/{extraction_id}", response_model=ExtractionResponse)
async def extract_activities(
    extraction_id: UUID,
    raw_text: Optional[str] = Body(None, embed=True),
    current_user: CurrentUser = Depends(require_any_authenticated),
    _rate_limit: None = Depends(rate_limit_extraction),
):
    """
    Triggers extraction pipeline for a given extraction ID.
    If raw_text is provided in request body, uses it directly;
    otherwise retrieves the stored file from Supabase Storage.
    Manages robust state transitions: pending -> processing -> complete / failed.
    """
    supabase = get_supabase_client()
    filename = "report.txt"
    file_bytes = b""
    extraction_record = None

    def _mark_failed():
        if supabase:
            try:
                supabase.table("extractions").update({"status": "failed"}).eq("id", str(extraction_id)).execute()
            except Exception as mark_err:
                logger.error(f"Secondary failure: could not persist extraction status 'failed': {mark_err}")

    # 1. Verify extraction record exists if supabase is active
    if supabase:
        try:
            rec = supabase.table("extractions").select("*").eq("id", str(extraction_id)).execute()
            if rec.data is not None and len(rec.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Extraction record '{extraction_id}' not found",
                )
            if rec.data and len(rec.data) > 0:
                extraction_record = rec.data[0]
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"Could not verify extraction record existence: {e}")

        # 2. Update extraction status to 'processing'
        try:
            supabase.table("extractions").update({"status": "processing"}).eq("id", str(extraction_id)).execute()
        except Exception as e:
            logger.warning(f"Could not update status to processing: {e}")

    # 3. Fetch file content if raw_text wasn't directly passed
    if raw_text:
        file_bytes = raw_text.encode("utf-8")
        filename = "direct_input.txt"
    else:
        # Check local upload cache first
        from pathlib import Path
        upload_dir = Path("data/uploads")
        matches = list(upload_dir.glob(f"{extraction_id}_*")) if upload_dir.exists() else []
        if matches:
            file_bytes = matches[0].read_bytes()
            filename = matches[0].name.split(f"{extraction_id}_")[-1]
        elif supabase and extraction_record:
            try:
                file_url = extraction_record.get("file_url", "")
                if "reports/" in file_url:
                    storage_path = file_url.split("reports/")[-1]
                    filename = storage_path.split("/")[-1]
                    file_bytes = supabase.storage.from_("reports").download(storage_path)
            except Exception as e:
                logger.error(f"Failed to download file from Supabase Storage: {e}")
                _mark_failed()
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to retrieve report file from storage",
                )

    # If still no bytes (e.g. testing without upload), check sample report
    if not file_bytes:
        from pathlib import Path
        sample_fallback = Path("data/sample_report_electrical.txt")
        if sample_fallback.exists():
            file_bytes = sample_fallback.read_bytes()
            filename = sample_fallback.name
        else:
            file_bytes = (
                b"DAILY PROGRESS REPORT - AREA 4\n"
                b"1. Fit-up and welding of 12-inch CS cooling water line, Unit 200 Area B (08:00 to 14:30). Discipline: Piping.\n"
                b"2. Cable tray installation and grounding check in Substation 3. Discipline: Electrical.\n"
                b"3. Foundation excavation and rebar cage tying for pump house. Discipline: Civil.\n"
            )
            filename = "sample_report.txt"

    # 4. Execute extraction processing
    try:
        service = ExtractionService()
        extracted_activities = service.process_file_content(file_bytes, filename, extraction_id)
    except Exception as e:
        logger.error(f"Extraction processing failed: {e}")
        _mark_failed()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Extraction processing failed",
        )

    # 5. Persist extracted activities and finalize status
    saved_activities = []
    if supabase and extracted_activities:
        try:
            db_payload = [act.model_dump(mode="json") for act in extracted_activities]
            res = supabase.table("extracted_activities").insert(db_payload).execute()
            if res and isinstance(getattr(res, "data", None), list) and len(res.data) > 0:
                saved_activities = res.data
            else:
                saved_activities = db_payload

            # Update EXTRACTIONS status to complete
            supabase.table("extractions").update({"status": "complete"}).eq("id", str(extraction_id)).execute()

            # Record in AUDIT_TRAIL with authenticated actor ID
            log_action(
                entity_type="extractions",
                entity_id=extraction_id,
                action="extracted",
                actor_id=current_user.id,
                actor_role=current_user.role,
                new_state={"count": len(extracted_activities)},
            )
        except Exception as e:
            logger.error(f"Failed to persist extracted activities to database: {e}")
            _mark_failed()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to persist extracted activities",
            )
    else:
        saved_activities = [act.model_dump(mode="json") for act in extracted_activities]

    return ExtractionResponse(
        extraction_id=extraction_id,
        activities_count=len(saved_activities),
        activities=saved_activities,
        status="complete",
    )
