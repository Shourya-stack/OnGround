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
from backend.db.errors import PersistenceError, execute_read
from backend.auth.security import require_any_authenticated, require_project_access

router = APIRouter(prefix="", tags=["Audit"])
logger = logging.getLogger("onground.audit")


@router.get("/audit", response_model=List[AuditTrailOut])
async def get_audit_trail(
    project_id: UUID = Query(..., description="Filter by project ID (required)"),
    action: Optional[str] = Query(None, description="Filter by action (extracted, auto_linked, flagged, confirmed, rejected, manually_linked, ...)"),
    actor: Optional[UUID] = Query(None, description="Filter by actor user ID"),
    limit: int = Query(100, ge=1, le=500, description="Max records to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: CurrentUser = Depends(require_any_authenticated),
):
    """
    Retrieves audit trail entries for a single project in descending chronological order.
    """
    require_project_access(current_user, project_id)

    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured.",
        )

    query = supabase.table("audit_trail").select("*").eq("project_id", str(project_id))

    if action:
        query = query.eq("action", action.lower().strip())
    if actor:
        query = query.eq("actor", str(actor))

    query = query.order("created_at", desc=True).range(offset, offset + limit - 1)

    try:
        rows = execute_read(query, table="audit_trail", operation="audit.list")
    except PersistenceError as exc:
        logger.error("Error fetching audit trail: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    return rows
