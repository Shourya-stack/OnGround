"""
Schedule Plan route: GET /schedule and POST /schedule/import.
Queries baseline WBS schedule activities from SCHEDULE_PLAN table.
Supports project_id and discipline filtering and pagination.
"""

import logging
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Query, HTTPException, status, Depends, UploadFile, File
from backend.models.schemas import (
    SchedulePlanItemOut,
    CurrentUser,
    ScheduleImportResponse,
)
from backend.db.supabase_client import get_supabase_client
from backend.db.errors import PersistenceError, execute_read
from backend.services.schedule_import_service import import_schedule_from_bytes
from backend.services.notification_service import notify_schedule_imported
from backend.services.audit_service import log_action
from backend.auth.security import require_any_authenticated, require_project_planner
from backend.auth.rate_limiter import rate_limit_api, rate_limit_upload
from backend.utils.files import sanitize_filename, safe_upload_filename
from backend.routes.upload import MAX_FILE_SIZE_BYTES

router = APIRouter(prefix="", tags=["Schedule"], dependencies=[Depends(rate_limit_api)])
logger = logging.getLogger("onground.schedule")


@router.get("/schedule", response_model=List[SchedulePlanItemOut])
async def get_schedule(
    project_id: UUID = Query(..., description="Filter by project ID (required)"),
    discipline: Optional[str] = Query(None, description="Filter by discipline (civil, piping, electrical, etc.)"),
    limit: int = Query(100, ge=1, le=500, description="Max records to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: CurrentUser = Depends(require_any_authenticated),
):
    """
    Retrieves baseline schedule plan activities from public.schedule_plan.
    Protected with Supabase Bearer JWT authentication.
    """
    from backend.auth.security import require_project_access
    require_project_access(current_user, project_id)

    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured.",
        )

    query = supabase.table("schedule_plan").select("*").eq("project_id", str(project_id))

    if discipline:
        query = query.eq("discipline", discipline.lower().strip())

    query = query.order("planned_start").range(offset, offset + limit - 1)

    try:
        rows = execute_read(query, table="schedule_plan", operation="schedule.list")
    except PersistenceError as exc:
        logger.error("Error fetching schedule plan: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    return rows


@router.post("/schedule/import", response_model=ScheduleImportResponse)
async def import_schedule(
    project_id: UUID = Query(..., description="Project to import the schedule into"),
    file: UploadFile = File(..., description="CSV or XLSX baseline schedule"),
    current_user: CurrentUser = Depends(require_project_planner),
    _rate_limit: None = Depends(rate_limit_upload),
):
    """Import a baseline schedule CSV/XLSX into the project's schedule_plan."""
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured.",
        )

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required.",
        )

    safe_name = safe_upload_filename(file.filename, prefix="schedule-import")

    # Streaming size check in 64 KiB chunks.
    chunks = []
    total = 0
    while True:
        chunk = await file.read(65536)
        if not chunk:
            break
        total += len(chunk)
        if total > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Schedule file exceeds {MAX_FILE_SIZE_BYTES} bytes.",
            )
        chunks.append(chunk)
    content = b"".join(chunks)

    try:
        imported, updated, skipped, errors = import_schedule_from_bytes(
            content,
            sanitize_filename(file.filename),
            project_id,
            uploaded_by=current_user.id,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except PersistenceError as exc:
        logger.error("Schedule import failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    if imported or updated:
        notify_schedule_imported(project_id, imported + updated, skipped)

    log_action(
        entity_type="schedule_plan",
        entity_id=project_id,
        action="imported",
        project_id=project_id,
        actor_id=current_user.id,
        actor_role=current_user.role,
        new_state={
            "filename": file.filename,
            "imported": imported,
            "updated": updated,
            "skipped": skipped,
            "errors": errors,
        },
    )

    return ScheduleImportResponse(
        imported=imported,
        updated=updated,
        skipped=skipped,
        errors=errors,
    )
