"""
Matching routes.

- GET  /matches    — schedule matches for a project, with joined context
- GET  /unmatched  — reported activities with no planned counterpart
- POST /match/{extracted_activity_id} — run the matching pipeline for one activity

All endpoints are project-scoped and authorized against project_memberships.
Filtering happens inside the database query, not in Python after pagination:
applying `.range()` first and then filtering in memory produced short or empty
pages, because rows were discarded *after* the page had already been cut.
"""

import logging
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Query, HTTPException, status, Depends

from backend.models.schemas import (
    MatchResult,
    ScheduleMatchOut,
    UnmatchedActivityOut,
    ExtractedActivityContext,
    SchedulePlanContext,
    CurrentUser,
)
from backend.db.supabase_client import get_supabase_client
from backend.db.errors import PersistenceError, execute_read
from backend.services.matching_service import MatchingService
from backend.auth.security import require_any_authenticated, require_project_access
from backend.auth.rate_limiter import rate_limit_match

router = APIRouter(prefix="", tags=["Matching"])
logger = logging.getLogger("onground.match")

VALID_MATCH_STATUSES = {"auto_linked", "pending_review", "confirmed", "rejected"}
VALID_RESOLUTIONS = {"unresolved", "marked_new_activity", "manually_linked"}


def _unwrap(embedded):
    """PostgREST returns a single embedded row as either a dict or a 1-item list."""
    if isinstance(embedded, list):
        return embedded[0] if embedded else None
    return embedded if isinstance(embedded, dict) else None


@router.get("/matches", response_model=List[ScheduleMatchOut])
async def get_matches(
    project_id: UUID = Query(..., description="Project to read matches for (required)"),
    status_filter: Optional[str] = Query(
        None,
        alias="status",
        description="Filter by status (auto_linked, pending_review, confirmed, rejected)",
    ),
    discipline: Optional[str] = Query(None, description="Filter by discipline"),
    limit: int = Query(100, ge=1, le=500, description="Max records to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: CurrentUser = Depends(require_any_authenticated),
):
    """Retrieve schedule matches with joined extracted activity and schedule plan context."""
    require_project_access(current_user, project_id)

    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured.",
        )

    if status_filter:
        normalized_status = status_filter.lower().strip()
        if normalized_status not in VALID_MATCH_STATUSES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"status must be one of {sorted(VALID_MATCH_STATUSES)}",
            )
    else:
        normalized_status = None

    # `!inner` makes the join mandatory so project scoping is enforced by the
    # database rather than by discarding rows afterwards.
    query = supabase.table("schedule_matches").select(
        "*, extracted_activities(*), schedule_plan!inner(*)"
    ).eq("schedule_plan.project_id", str(project_id))

    if normalized_status:
        query = query.eq("status", normalized_status)

    if discipline:
        query = query.eq("schedule_plan.discipline", discipline.lower().strip())

    query = query.order("created_at", desc=True).range(offset, offset + limit - 1)

    try:
        rows = execute_read(query, table="schedule_matches", operation="matches.list")
    except PersistenceError as exc:
        logger.error("Error fetching schedule matches: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    matches = []
    for row in rows:
        extracted_raw = _unwrap(row.get("extracted_activities"))
        plan_raw = _unwrap(row.get("schedule_plan"))

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


@router.get("/unmatched", response_model=List[UnmatchedActivityOut])
async def get_unmatched(
    project_id: UUID = Query(..., description="Project to read unmatched activities for (required)"),
    resolution: Optional[str] = Query(
        None,
        description="Filter by resolution (unresolved, marked_new_activity, manually_linked)",
    ),
    limit: int = Query(100, ge=1, le=500, description="Max records to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: CurrentUser = Depends(require_any_authenticated),
):
    """Retrieve unmatched activities with joined extracted activity details."""
    require_project_access(current_user, project_id)

    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured.",
        )

    if resolution:
        normalized_resolution = resolution.lower().strip()
        if normalized_resolution not in VALID_RESOLUTIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"resolution must be one of {sorted(VALID_RESOLUTIONS)}",
            )
    else:
        normalized_resolution = None

    # Project scope travels unmatched -> extracted_activities -> extractions.
    query = (
        supabase.table("unmatched_activities")
        .select("*, extracted_activities!inner(*, extractions!inner(project_id))")
        .eq("extracted_activities.extractions.project_id", str(project_id))
    )

    if normalized_resolution:
        query = query.eq("resolution", normalized_resolution)

    query = query.order("created_at", desc=True).range(offset, offset + limit - 1)

    try:
        rows = execute_read(query, table="unmatched_activities", operation="unmatched.list")
    except PersistenceError as exc:
        logger.error("Error fetching unmatched activities: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    unmatched = []
    for row in rows:
        extracted_raw = _unwrap(row.get("extracted_activities"))
        if extracted_raw:
            # Drop the nested join helper before building the context model.
            extracted_raw = {k: v for k, v in extracted_raw.items() if k != "extractions"}

        unmatched.append(
            UnmatchedActivityOut(
                id=row["id"],
                extracted_activity_id=row["extracted_activity_id"],
                best_score=row.get("best_score"),
                reason=row.get("reason"),
                resolution=row.get("resolution") or "unresolved",
                linked_plan_activity_id=row.get("linked_plan_activity_id"),
                resolved_by=row.get("resolved_by"),
                resolved_at=row.get("resolved_at"),
                created_at=row.get("created_at"),
                extracted_activity=ExtractedActivityContext(**extracted_raw) if extracted_raw else None,
            )
        )

    return unmatched


@router.post("/match/{extracted_activity_id}", response_model=MatchResult)
async def match_activity(
    extracted_activity_id: UUID,
    current_user: CurrentUser = Depends(require_any_authenticated),
    _rate_limit: None = Depends(rate_limit_match),
):
    """
    Run the matching pipeline for one extracted activity.

    An unknown activity id is a 404. An earlier revision invented a hardcoded
    activity ("Piping fit-up and welding of cooling water line in Unit 200") for
    any id it could not find, so the endpoint always appeared to work and produced
    matches against data that did not exist.
    """
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured.",
        )

    try:
        rows = execute_read(
            supabase.table("extracted_activities")
            .select("*, extractions!inner(project_id)")
            .eq("id", str(extracted_activity_id)),
            table="extracted_activities",
            operation="match.load_activity",
        )
    except PersistenceError as exc:
        logger.error("Failed to fetch extracted activity: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc

    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Extracted activity '{extracted_activity_id}' not found",
        )

    activity_data = rows[0]

    extraction_ctx = _unwrap(activity_data.get("extractions")) or {}
    raw_project_id = extraction_ctx.get("project_id")
    if not raw_project_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Extracted activity is not associated with a project.",
        )

    project_id = UUID(str(raw_project_id))
    require_project_access(current_user, project_id)

    description = activity_data.get("activity_description")
    if not description:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Extracted activity has no description to match against.",
        )

    service = MatchingService()
    try:
        return service.match_activity(
            extracted_activity_id=extracted_activity_id,
            activity_description=description,
            discipline=activity_data.get("discipline") or "unknown",
            extraction_confidence=activity_data.get("extraction_confidence") or 0.70,
            start_time=activity_data.get("start_time"),
            end_time=activity_data.get("end_time"),
            actor_id=current_user.id,
            project_id=project_id,
        )
    except PersistenceError as exc:
        logger.error("Matching failed to persist: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc
