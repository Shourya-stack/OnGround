"""
Schedule Plan route: GET /schedule
Queries baseline WBS schedule activities from SCHEDULE_PLAN table.
Supports project_id and discipline filtering and pagination.
"""

import logging
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Query, HTTPException, status
from backend.models.schemas import SchedulePlanItemOut
from backend.db.supabase_client import get_supabase_client

router = APIRouter(prefix="", tags=["Schedule"])
logger = logging.getLogger("onground.schedule")


@router.get("/schedule", response_model=List[SchedulePlanItemOut])
async def get_schedule(
    project_id: Optional[UUID] = Query(None, description="Filter by project ID"),
    discipline: Optional[str] = Query(None, description="Filter by discipline (civil, piping, electrical, etc.)"),
    limit: int = Query(100, ge=1, le=500, description="Max records to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
):
    """
    Retrieves baseline schedule plan activities from public.schedule_plan.
    """
    supabase = get_supabase_client()
    if not supabase:
        logger.info("Supabase client unavailable, returning empty schedule list.")
        return []

    try:
        query = supabase.table("schedule_plan").select("*")

        if project_id:
            query = query.eq("project_id", str(project_id))
        if discipline:
            query = query.eq("discipline", discipline.lower().strip())

        query = query.order("planned_start").range(offset, offset + limit - 1)
        res = query.execute()
        return res.data or []
    except Exception as e:
        logger.error(f"Error fetching schedule plan: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query schedule plan: {str(e)}",
        )
