"""
Reports route: GET /reports
Queries uploaded report jobs from the EXTRACTIONS table.
Supports project_id and status filtering and pagination.
"""

import logging
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Query, HTTPException, status
from backend.models.schemas import ReportItemOut
from backend.db.supabase_client import get_supabase_client

router = APIRouter(prefix="", tags=["Reports"])
logger = logging.getLogger("onground.reports")


@router.get("/reports", response_model=List[ReportItemOut])
async def get_reports(
    project_id: Optional[UUID] = Query(None, description="Filter by project ID"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (pending, processing, complete, failed)"),
    limit: int = Query(100, ge=1, le=500, description="Max records to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
):
    """
    Retrieves uploaded report records from public.extractions.
    """
    supabase = get_supabase_client()
    if not supabase:
        logger.info("Supabase client unavailable, returning empty reports list.")
        return []

    try:
        query = supabase.table("extractions").select("*")

        if project_id:
            query = query.eq("project_id", str(project_id))
        if status_filter:
            query = query.eq("status", status_filter.lower().strip())

        query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
        res = query.execute()
        return res.data or []
    except Exception as e:
        logger.error(f"Error fetching reports: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query reports: {str(e)}",
        )
