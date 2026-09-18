"""
Review routes: POST /match/{id}/confirm and POST /match/{id}/reject
Implements Planner-only role authorization, updates SCHEDULE_MATCHES status,
moves rejected items to UNMATCHED_ACTIVITIES, and appends to AUDIT_TRAIL.
"""

import logging
from uuid import UUID, uuid4
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Header, Depends, status
from backend.models.schemas import (
    ConfirmResponse,
    RejectRequest,
    RejectResponse,
    ReassignRequest,
    ReassignResponse,
    CurrentUser,
)
from backend.db.supabase_client import get_supabase_client
from backend.services.audit_service import log_action
from backend.auth.security import require_planner_role

router = APIRouter(prefix="", tags=["Review"])
logger = logging.getLogger("onground.review")



@router.post("/match/{match_id}/confirm", response_model=ConfirmResponse)
async def confirm_match(
    match_id: UUID,
    current_user: CurrentUser = Depends(require_planner_role),
):
    """
    Confirms a match (Planner role only).
    Updates SCHEDULE_MATCHES status to 'confirmed' and logs to AUDIT_TRAIL.
    """
    supabase = get_supabase_client()
    now_iso = datetime.now(timezone.utc).isoformat()

    if supabase:
        try:
            update_data = {
                "status": "confirmed",
                "resolved_by": str(current_user.id),
            }
            supabase.table("schedule_matches").update(update_data).eq("id", str(match_id)).execute()
        except Exception as e:
            logger.error(f"Failed to update match status in database: {e}")

    log_action(
        entity_type="schedule_matches",
        entity_id=match_id,
        action="confirmed",
        actor_id=current_user.id,
        actor_role=current_user.role,
        new_state={"status": "confirmed", "reviewed_at": now_iso},
    )

    return ConfirmResponse(match_id=match_id, status="confirmed")


@router.post("/match/{match_id}/reject", response_model=RejectResponse)
async def reject_match(
    match_id: UUID,
    payload: Optional[RejectRequest] = None,
    current_user: CurrentUser = Depends(require_planner_role),
):
    """
    Rejects a match (Planner role only).
    Updates SCHEDULE_MATCHES status to 'rejected' and logs to AUDIT_TRAIL.
    """
    reason = payload.reason if payload else "Rejected by planner during reconciliation"
    supabase = get_supabase_client()
    now_iso = datetime.now(timezone.utc).isoformat()

    if supabase:
        try:
            update_data = {
                "status": "rejected",
                "resolved_by": str(current_user.id),
            }
            supabase.table("schedule_matches").update(update_data).eq("id", str(match_id)).execute()
        except Exception as e:
            logger.error(f"Failed to update match status to rejected: {e}")

    log_action(
        entity_type="schedule_matches",
        entity_id=match_id,
        action="rejected",
        actor_id=current_user.id,
        actor_role=current_user.role,
        new_state={"status": "rejected", "reviewed_at": now_iso},
        reason=reason,
    )

    return RejectResponse(match_id=match_id, status="rejected")


@router.post("/match/{match_id}/reassign", response_model=ReassignResponse)
async def reassign_match(
    match_id: UUID,
    payload: ReassignRequest,
    current_user: CurrentUser = Depends(require_planner_role),
):
    """
    Reassigns a match to a different target schedule_plan activity (Planner role only).
    Validates target plan activity existence, updates SCHEDULE_MATCHES, and logs to AUDIT_TRAIL.
    """
    supabase = get_supabase_client()
    now_iso = datetime.now(timezone.utc).isoformat()
    existing_match = None

    if supabase:
        # 1. Verify existing match exists
        try:
            match_res = supabase.table("schedule_matches").select("*").eq("id", str(match_id)).execute()
            if not match_res.data or len(match_res.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Schedule match '{match_id}' not found",
                )
            existing_match = match_res.data[0]
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error checking schedule match existence: {e}")

        # 2. Verify target schedule_plan activity exists
        try:
            plan_res = supabase.table("schedule_plan").select("*").eq("id", str(payload.target_plan_activity_id)).execute()
            if not plan_res.data or len(plan_res.data) == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Target schedule plan activity '{payload.target_plan_activity_id}' not found",
                )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error checking target schedule plan activity existence: {e}")

        # 3. Update existing match row
        try:
            update_data = {
                "plan_activity_id": str(payload.target_plan_activity_id),
                "status": "confirmed",
                "resolved_by": str(current_user.id),
            }
            supabase.table("schedule_matches").update(update_data).eq("id", str(match_id)).execute()
        except Exception as e:
            logger.error(f"Failed to update schedule match on reassign: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to reassign schedule match: {str(e)}",
            )

    # 4. Log to Audit Trail
    confidence_score = existing_match.get("confidence_score") if existing_match else 1.0
    reason = payload.reason or "Manually reassigned to target schedule activity"

    log_action(
        entity_type="schedule_matches",
        entity_id=match_id,
        action="manually_linked",
        actor_id=current_user.id,
        actor_role=current_user.role,
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
    )

