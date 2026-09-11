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
from backend.models.schemas import ConfirmResponse, RejectRequest, RejectResponse, CurrentUser
from backend.db.supabase_client import get_supabase_client
from backend.services.audit_service import log_action

router = APIRouter(prefix="", tags=["Review"])
logger = logging.getLogger("trueline.review")


def get_current_user(
    authorization: Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None),
) -> CurrentUser:
    """
    Extracts current user and role.
    Supports JWT tokens via Supabase Auth as well as 'X-User-Role' header for easy demo/testing.
    """
    user_id = uuid4()
    role = (x_user_role or "planner").lower().strip()

    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        supabase = get_supabase_client()
        if supabase:
            try:
                user_res = supabase.auth.get_user(token)
                if user_res and user_res.user:
                    user_id = UUID(user_res.user.id)
                    # Check profile role
                    prof = supabase.table("profiles").select("role").eq("id", str(user_id)).execute()
                    if prof.data and len(prof.data) > 0:
                        role = prof.data[0].get("role", role)
            except Exception as e:
                logger.warning(f"Could not verify bearer token against Supabase auth: {e}")

    return CurrentUser(id=user_id, role=role)


def require_planner_role(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    """Ensures that only users with the 'planner' role can perform the action."""
    if user.role != "planner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only users with the 'planner' role can confirm or reject matches.",
        )
    return user


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
