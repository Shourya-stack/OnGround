"""
Reports route: GET /reports, PATCH /reports/{id}, POST /reports/{id}/archive.
Queries uploaded report jobs from the EXTRACTIONS table.
Supports project_id and status filtering and pagination.
"""

import logging
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Query, HTTPException, status, Depends
from backend.models.schemas import (
    ReportItemOut,
    CurrentUser,
    ReportUpdateRequest,
    ReportMutationResponse,
)
from backend.db.supabase_client import get_supabase_client
from backend.db.errors import PersistenceError, execute_read, execute_write
from backend.services.audit_service import log_action
from backend.auth.security import (
    require_any_authenticated,
    require_project_planner,
    require_project_access,
)
from backend.auth.rate_limiter import rate_limit_api

router = APIRouter(prefix="", tags=["Reports"], dependencies=[Depends(rate_limit_api)])
logger = logging.getLogger("onground.reports")


@router.get("/reports", response_model=List[ReportItemOut])
async def get_reports(
    project_id: UUID = Query(..., description="Filter by project ID (required)"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (pending, processing, complete, failed)"),
    limit: int = Query(100, ge=1, le=500, description="Max records to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: CurrentUser = Depends(require_any_authenticated),
):
    """
    Retrieves uploaded report records from public.extractions.
    Protected with Supabase Bearer JWT authentication.
    """
    require_project_access(current_user, project_id)

    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured.",
        )

    query = supabase.table("extractions").select(
        "*, activities_count:extracted_activities(count)"
    ).eq("project_id", str(project_id))

    if status_filter:
        query = query.eq("status", status_filter.lower().strip())

    query = query.order("created_at", desc=True).range(offset, offset + limit - 1)

    try:
        rows = execute_read(query, table="extractions", operation="reports.list")
    except PersistenceError as exc:
        logger.error("Error fetching reports: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    result = []
    for row in rows:
        agg = row.get("activities_count")
        if isinstance(agg, list):
            agg = agg[0] if agg else {}
        activities_count = (agg or {}).get("count", 0)
        result.append(ReportItemOut(
            id=row["id"],
            project_id=row["project_id"],
            file_name=row.get("file_name") or row.get("filename"),
            display_name=row.get("display_name"),
            file_size_bytes=row.get("file_size_bytes"),
            file_extension=row.get("file_extension"),
            status=row["status"],
            source_type=row.get("source_type"),
            error_message=row.get("error_message"),
            activities_count=activities_count,
            matched_count=row.get("matched_count"),
            review_count=row.get("review_count"),
            unmatched_count=row.get("unmatched_count"),
            archived_at=row.get("archived_at"),
            created_at=row.get("created_at"),
            updated_at=row.get("updated_at"),
        ))
    return result


@router.patch("/reports/{report_id}", response_model=ReportMutationResponse)
async def update_report(
    report_id: UUID,
    payload: ReportUpdateRequest,
    current_user: CurrentUser = Depends(require_project_planner),
):
    """Update a report's display name or other editable metadata."""
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured.",
        )

    try:
        existing_rows = execute_read(
            supabase.table("extractions").select("*").eq("id", str(report_id)).limit(1),
            table="extractions",
            operation="reports.update_load",
        )
    except PersistenceError as exc:
        logger.error("Failed to load report %s: %s", report_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    if not existing_rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report '{report_id}' not found",
        )

    existing = existing_rows[0]
    project_id = UUID(str(existing["project_id"]))
    require_project_access(current_user, project_id)

    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided for update.",
        )

    try:
        rows = execute_write(
            supabase.table("extractions").update(update_data).eq("id", str(report_id)).select("*"),
            table="extractions",
            operation="reports.update",
        )
        report = rows[0]
    except PersistenceError as exc:
        logger.error("Failed to update report %s: %s", report_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    audit_row = log_action(
        entity_type="extractions",
        entity_id=report_id,
        action="uploaded",
        project_id=project_id,
        actor_id=current_user.id,
        actor_role=current_user.role,
        previous_state=existing,
        new_state=report,
    )

    return ReportMutationResponse(
        report=ReportItemOut(**report),
        audit_warning=None if audit_row else "Audit trail entry could not be recorded.",
    )


@router.post("/reports/{report_id}/archive", response_model=ReportMutationResponse)
async def archive_report(
    report_id: UUID,
    current_user: CurrentUser = Depends(require_project_planner),
):
    """Archive a report (soft delete)."""
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured.",
        )

    try:
        existing_rows = execute_read(
            supabase.table("extractions").select("*").eq("id", str(report_id)).limit(1),
            table="extractions",
            operation="reports.archive_load",
        )
    except PersistenceError as exc:
        logger.error("Failed to load report %s: %s", report_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    if not existing_rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report '{report_id}' not found",
        )

    existing = existing_rows[0]
    project_id = UUID(str(existing["project_id"]))
    require_project_access(current_user, project_id)

    update_data = {
        "archived_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        rows = execute_write(
            supabase.table("extractions").update(update_data).eq("id", str(report_id)).select("*"),
            table="extractions",
            operation="reports.archive",
        )
        report = rows[0]
    except PersistenceError as exc:
        logger.error("Failed to archive report %s: %s", report_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    audit_row = log_action(
        entity_type="extractions",
        entity_id=report_id,
        action="archived",
        project_id=project_id,
        actor_id=current_user.id,
        actor_role=current_user.role,
        previous_state=existing,
        new_state=report,
    )

    return ReportMutationResponse(
        report=ReportItemOut(**report),
        audit_warning=None if audit_row else "Audit trail entry could not be recorded.",
    )
