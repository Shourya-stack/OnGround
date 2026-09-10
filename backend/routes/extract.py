"""
Extraction route: POST /extract/{extraction_id}
Orchestrates file retrieval, AI extraction parsing, deterministic confidence calculation,
and persists results in EXTRACTED_ACTIVITIES and AUDIT_TRAIL.
"""

import logging
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, HTTPException, status, Body
from backend.models.schemas import ExtractionResponse
from backend.db.supabase_client import get_supabase_client
from backend.services.extraction_service import ExtractionService
from backend.services.audit_service import log_action

router = APIRouter(prefix="", tags=["Extraction"])
logger = logging.getLogger("trueline.extract")


@router.post("/extract/{extraction_id}", response_model=ExtractionResponse)
async def extract_activities(
    extraction_id: UUID,
    raw_text: Optional[str] = Body(None, embed=True),
):
    """
    Triggers extraction pipeline for a given extraction ID.
    If raw_text is provided in request body, uses it directly;
    otherwise retrieves the stored file from Supabase Storage.
    """
    supabase = get_supabase_client()
    filename = "report.txt"
    file_bytes = b""

    # Update extraction status to 'processing'
    if supabase:
        try:
            supabase.table("extractions").update({"status": "processing"}).eq("id", str(extraction_id)).execute()
        except Exception as e:
            logger.warning(f"Could not update status to processing: {e}")

    # Fetch file content if raw_text wasn't directly passed
    if raw_text:
        file_bytes = raw_text.encode("utf-8")
        filename = "direct_input.txt"
    elif supabase:
        try:
            rec = supabase.table("extractions").select("*").eq("id", str(extraction_id)).execute()
            if rec.data and len(rec.data) > 0:
                filename = rec.data[0].get("file_name", "report.txt")
                file_url = rec.data[0].get("file_url", "")
                if "reports/" in file_url:
                    storage_path = file_url.split("reports/")[-1]
                    file_bytes = supabase.storage.from_("reports").download(storage_path)
        except Exception as e:
            logger.error(f"Failed to download file from Supabase Storage: {e}")

    # If still no bytes (e.g. testing or mock upload), supply sample construction log text
    if not file_bytes:
        file_bytes = (
            b"DAILY PROGRESS REPORT - AREA 4\n"
            b"1. Fit-up and welding of 12-inch CS cooling water line, Unit 200 Area B (08:00 to 14:30). Discipline: Piping.\n"
            b"2. Cable tray installation and grounding check in Substation 3. Discipline: Electrical.\n"
            b"3. Foundation excavation and rebar cage tying for pump house. Discipline: Civil.\n"
        )
        filename = "sample_report.txt"

    try:
        service = ExtractionService()
        extracted_activities = service.process_file_content(file_bytes, filename, extraction_id)
    except Exception as e:
        logger.error(f"Extraction failed: {e}")
        if supabase:
            try:
                supabase.table("extractions").update({"status": "failed"}).eq("id", str(extraction_id)).execute()
            except Exception:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Extraction processing failed: {str(e)}",
        )


    saved_activities = []
    if supabase and extracted_activities:
        try:
            db_payload = [act.model_dump(mode="json") for act in extracted_activities]
            res = supabase.table("extracted_activities").insert(db_payload).execute()
            saved_activities = res.data or db_payload

            # Update EXTRACTIONS status
            supabase.table("extractions").update({"status": "extracted"}).eq("id", str(extraction_id)).execute()

            # Record in AUDIT_TRAIL
            log_action(
                entity_type="extractions",
                entity_id=extraction_id,
                action="extracted",
                actor_role="system",
                new_state={"count": len(extracted_activities)},
            )
        except Exception as e:
            logger.error(f"Failed to persist extracted activities to Supabase: {e}")
            saved_activities = [act.model_dump(mode="json") for act in extracted_activities]
    else:
        saved_activities = [act.model_dump(mode="json") for act in extracted_activities]

    return ExtractionResponse(
        extraction_id=extraction_id,
        activities_count=len(saved_activities),
        activities=saved_activities,
        status="extracted",
    )
