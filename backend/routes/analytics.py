"""
Analytics route: GET /analytics
Derives aggregate metrics and progress statistics from the actual 7-table schema.
Traceable directly to stored records: schedule_plan, extractions, extracted_activities,
schedule_matches, unmatched_activities, and audit_trail.
"""

import logging
from uuid import UUID
from fastapi import APIRouter, Query, HTTPException, status, Depends
from backend.models.schemas import AnalyticsOut, MatchesBreakdown, UnmatchedBreakdown, CurrentUser
from backend.db.supabase_client import get_supabase_client
from backend.db.errors import PersistenceError, execute_read, execute_count
from backend.auth.security import require_any_authenticated, require_project_access

router = APIRouter(prefix="", tags=["Analytics"])
logger = logging.getLogger("onground.analytics")


@router.get("/analytics", response_model=AnalyticsOut)
async def get_analytics(
    project_id: UUID = Query(..., description="Filter analytics by project ID (required)"),
    current_user: CurrentUser = Depends(require_any_authenticated),
):
    """
    Computes summary analytics for a single project.
    Protected with Supabase Bearer JWT authentication.
    """
    require_project_access(current_user, project_id)

    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured.",
        )

    try:
        # 1. Planned Activities
        total_planned = execute_count(
            supabase.table("schedule_plan").select("id", count="exact").eq("project_id", str(project_id)),
            table="schedule_plan",
            operation="analytics.count_plan",
        )

        # 2. Extractions (Reports)
        total_extractions = execute_count(
            supabase.table("extractions").select("id", count="exact").eq("project_id", str(project_id)),
            table="extractions",
            operation="analytics.count_extractions",
        )

        # 3. Extracted Activities
        total_extracted_activities = execute_count(
            supabase.table("extracted_activities")
            .select("id, extractions!inner(project_id)", count="exact")
            .eq("extractions.project_id", str(project_id)),
            table="extracted_activities",
            operation="analytics.count_extracted_activities",
        )

        # 4. Matches & Status Breakdown & Average Confidence
        match_rows = execute_read(
            supabase.table("schedule_matches")
            .select("status, confidence_score, schedule_plan!inner(project_id)")
            .eq("schedule_plan.project_id", str(project_id)),
            table="schedule_matches",
            operation="analytics.list_matches",
        )

        matches_breakdown = MatchesBreakdown()
        confidence_scores = []

        for m in match_rows:
            st = m.get("status")
            if st == "auto_linked":
                matches_breakdown.auto_linked += 1
            elif st == "pending_review":
                matches_breakdown.pending_review += 1
            elif st == "confirmed":
                matches_breakdown.confirmed += 1
            elif st == "rejected":
                matches_breakdown.rejected += 1

            cs = m.get("confidence_score")
            if cs is not None and isinstance(cs, (int, float)):
                confidence_scores.append(float(cs))

        avg_confidence = None
        if confidence_scores:
            avg_confidence = round(sum(confidence_scores) / len(confidence_scores), 4)

        # 5. Unmatched Activities & Breakdown
        unmatched_rows = execute_read(
            supabase.table("unmatched_activities")
            .select("resolution, extracted_activities!inner(extractions!inner(project_id))")
            .eq("extracted_activities.extractions.project_id", str(project_id)),
            table="unmatched_activities",
            operation="analytics.list_unmatched",
        )

        unmatched_breakdown = UnmatchedBreakdown()
        for u in unmatched_rows:
            res_val = u.get("resolution")
            if res_val == "unresolved" or res_val is None:
                unmatched_breakdown.unresolved += 1
            elif res_val == "marked_new_activity":
                unmatched_breakdown.marked_new_activity += 1
            elif res_val == "manually_linked":
                unmatched_breakdown.manually_linked += 1

        # 6. Audit Trail Events
        total_audit_events = execute_count(
            supabase.table("audit_trail").select("id", count="exact").eq("project_id", str(project_id)),
            table="audit_trail",
            operation="analytics.count_audit",
        )

        return AnalyticsOut(
            total_planned_activities=total_planned,
            total_extractions=total_extractions,
            total_extracted_activities=total_extracted_activities,
            total_matches=len(match_rows),
            matches_by_status=matches_breakdown,
            total_unmatched=len(unmatched_rows),
            unmatched_by_resolution=unmatched_breakdown,
            total_audit_events=total_audit_events,
            average_match_confidence=avg_confidence,
        )
    except PersistenceError as exc:
        logger.error("Error computing analytics: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=exc.public_detail,
        ) from exc
