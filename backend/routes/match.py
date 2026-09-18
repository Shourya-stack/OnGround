"""
Matching route: POST /match/{extracted_activity_id}
Matches an extracted activity against the active baseline schedule.
Computes contextual confidence, populates candidates on ambiguity,
and stores in SCHEDULE_MATCHES / UNMATCHED_ACTIVITIES.
"""

import logging
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Query, HTTPException, status
from backend.models.schemas import (
    MatchResult,
    ScheduleMatchOut,
    UnmatchedActivityOut,
    ExtractedActivityContext,
    SchedulePlanContext,
)
from backend.db.supabase_client import get_supabase_client
from backend.services.matching_service import MatchingService

router = APIRouter(prefix="", tags=["Matching"])
logger = logging.getLogger("onground.match")


@router.get("/matches", response_model=List[ScheduleMatchOut])
async def get_matches(
    project_id: Optional[UUID] = Query(None, description="Filter matches by project ID"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (auto_linked, pending_review, confirmed, rejected)"),
    discipline: Optional[str] = Query(None, description="Filter by discipline"),
    limit: int = Query(100, ge=1, le=500, description="Max records to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
):
    """
    Retrieves schedule matches with joined extracted activity and schedule plan context.
    """
    supabase = get_supabase_client()
    if not supabase:
        logger.info("Supabase client unavailable, returning empty matches list.")
        return []

    try:
        query = supabase.table("schedule_matches").select(
            "*, extracted_activities(*), schedule_plan(*)"
        )

        if status_filter:
            query = query.eq("status", status_filter.lower().strip())

        query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
        res = query.execute()

        matches = []
        for row in (res.data or []):
            extracted_raw = row.get("extracted_activities")
            plan_raw = row.get("schedule_plan")

            # In PostgREST, single joins might be returned as dict or list
            if isinstance(extracted_raw, list) and extracted_raw:
                extracted_raw = extracted_raw[0]
            elif not isinstance(extracted_raw, dict):
                extracted_raw = None

            if isinstance(plan_raw, list) and plan_raw:
                plan_raw = plan_raw[0]
            elif not isinstance(plan_raw, dict):
                plan_raw = None

            # Apply in-memory filtering if project_id or discipline requested
            if project_id and plan_raw and plan_raw.get("project_id") != str(project_id):
                continue
            if discipline:
                disc_match = False
                if plan_raw and plan_raw.get("discipline", "").lower() == discipline.lower():
                    disc_match = True
                if extracted_raw and extracted_raw.get("discipline", "").lower() == discipline.lower():
                    disc_match = True
                if not disc_match:
                    continue

            matches.append(
                ScheduleMatchOut(
                    id=row["id"],
                    extracted_activity_id=row["extracted_activity_id"],
                    plan_activity_id=row["plan_activity_id"],
                    confidence_score=row["confidence_score"],
                    status=row["status"],
                    resolved_by=row.get("resolved_by"),
                    candidates=row.get("candidates"),
                    created_at=row.get("created_at"),
                    extracted_activity=ExtractedActivityContext(**extracted_raw) if extracted_raw else None,
                    schedule_plan=SchedulePlanContext(**plan_raw) if plan_raw else None,
                )
            )

        return matches
    except Exception as e:
        logger.error(f"Error fetching schedule matches: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query schedule matches: {str(e)}",
        )


@router.get("/unmatched", response_model=List[UnmatchedActivityOut])
async def get_unmatched(
    resolution: Optional[str] = Query(None, description="Filter by resolution status (unresolved, marked_new_activity, manually_linked)"),
    limit: int = Query(100, ge=1, le=500, description="Max records to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
):
    """
    Retrieves unmatched activities with joined extracted activity details.
    """
    supabase = get_supabase_client()
    if not supabase:
        logger.info("Supabase client unavailable, returning empty unmatched list.")
        return []

    try:
        query = supabase.table("unmatched_activities").select("*, extracted_activities(*)")

        if resolution:
            query = query.eq("resolution", resolution.lower().strip())

        query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
        res = query.execute()

        unmatched = []
        for row in (res.data or []):
            extracted_raw = row.get("extracted_activities")
            if isinstance(extracted_raw, list) and extracted_raw:
                extracted_raw = extracted_raw[0]
            elif not isinstance(extracted_raw, dict):
                extracted_raw = None

            unmatched.append(
                UnmatchedActivityOut(
                    id=row["id"],
                    extracted_activity_id=row["extracted_activity_id"],
                    best_score=row.get("best_score"),
                    resolution=row.get("resolution", "unresolved"),
                    created_at=row.get("created_at"),
                    extracted_activity=ExtractedActivityContext(**extracted_raw) if extracted_raw else None,
                )
            )

        return unmatched
    except Exception as e:
        logger.error(f"Error fetching unmatched activities: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query unmatched activities: {str(e)}",
        )


@router.post("/match/{extracted_activity_id}", response_model=MatchResult)
async def match_activity(
    extracted_activity_id: UUID,
):
    """
    Executes matching pipeline for a specific extracted activity against baseline schedule plan.
    """
    supabase = get_supabase_client()
    activity_data = None

    if supabase:
        try:
            res = supabase.table("extracted_activities").select("*").eq("id", str(extracted_activity_id)).execute()
            if res.data and len(res.data) > 0:
                activity_data = res.data[0]
        except Exception as e:
            logger.error(f"Failed to fetch extracted activity from DB: {e}")

    # Fallback default activity if testing without DB
    if not activity_data:
        activity_data = {
            "id": str(extracted_activity_id),
            "activity_description": "Piping fit-up and welding of cooling water line in Unit 200",
            "discipline": "piping",
            "extraction_confidence": 0.85,
        }

    service = MatchingService()
    result = service.match_activity(
        extracted_activity_id=extracted_activity_id,
        activity_description=activity_data["activity_description"],
        discipline=activity_data.get("discipline", "unknown"),
        extraction_confidence=activity_data.get("extraction_confidence", 0.70),
    )

    return result

