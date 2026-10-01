"""
Review routes: confirm / reject / reassign a schedule match.

Planner-only, project-scoped. Rejected matches are genuinely moved into
UNMATCHED_ACTIVITIES (the previous implementation documented this but never did
it), and every failed write surfaces as an error instead of being logged and
followed by HTTP 200.
"""

import logging
from uuid import UUID, uuid4
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, Depends, status

from backend.models.schemas import (
    ConfirmResponse,
    RejectRequest,
    RejectResponse,
    ReassignRequest,
    ReassignResponse,
    CurrentUser,
)
from backend.db.supabase_client import get_supabase_client
from backend.db.errors import PersistenceError, execute_read, execute_write
from backend.services.audit_service import log_action
from backend.auth.security import require_planner_role, require_project_planner

router = APIRouter(prefix="", tags=["Review"])
logger = logging.getLogger("onground.review")


def _require_supabase():
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured.",
        )
    return supabase


def _load_match(supabase, match_id: UUID) -> Dict[str, Any]:
    """Load a schedule match or raise 404. Read failures raise 500, never pass through."""
    try:
        rows = execute_read(
            supabase.table("schedule_matches").select("*").eq("id", str(match_id)),
            table="schedule_matches",
            operation="review.load_match",
        )
    except PersistenceError as exc:
        logger.error("Error loading schedule match %s: %s", match_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Schedule match '{match_id}' not found",
        )
    return rows[0]


def _resolve_match_project_id(supabase, match_data: Dict[str, Any]) -> UUID:
    """
    Resolve the project owning a match, via schedule_plan or via the extraction.

    Raises 500 when it cannot be determined. Returning None here previously caused
    the authorization check to be skipped entirely (`if project_id and not ...`),
    so an unresolvable project silently granted access.
    """
    plan_act_id = match_data.get("plan_activity_id")
    if plan_act_id:
        try:
            rows = execute_read(
                supabase.table("schedule_plan").select("project_id").eq("id", str(plan_act_id)),
                table="schedule_plan",
                operation="review.resolve_project_via_plan",
            )
            if rows and rows[0].get("project_id"):
                return UUID(str(rows[0]["project_id"]))
        except PersistenceError as exc:
            logger.warning("Could not resolve project via schedule_plan: %s", exc)

    ext_act_id = match_data.get("extracted_activity_id")
    if ext_act_id:
        try:
            rows = execute_read(
                supabase.table("extracted_activities")
                .select("extraction_id, extractions(project_id)")
                .eq("id", str(ext_act_id)),
                table="extracted_activities",
                operation="review.resolve_project_via_extraction",
            )
            if rows:
                embedded = rows[0].get("extractions")
                if isinstance(embedded, list):
                    embedded = embedded[0] if embedded else None
                if isinstance(embedded, dict) and embedded.get("project_id"):
                    return UUID(str(embedded["project_id"]))
        except PersistenceError as exc:
            logger.warning("Could not resolve project via extractions: %s", exc)

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=(
            f"Cannot determine the project for match '{match_data.get('id')}'. "
            "Authorization cannot be evaluated."
        ),
    )


@router.post("/match/{match_id}/confirm", response_model=ConfirmResponse)
async def confirm_match(
    match_id: UUID,
    current_user: CurrentUser = Depends(require_planner_role),
):
    """Confirm a match. Planner role on the owning project required (SEC-03)."""
    supabase = _require_supabase()
    now_iso = datetime.now(timezone.utc).isoformat()

    match_data = _load_match(supabase, match_id)
    project_id = _resolve_match_project_id(supabase, match_data)
    require_project_planner(current_user, project_id)

    try:
        execute_write(
            supabase.table("schedule_matches")
            .update({"status": "confirmed", "resolved_by": str(current_user.id)})
            .eq("id", str(match_id)),
            table="schedule_matches",
            operation="review.confirm",
        )
    except PersistenceError as exc:
        logger.error("Failed to confirm match %s: %s", match_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    audit_row = log_action(
        entity_type="schedule_matches",
        entity_id=match_id,
        action="confirmed",
        project_id=project_id,
        actor_id=current_user.id,
        actor_role=current_user.role,
        previous_state={"status": match_data.get("status")},
        new_state={"status": "confirmed", "reviewed_at": now_iso},
        confidence_score=match_data.get("confidence_score"),
    )

    return ConfirmResponse(
        match_id=match_id,
        status="confirmed",
        audit_warning=None if audit_row else "Audit trail entry could not be recorded.",
    )


@router.post("/match/{match_id}/reject", response_model=RejectResponse)
async def reject_match(
    match_id: UUID,
    payload: Optional[RejectRequest] = None,
    current_user: CurrentUser = Depends(require_planner_role),
):
    """
    Reject a match and move the reported activity into UNMATCHED_ACTIVITIES.

    The activity itself is real evidence from the field — rejecting the *link*
    must not discard it, otherwise the reported work silently disappears from
    reconciliation.
    """
    reason = payload.reason if payload and payload.reason else "Rejected by planner during reconciliation"
    supabase = _require_supabase()
    now_iso = datetime.now(timezone.utc).isoformat()

    match_data = _load_match(supabase, match_id)
    project_id = _resolve_match_project_id(supabase, match_data)
    require_project_planner(current_user, project_id)

    try:
        execute_write(
            supabase.table("schedule_matches")
            .update({"status": "rejected", "resolved_by": str(current_user.id)})
            .eq("id", str(match_id)),
            table="schedule_matches",
            operation="review.reject",
        )
    except PersistenceError as exc:
        logger.error("Failed to reject match %s: %s", match_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    # Return the extracted activity to the unmatched queue so it stays visible.
    unmatched_id: Optional[UUID] = None
    extracted_activity_id = match_data.get("extracted_activity_id")
    if extracted_activity_id:
        try:
            rows = execute_write(
                supabase.table("unmatched_activities").upsert(
                    {
                        "id": str(uuid4()),
                        "extracted_activity_id": str(extracted_activity_id),
                        "best_score": match_data.get("confidence_score"),
                        "reason": f"Match rejected by planner: {reason}",
                        "resolution": "unresolved",
                    },
                    on_conflict="extracted_activity_id",
                ),
                table="unmatched_activities",
                operation="review.reject_to_unmatched",
            )
            if rows and rows[0].get("id"):
                unmatched_id = UUID(str(rows[0]["id"]))
        except PersistenceError as exc:
            logger.error("Failed to move rejected match %s to unmatched: %s", match_id, exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=exc.public_detail,
            ) from exc

    audit_row = log_action(
        entity_type="schedule_matches",
        entity_id=match_id,
        action="rejected",
        project_id=project_id,
        actor_id=current_user.id,
        actor_role=current_user.role,
        previous_state={"status": match_data.get("status")},
        new_state={"status": "rejected", "reviewed_at": now_iso, "unmatched_id": str(unmatched_id) if unmatched_id else None},
        reason=reason,
        confidence_score=match_data.get("confidence_score"),
    )

    return RejectResponse(
        match_id=match_id,
        status="rejected",
        unmatched_id=unmatched_id,
        audit_warning=None if audit_row else "Audit trail entry could not be recorded.",
    )


@router.post("/match/{match_id}/reassign", response_model=ReassignResponse)
async def reassign_match(
    match_id: UUID,
    payload: ReassignRequest,
    current_user: CurrentUser = Depends(require_planner_role),
):
    """
    Reassign a match to a different planned activity within the same project.
    Validates target existence, project consistency (F-04), and authorization.
    """
    supabase = _require_supabase()
    now_iso = datetime.now(timezone.utc).isoformat()

    existing_match = _load_match(supabase, match_id)

    # Target plan activity must exist.
    try:
        target_rows = execute_read(
            supabase.table("schedule_plan").select("*").eq("id", str(payload.target_plan_activity_id)),
            table="schedule_plan",
            operation="review.load_target_plan",
        )
    except PersistenceError as exc:
        logger.error("Error loading target plan activity: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    if not target_rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target schedule plan activity '{payload.target_plan_activity_id}' not found",
        )

    target_plan = target_rows[0]
    target_project_id_raw = target_plan.get("project_id")
    if not target_project_id_raw:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Target schedule activity is not associated with a project.",
        )
    target_project_id = UUID(str(target_project_id_raw))

    source_project_id = _resolve_match_project_id(supabase, existing_match)

    if str(source_project_id) != str(target_project_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cross-project reassignment is not permitted. Match and target activity belong to different projects.",
        )

    require_project_planner(current_user, target_project_id)

    try:
        execute_write(
            supabase.table("schedule_matches")
            .update(
                {
                    "plan_activity_id": str(payload.target_plan_activity_id),
                    "status": "confirmed",
                    "resolved_by": str(current_user.id),
                }
            )
            .eq("id", str(match_id)),
            table="schedule_matches",
            operation="review.reassign",
        )
    except PersistenceError as exc:
        logger.error("Failed to reassign match %s: %s", match_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    confidence_score = existing_match.get("confidence_score")
    if confidence_score is None:
        confidence_score = 1.0
    reason = payload.reason or "Manually reassigned to target schedule activity"

    audit_row = log_action(
        entity_type="schedule_matches",
        entity_id=match_id,
        action="manually_linked",
        project_id=target_project_id,
        actor_id=current_user.id,
        actor_role=current_user.role,
        previous_state={
            "plan_activity_id": existing_match.get("plan_activity_id"),
            "status": existing_match.get("status"),
        },
        new_state={
            "plan_activity_id": str(payload.target_plan_activity_id),
            "status": "confirmed",
            "resolved_by": str(current_user.id),
            "reviewed_at": now_iso,
        },
        reason=reason,
        confidence_score=confidence_score,
    )

    return ReassignResponse(
        match_id=match_id,
        plan_activity_id=payload.target_plan_activity_id,
        status="confirmed",
        resolved_by=current_user.id,
        audit_warning=None if audit_row else "Audit trail entry could not be recorded.",
    )
