"""
Unmatched route: manual resolution of field activities that did not match a
planned schedule activity.

POST /unmatched/{id}/resolve links the activity to a selected schedule_plan row.
"""

import logging
from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status, Depends

from backend.models.schemas import (
    UnmatchedResolutionRequest,
    UnmatchedResolutionResponse,
    CurrentUser,
)
from backend.db.supabase_client import get_supabase_client
from backend.db.errors import PersistenceError, execute_read, execute_write
from backend.services.audit_service import log_action
from backend.auth.security import require_project_planner
from backend.auth.rate_limiter import rate_limit_api

router = APIRouter(prefix="", tags=["Unmatched"], dependencies=[Depends(rate_limit_api)])
logger = logging.getLogger("onground.unmatched")


@router.post("/unmatched/{unmatched_id}/resolve", response_model=UnmatchedResolutionResponse)
async def resolve_unmatched(
    unmatched_id: UUID,
    payload: UnmatchedResolutionRequest,
    current_user: CurrentUser = Depends(require_project_planner),
):
    """Resolve an unmatched activity by linking it to a planned activity."""
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured.",
        )

    try:
        rows = execute_read(
            supabase.table("unmatched_activities")
            .select("*, extracted_activities!inner(*, extractions!inner(project_id))")
            .eq("id", str(unmatched_id))
            .limit(1),
            table="unmatched_activities",
            operation="unmatched.load",
        )
    except PersistenceError as exc:
        logger.error("Failed to load unmatched activity %s: %s", unmatched_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unmatched activity '{unmatched_id}' not found",
        )

    row = rows[0]
    extracted = row.get("extracted_activities") or {}
    if isinstance(extracted, list):
        extracted = extracted[0] if extracted else {}
    extraction_ctx = extracted.get("extractions") or {}
    if isinstance(extraction_ctx, list):
        extraction_ctx = extraction_ctx[0] if extraction_ctx else {}
    raw_project_id = extraction_ctx.get("project_id")
    if not raw_project_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unmatched activity is not associated with a project.",
        )

    project_id = UUID(str(raw_project_id))

    # Verify the target plan activity belongs to the same project.
    try:
        plan_rows = execute_read(
            supabase.table("schedule_plan")
            .select("project_id")
            .eq("id", str(payload.plan_activity_id))
            .limit(1),
            table="schedule_plan",
            operation="unmatched.load_plan",
        )
    except PersistenceError as exc:
        logger.error("Failed to load plan activity %s: %s", payload.plan_activity_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    if not plan_rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Planned activity '{payload.plan_activity_id}' not found",
        )

    if UUID(str(plan_rows[0]["project_id"])) != project_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target planned activity belongs to a different project.",
        )

    now = datetime.now(timezone.utc).isoformat()
    try:
        execute_write(
            supabase.table("unmatched_activities")
            .update({
                "resolution": "manually_linked",
                "linked_plan_activity_id": str(payload.plan_activity_id),
                "resolved_by": str(current_user.id),
                "resolved_at": now,
            })
            .eq("id", str(unmatched_id)),
            table="unmatched_activities",
            operation="unmatched.resolve",
        )
    except PersistenceError as exc:
        logger.error("Failed to resolve unmatched activity %s: %s", unmatched_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    audit_row = log_action(
        entity_type="unmatched_activities",
        entity_id=unmatched_id,
        action="manually_linked",
        project_id=project_id,
        actor_id=current_user.id,
        actor_role=current_user.role,
        new_state={
            "unmatched_id": str(unmatched_id),
            "plan_activity_id": str(payload.plan_activity_id),
            "reason": payload.reason,
        },
        reason=payload.reason,
    )

    return UnmatchedResolutionResponse(
        unmatched_id=unmatched_id,
        plan_activity_id=payload.plan_activity_id,
        resolved_by=current_user.id,
        resolved_at=now,
        audit_warning=None if audit_row else "Audit trail entry could not be recorded.",
    )
