"""
Audit route: GET /audit
Queries immutable audit log records from public.audit_trail.
Supports action and actor filtering and pagination.
"""

import logging
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Query, HTTPException, status, Depends
from backend.models.schemas import AuditTrailOut, CurrentUser
from backend.db.supabase_client import get_supabase_client
from backend.auth.security import require_any_authenticated

router = APIRouter(prefix="", tags=["Audit"])
logger = logging.getLogger("onground.audit")


@router.get("/audit", response_model=List[AuditTrailOut])
async def get_audit_trail(
    action: Optional[str] = Query(None, description="Filter by action (extracted, auto_linked, flagged, confirmed, rejected, manually_linked)"),
    actor: Optional[UUID] = Query(None, description="Filter by actor user ID"),
    limit: int = Query(100, ge=1, le=500, description="Max records to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: CurrentUser = Depends(require_any_authenticated),
):
    """
    Retrieves audit trail entries from public.audit_trail in descending chronological order.
    """
    supabase = get_supabase_client()
    if not supabase:
        logger.info("Supabase client unavailable, returning empty audit list.")
        return []

    try:
        query = supabase.table("audit_trail").select("*")

        if action:
            query = query.eq("action", action.lower().strip())
        if actor:
            query = query.eq("actor", str(actor))

        query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
        res = query.execute()
        return res.data or []
    except Exception as e:
        logger.error(f"Error fetching audit trail: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to query audit trail.",
        )
