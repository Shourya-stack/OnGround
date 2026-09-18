"""
Analytics route: GET /analytics
Derives aggregate metrics and progress statistics from the actual 7-table schema.
Traceable directly to stored records: schedule_plan, extractions, extracted_activities,
schedule_matches, unmatched_activities, and audit_trail.
"""

import logging
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Query, HTTPException, status, Depends
from backend.models.schemas import AnalyticsOut, MatchesBreakdown, UnmatchedBreakdown, CurrentUser
from backend.db.supabase_client import get_supabase_client
from backend.auth.security import require_any_authenticated

router = APIRouter(prefix="", tags=["Analytics"])
logger = logging.getLogger("onground.analytics")


@router.get("/analytics", response_model=AnalyticsOut)
async def get_analytics(
    project_id: Optional[UUID] = Query(None, description="Filter analytics by project ID"),
    current_user: CurrentUser = Depends(require_any_authenticated),
):
    """
    Computes summary analytics from the current database state across all 7 operational tables.
    Protected with Supabase Bearer JWT authentication.
    """
    supabase = get_supabase_client()
    if not supabase:
        logger.info("Supabase client unavailable, returning zeroed analytics model.")
        return AnalyticsOut()

    try:
        # 1. Planned Activities
        plan_query = supabase.table("schedule_plan").select("id", count="exact")
        if project_id:
            plan_query = plan_query.eq("project_id", str(project_id))
        plan_res = plan_query.execute()
        total_planned = plan_res.count if plan_res.count is not None else len(plan_res.data or [])

        # 2. Extractions (Reports)
        ext_query = supabase.table("extractions").select("id", count="exact")
        if project_id:
            ext_query = ext_query.eq("project_id", str(project_id))
        ext_res = ext_query.execute()
        total_extractions = ext_res.count if ext_res.count is not None else len(ext_res.data or [])

        # 3. Extracted Activities
        act_res = supabase.table("extracted_activities").select("id", count="exact").execute()
        total_extracted_activities = act_res.count if act_res.count is not None else len(act_res.data or [])

        # 4. Matches & Status Breakdown & Average Confidence
        matches_res = supabase.table("schedule_matches").select("status, confidence_score").execute()
        match_data = matches_res.data or []
        total_matches = len(match_data)

        matches_breakdown = MatchesBreakdown()
        confidence_scores = []

        for m in match_data:
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
        unmatched_res = supabase.table("unmatched_activities").select("resolution").execute()
        unmatched_data = unmatched_res.data or []
        total_unmatched = len(unmatched_data)

        unmatched_breakdown = UnmatchedBreakdown()
        for u in unmatched_data:
            res_val = u.get("resolution")
            if res_val == "unresolved":
                unmatched_breakdown.unresolved += 1
            elif res_val == "marked_new_activity":
                unmatched_breakdown.marked_new_activity += 1
            elif res_val == "manually_linked":
                unmatched_breakdown.manually_linked += 1

        # 6. Audit Trail Events
        audit_res = supabase.table("audit_trail").select("id", count="exact").execute()
        total_audit_events = audit_res.count if audit_res.count is not None else len(audit_res.data or [])

        return AnalyticsOut(
            total_planned_activities=total_planned,
            total_extractions=total_extractions,
            total_extracted_activities=total_extracted_activities,
            total_matches=total_matches,
            matches_by_status=matches_breakdown,
            total_unmatched=total_unmatched,
            unmatched_by_resolution=unmatched_breakdown,
            total_audit_events=total_audit_events,
            average_match_confidence=avg_confidence,
        )
    except Exception as e:
        logger.error(f"Error computing analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to calculate analytics.",
        )
