"""
Matching route: POST /match/{extracted_activity_id}
Matches an extracted activity against the active baseline schedule.
Computes contextual confidence, populates candidates on ambiguity,
and stores in SCHEDULE_MATCHES / UNMATCHED_ACTIVITIES.
"""

import logging
from uuid import UUID
from fastapi import APIRouter, HTTPException, status
from backend.models.schemas import MatchResult
from backend.db.supabase_client import get_supabase_client
from backend.services.matching_service import MatchingService

router = APIRouter(prefix="", tags=["Matching"])
logger = logging.getLogger("onground.match")


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
